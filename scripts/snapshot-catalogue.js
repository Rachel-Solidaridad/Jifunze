#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * One-off helper: extract the COURSES + CLUSTERS arrays from src/App.jsx
 * and dump them to scripts/catalogue.snapshot.json so the backfill script
 * can consume them without pulling in React.
 *
 * Usage:
 *   node scripts/snapshot-catalogue.js > scripts/catalogue.snapshot.json
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const appJsx = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'App.jsx'),
  'utf8',
);

function extractArray(src, declaration) {
  const start = src.indexOf(declaration);
  if (start < 0) throw new Error(`could not find ${declaration}`);
  const openBracket = src.indexOf('[', start);
  let depth = 0;
  let inString = false;
  let stringChar = null;
  let inLineComment = false;
  let inBlockComment = false;
  let inTemplate = false;
  for (let i = openBracket; i < src.length; i++) {
    const c = src[i];
    const next = src[i + 1];
    if (inLineComment) { if (c === '\n') inLineComment = false; continue; }
    if (inBlockComment) { if (c === '*' && next === '/') { inBlockComment = false; i++; } continue; }
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
    if (c === '/' && next === '/') { inLineComment = true; i++; continue; }
    if (c === '/' && next === '*') { inBlockComment = true; i++; continue; }
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

const coursesSrc = extractArray(appJsx, 'const COURSES = [');
const clustersSrc = extractArray(appJsx, 'const CLUSTERS = [');

// Stub everything COURSES/CLUSTERS references — lucide icons, image vars,
// helpers — to null. The badge catalogue only needs id, title, category,
// placeholder, lessons[].id and quiz[].length.
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

const script = `
  const COURSES = ${coursesSrc};
  const CLUSTERS = ${clustersSrc};
  module.exports = { courses: COURSES, clusters: CLUSTERS };
`;

try {
  vm.createContext(proxy);
  vm.runInContext(script, proxy);
} catch (e) {
  console.error('Eval failed:', e.message);
  process.exit(1);
}

const out = sandbox.module.exports;
const courses = out.courses.map(c => ({
  id: c.id,
  category: c.category,
  placeholder: !!c.placeholder,
  lessons: (c.lessons || []).map(l => ({ id: l.id })),
  quiz: (c.quiz || []).map(() => 1),
}));
const clusters = out.clusters.map(cl => ({
  name: cl.name,
  courseIds: cl.courseIds || [],
  subClusters: (cl.subClusters || []).map(sc => ({
    name: sc.name,
    courseIds: sc.courseIds || [],
  })),
}));

process.stdout.write(JSON.stringify({ courses, clusters }, null, 2));
