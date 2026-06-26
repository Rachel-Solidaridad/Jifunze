#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Course validator + duration estimator for Jifunze.
 *
 * Extracts COURSES + CLUSTERS from src/App.jsx (same approach as
 * snapshot-catalogue.cjs), then checks every course for:
 *   - Required fields (id, title, category, duration, lessons, quiz)
 *   - Unique lesson IDs within a course
 *   - Quiz answer indices in range; non-empty options
 *   - Interactive scenarios have at least one correct option per scenario
 *   - Cluster courseIds all reference existing courses (placeholder or not)
 *   - placeholder courses don't reference lessons/interactive/quiz
 *
 * Then estimates duration from word count + quiz/scenario time and reports
 * any stated duration that's more than ~30% off the estimate.
 *
 * Usage:
 *   node scripts/validate-courses.cjs
 *   node scripts/validate-courses.cjs --json   (machine-readable output)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Calibrated for dense technical content with stats, lists, callouts and
// pathway/value blocks that learners pause on. 220 WPM is news-prose
// reading; this material reads at roughly half that pace.
const READING_WPM = 110;
const QUIZ_SEC = 50;          // read question + 4 options + decide
const SCENARIO_SEC = 95;      // read situation + 3 options w/ feedback + pick
const LESSON_OVERHEAD_SEC = 40; // per-lesson nav/scan/page transitions
const TOLERANCE_PCT = 30;     // flag duration mismatch if > this %

// ----------------------------------------------------------------------------
// Extract COURSES + CLUSTERS from App.jsx
// ----------------------------------------------------------------------------

const appJsx = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'App.jsx'),
  'utf8',
);

function extractArray(src, declaration) {
  const start = src.indexOf(declaration);
  if (start < 0) throw new Error(`could not find ${declaration}`);
  const openBracket = src.indexOf('[', start);
  let depth = 0, inString = false, stringChar = null;
  let inLine = false, inBlock = false, inTemplate = false;
  for (let i = openBracket; i < src.length; i++) {
    const c = src[i], next = src[i + 1];
    if (inLine) { if (c === '\n') inLine = false; continue; }
    if (inBlock) { if (c === '*' && next === '/') { inBlock = false; i++; } continue; }
    if (inString) {
      if (c === '\\') { i++; continue; }
      if (c === stringChar) inString = false;
      continue;
    }
    if (inTemplate) {
      if (c === '\\') { i++; continue; }
      if (c === '`') inTemplate = false;
      continue;
    }
    if (c === '/' && next === '/') { inLine = true; i++; continue; }
    if (c === '/' && next === '*') { inBlock = true; i++; continue; }
    if (c === "'" || c === '"') { inString = true; stringChar = c; continue; }
    if (c === '`') { inTemplate = true; continue; }
    if (c === '[' || c === '{' || c === '(') depth++;
    else if (c === ']' || c === '}' || c === ')') {
      depth--;
      if (depth === 0 && c === ']') return src.slice(openBracket, i + 1);
    }
  }
  throw new Error(`unterminated array starting at ${start}`);
}

function extractPushArgs(src, anchor) {
  const out = [];
  let from = 0;
  while (true) {
    const idx = src.indexOf(anchor, from);
    if (idx < 0) break;
    let openParen = idx + anchor.length;
    while (openParen < src.length && src[openParen] !== '(') openParen++;
    if (src[openParen] !== '(') { from = idx + 1; continue; }
    let depth = 0, inString = false, stringChar = null;
    let inLine = false, inBlock = false, inTemplate = false;
    let endIdx = -1;
    for (let i = openParen; i < src.length; i++) {
      const c = src[i], next = src[i + 1];
      if (inLine) { if (c === '\n') inLine = false; continue; }
      if (inBlock) { if (c === '*' && next === '/') { inBlock = false; i++; } continue; }
      if (inString) {
        if (c === '\\') { i++; continue; }
        if (c === stringChar) inString = false;
        continue;
      }
      if (inTemplate) {
        if (c === '\\') { i++; continue; }
        if (c === '`') inTemplate = false;
        continue;
      }
      if (c === '/' && next === '/') { inLine = true; i++; continue; }
      if (c === '/' && next === '*') { inBlock = true; i++; continue; }
      if (c === "'" || c === '"') { inString = true; stringChar = c; continue; }
      if (c === '`') { inTemplate = true; continue; }
      if (c === '(' || c === '[' || c === '{') depth++;
      else if (c === ')' || c === ']' || c === '}') {
        depth--;
        if (depth === 0 && c === ')') { endIdx = i; break; }
      }
    }
    if (endIdx < 0) break;
    out.push(src.slice(openParen + 1, endIdx));
    from = endIdx + 1;
  }
  return out;
}

const coursesSrc = extractArray(appJsx, 'const COURSES = [');
const clustersSrc = extractArray(appJsx, 'const CLUSTERS = [');
const pushArgs = extractPushArgs(appJsx, 'COURSES.push');

const sandbox = { module: { exports: {} }, console };
const handler = {
  get: (target, name) => {
    if (name === Symbol.toPrimitive) return () => null;
    if (name in target) return target[name];
    return null;
  },
};
const proxy = new Proxy(sandbox, handler);
proxy.commodityIcon = () => null;

const pushStatements = pushArgs.map(args => `COURSES.push(${args});`).join('\n');
const script = `
  const COURSES = ${coursesSrc};
  ${pushStatements}
  const CLUSTERS = ${clustersSrc};
  module.exports = { courses: COURSES, clusters: CLUSTERS };
`;

vm.createContext(proxy);
vm.runInContext(script, proxy);
const { courses: COURSES, clusters: CLUSTERS } = sandbox.module.exports;

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function wordsIn(value) {
  if (value == null) return 0;
  if (typeof value === 'string') return value.trim().split(/\s+/).filter(Boolean).length;
  if (Array.isArray(value)) return value.reduce((s, v) => s + wordsIn(v), 0);
  if (typeof value === 'object') return Object.values(value).reduce((s, v) => s + wordsIn(v), 0);
  return 0;
}

function wordsInBlock(block) {
  if (!block || typeof block !== 'object') return 0;
  let n = 0;
  if (block.text) n += wordsIn(block.text);
  if (block.title) n += wordsIn(block.title);
  if (block.label) n += wordsIn(block.label);
  if (block.detail) n += wordsIn(block.detail);
  if (block.number) n += 1;
  if (Array.isArray(block.items)) n += wordsIn(block.items);
  return n;
}

function lessonWordCount(lesson) {
  let n = wordsIn(lesson.title);
  for (const b of (lesson.content || [])) n += wordsInBlock(b);
  return n;
}

function estimateMinutes(course) {
  if (course.placeholder) return null;
  const lessons = course.lessons || [];
  const wordTotal = lessons.reduce((s, l) => s + lessonWordCount(l), 0);
  const readingMin = wordTotal / READING_WPM;
  const lessonOverheadMin = (lessons.length * LESSON_OVERHEAD_SEC) / 60;
  const quizCount = (course.quiz || []).length;
  const scenarioCount = (course.interactive?.scenarios || []).length;
  const quizMin = (quizCount * QUIZ_SEC) / 60;
  const scenarioMin = (scenarioCount * SCENARIO_SEC) / 60;
  return readingMin + lessonOverheadMin + quizMin + scenarioMin;
}

// Parse stated duration string ("45 min", "1 hr 10 min", "20 min", "1 hr").
function parseStated(str) {
  if (!str) return null;
  const s = str.toLowerCase();
  let minutes = 0;
  const hr = s.match(/(\d+(?:\.\d+)?)\s*hr/);
  const mn = s.match(/(\d+(?:\.\d+)?)\s*min/);
  if (hr) minutes += parseFloat(hr[1]) * 60;
  if (mn) minutes += parseFloat(mn[1]);
  if (!hr && !mn) {
    const n = parseFloat(s);
    if (Number.isFinite(n)) minutes = n;
  }
  return minutes || null;
}

function formatMinutes(min) {
  const m = Math.round(min);
  if (m < 60) return `${m} min`;
  const hours = Math.floor(m / 60);
  const rem = m - hours * 60;
  return rem === 0 ? `${hours} hr` : `${hours} hr ${rem} min`;
}

// ----------------------------------------------------------------------------
// Validation
// ----------------------------------------------------------------------------

const issues = []; // { courseId, severity: 'error'|'warn'|'info', message }

function issue(courseId, severity, message) {
  issues.push({ courseId, severity, message });
}

// Course ID uniqueness
const seen = new Set();
for (const c of COURSES) {
  if (!c || !c.id) {
    issue('?', 'error', 'Course has no id');
    continue;
  }
  if (seen.has(c.id)) issue(c.id, 'error', 'Duplicate course id');
  seen.add(c.id);
}

const VALID_BLOCK_TYPES = new Set([
  'p', 'h', 'list', 'callout', 'pathway', 'value', 'stat',
  'highlight', 'pillar', 'strategy', 'cluster', 'colour', 'ambition',
  'country', 'outcome', 'finance',
]);

for (const c of COURSES) {
  if (!c) continue;
  if (c.placeholder) {
    if (!c.title) issue(c.id, 'error', 'Placeholder missing title');
    if (!c.category) issue(c.id, 'warn', 'Placeholder missing category');
    if (c.lessons || c.quiz || c.interactive) {
      issue(c.id, 'warn', 'Placeholder unexpectedly defines lessons/quiz/interactive');
    }
    continue;
  }
  if (!c.title)    issue(c.id, 'error', 'Missing title');
  if (!c.category) issue(c.id, 'warn', 'Missing category');
  if (!c.duration) issue(c.id, 'warn', 'Missing duration');
  if (!Array.isArray(c.lessons) || c.lessons.length === 0) {
    issue(c.id, 'error', 'Missing lessons array');
    continue;
  }

  const lessonIds = new Set();
  c.lessons.forEach((l, i) => {
    if (!l.id) issue(c.id, 'error', `Lesson ${i} has no id`);
    else if (lessonIds.has(l.id)) issue(c.id, 'error', `Duplicate lesson id "${l.id}"`);
    else lessonIds.add(l.id);
    if (!l.title) issue(c.id, 'warn', `Lesson "${l.id}" has no title`);
    if (!Array.isArray(l.content)) {
      issue(c.id, 'error', `Lesson "${l.id}" has no content array`);
    } else {
      l.content.forEach((b, j) => {
        if (!b || !b.type) {
          issue(c.id, 'error', `Lesson "${l.id}" content[${j}] has no type`);
          return;
        }
        if (!VALID_BLOCK_TYPES.has(b.type)) {
          issue(c.id, 'warn', `Lesson "${l.id}" content[${j}] uses unknown type "${b.type}"`);
        }
      });
    }
  });

  if (c.interactive) {
    const scs = c.interactive?.scenarios || [];
    if (!Array.isArray(scs)) {
      issue(c.id, 'error', 'Interactive .scenarios is not an array');
    } else if (scs.length === 0) {
      issue(c.id, 'warn', 'Interactive has zero scenarios');
    } else {
      scs.forEach((s, i) => {
        if (!s.situation) issue(c.id, 'error', `Scenario ${i} missing situation`);
        if (!Array.isArray(s.options) || s.options.length < 2) {
          issue(c.id, 'error', `Scenario ${i} needs at least 2 options`);
          return;
        }
        const correct = s.options.filter(o => o.correct === true).length;
        if (correct !== 1) {
          issue(c.id, 'error', `Scenario ${i} should have exactly 1 correct option (has ${correct})`);
        }
        s.options.forEach((o, j) => {
          if (!o.text) issue(c.id, 'error', `Scenario ${i} option ${j} missing text`);
          if (!o.feedback) issue(c.id, 'warn', `Scenario ${i} option ${j} missing feedback`);
        });
      });
    }
  }

  if (Array.isArray(c.quiz)) {
    c.quiz.forEach((q, i) => {
      if (!q.q) issue(c.id, 'error', `Quiz ${i} missing question text`);
      if (!Array.isArray(q.options) || q.options.length < 2) {
        issue(c.id, 'error', `Quiz ${i} needs at least 2 options`);
        return;
      }
      const ans = q.answer;
      if (typeof ans !== 'number' || ans < 0 || ans >= q.options.length) {
        issue(c.id, 'error', `Quiz ${i} answer index ${ans} out of range (0..${q.options.length - 1})`);
      }
    });
  }
}

// Cluster refs
const allIds = new Set(COURSES.filter(c => c).map(c => c.id));
function checkClusterCourses(name, ids) {
  for (const id of (ids || [])) {
    if (!allIds.has(id)) issue('CLUSTERS', 'error', `Cluster "${name}" references missing course "${id}"`);
  }
}
for (const cl of CLUSTERS) {
  checkClusterCourses(cl.name, cl.courseIds);
  for (const sc of (cl.subClusters || [])) {
    checkClusterCourses(`${cl.name} / ${sc.name}`, sc.courseIds);
  }
}

// ----------------------------------------------------------------------------
// Duration estimation
// ----------------------------------------------------------------------------

const durations = [];
for (const c of COURSES) {
  if (!c || c.placeholder) continue;
  const stated = parseStated(c.duration);
  const estimated = estimateMinutes(c);
  if (estimated == null) continue;
  const diffPct = stated ? Math.round(((estimated - stated) / stated) * 100) : null;
  durations.push({
    id: c.id,
    title: c.title,
    statedRaw: c.duration,
    statedMin: stated,
    estimatedMin: estimated,
    diffPct,
    lessons: (c.lessons || []).length,
    quiz: (c.quiz || []).length,
    scenarios: (c.interactive?.scenarios || []).length,
    suggestion: formatMinutes(estimated),
  });
}

// ----------------------------------------------------------------------------
// Report
// ----------------------------------------------------------------------------

const flagged = durations.filter(d => d.diffPct != null && Math.abs(d.diffPct) > TOLERANCE_PCT);

if (process.argv.includes('--json')) {
  process.stdout.write(JSON.stringify({ issues, durations, flagged }, null, 2));
  process.exit(issues.filter(i => i.severity === 'error').length ? 1 : 0);
}

const total = COURSES.length;
const live = COURSES.filter(c => c && !c.placeholder).length;
console.log(`\nValidated ${total} courses (${live} live, ${total - live} placeholders).`);

const errors = issues.filter(i => i.severity === 'error');
const warnings = issues.filter(i => i.severity === 'warn');
console.log(`Issues: ${errors.length} error(s), ${warnings.length} warning(s).`);

if (errors.length) {
  console.log('\nERRORS');
  for (const i of errors) console.log(`  ✗ [${i.courseId}] ${i.message}`);
}
if (warnings.length) {
  console.log('\nWARNINGS');
  for (const i of warnings) console.log(`  ⚠ [${i.courseId}] ${i.message}`);
}

console.log(`\nDuration estimates (tolerance ±${TOLERANCE_PCT}%):`);
const widthId = Math.max(...durations.map(d => d.id.length));
const widthRaw = Math.max(...durations.map(d => d.statedRaw?.length || 0));
console.log(
  '  ' +
  'ID'.padEnd(widthId) + '  ' +
  'STATED'.padEnd(widthRaw) + '  ' +
  'ESTIMATED'.padEnd(10) + '  ' +
  'DIFF'.padEnd(6) + '  ' +
  'L'.padStart(3) + ' ' +
  'Q'.padStart(3) + ' ' +
  'S'.padStart(3),
);
for (const d of durations.sort((a, b) => Math.abs((b.diffPct || 0)) - Math.abs((a.diffPct || 0)))) {
  const flag = d.diffPct != null && Math.abs(d.diffPct) > TOLERANCE_PCT ? ' ⚠' : '  ';
  console.log(
    flag + d.id.padEnd(widthId) + '  ' +
    (d.statedRaw || '?').padEnd(widthRaw) + '  ' +
    (d.suggestion || '?').padEnd(10) + '  ' +
    (d.diffPct != null ? (d.diffPct > 0 ? '+' : '') + d.diffPct + '%' : '?').padEnd(6) + '  ' +
    String(d.lessons).padStart(3) + ' ' +
    String(d.quiz).padStart(3) + ' ' +
    String(d.scenarios).padStart(3),
  );
}

console.log(`\nFlagged ${flagged.length} course(s) with stated vs estimated duration > ±${TOLERANCE_PCT}%.`);
process.exit(errors.length ? 1 : 0);
