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

// Also find every `COURSES.push(...)` call and capture the argument list so
// the snapshot includes courses added after the initial literal. Reuses the
// same brace-balanced walker as extractArray.
function extractPushArgs(src, anchor) {
  const out = [];
  let from = 0;
  while (true) {
    const idx = src.indexOf(anchor, from);
    if (idx < 0) break;
    // Find the '(' that opens the args list (skip whitespace).
    let openParen = idx + anchor.length;
    while (openParen < src.length && src[openParen] !== '(') openParen++;
    if (src[openParen] !== '(') { from = idx + 1; continue; }
    // Walk to matching close paren.
    let depth = 0;
    let inString = false, stringChar = null;
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
    // Args literal between parens, exclusive.
    out.push(src.slice(openParen + 1, endIdx));
    from = endIdx + 1;
  }
  return out;
}

const pushArgs = extractPushArgs(appJsx, 'COURSES.push');

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

// Build a synthetic source that mimics App.jsx's COURSES.push pattern by
// pushing every captured argument list. push(a, b, c) is supported because
// we splice the raw arg text directly back in.
const pushStatements = pushArgs.map((args, i) => `COURSES.push(${args});`).join('\n');

const script = `
  const COURSES = ${coursesSrc};
  ${pushStatements}
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
  title: c.title || c.id,
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
