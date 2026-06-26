#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * One-off achievement backfill for Jifunze.
 *
 * Iterates every user under /users, reads their /progress and existing
 * /achievements, then writes any badges they're eligible for that haven't
 * been written yet. Idempotent: re-running it never duplicates a badge.
 *
 * Run once after deploying the achievements feature so existing learners
 * retroactively receive badges for what they've already completed.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json \
 *     node scripts/backfill-achievements.js [--dry-run]
 *
 * Or via gcloud ADC:
 *   gcloud auth application-default login
 *   node scripts/backfill-achievements.js
 */

const path = require('path');
const admin = require('firebase-admin');
require('esbuild-register/dist/node').register({ target: 'node18' });

// Re-use the live badge catalogue + eligibility predicates. The awards
// module is ESM + browser-targeted, but the predicates only depend on
// pure JS data — esbuild-register transpiles the import on the fly.
const { buildBadgeCatalogue } = require(path.join(__dirname, '..', 'src', 'achievements', 'awards.js'));

// COURSES + CLUSTERS live in App.jsx. They are pure constants but the file
// also pulls in React, assets, etc — too heavy to require() in Node.
// For the backfill we read the same constants from a small JSON-ish snapshot
// that the script consumer is expected to keep in sync, or we accept a
// --catalogue argument pointing at a JSON file with { courses, clusters }.
// For simplicity in this first version we read from a small bundled
// snapshot script that does `module.exports = { COURSES, CLUSTERS }`.
function loadCatalogue() {
  const file = path.join(__dirname, 'catalogue.snapshot.json');
  // eslint-disable-next-line global-require
  const fs = require('fs');
  if (!fs.existsSync(file)) {
    throw new Error(
      `Missing ${file}. Generate it with:\n` +
      `  node scripts/snapshot-catalogue.js > scripts/catalogue.snapshot.json\n` +
      `or paste the COURSES and CLUSTERS arrays into a JSON file by hand.`
    );
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function computeCompletion(course, p = {}) {
  if (!course || !Array.isArray(course.lessons)) return 0;
  const totalSteps = course.lessons.length + 2;
  let done = 0;
  course.lessons.forEach(l => { if (p[`lesson-${l.id}`]) done++; });
  if (p.interactive) done++;
  // Quiz counts as done only when passed (>= 80%).
  const q = p.quiz;
  const total = course.quiz?.length || 0;
  const quizPassed = q && (typeof q.passed === 'boolean'
    ? q.passed
    : total > 0 && (q.score || 0) / total >= 0.8);
  if (quizPassed) done++;
  return Math.round((done / totalSteps) * 100);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
  const db = admin.firestore();

  const { courses: COURSES, clusters: CLUSTERS } = loadCatalogue();
  const liveCourses = COURSES.filter(c => !c.placeholder);

  console.log(`Backfill starting${dryRun ? ' (DRY RUN — no writes)' : ''}`);
  console.log(`Catalogue: ${COURSES.length} courses (${liveCourses.length} live), ${CLUSTERS.length} clusters`);

  const usersSnap = await db.collection('users').get();
  console.log(`Found ${usersSnap.size} users`);

  let processedUsers = 0;
  let totalWrites = 0;

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;

    const [progressSnap, achievementsSnap] = await Promise.all([
      db.collection('users').doc(uid).collection('progress').get(),
      db.collection('users').doc(uid).collection('achievements').get(),
    ]);

    const progress = {};
    progressSnap.forEach(d => { progress[d.id] = d.data(); });

    const existingIds = new Set();
    achievementsSnap.forEach(d => existingIds.add(d.id));

    // Build ctx in the shape buildBadgeCatalogue + predicates expect.
    const ctx = {
      courseCompletion: (id) => {
        const cc = COURSES.find(x => x.id === id);
        return computeCompletion(cc, progress[id] || {});
      },
      allCourses: COURSES,
      allClusters: CLUSTERS,
      progress,
      allComplete: liveCourses.every(c => computeCompletion(c, progress[c.id] || {}) === 100),
      achievementIds: existingIds,
    };

    const catalogue = buildBadgeCatalogue(COURSES, CLUSTERS);
    const toWrite = [];
    for (const badge of catalogue) {
      if (existingIds.has(badge.id)) continue;
      let eligible;
      try { eligible = badge.isUnlocked(ctx); } catch { eligible = false; }
      if (!eligible) continue;
      toWrite.push(badge);
    }

    if (toWrite.length === 0) {
      processedUsers++;
      continue;
    }

    if (dryRun) {
      console.log(`[dry-run] ${uid}: would write ${toWrite.length} badge(s): ${toWrite.map(b => b.id).join(', ')}`);
    } else {
      const batch = db.batch();
      for (const badge of toWrite) {
        const ref = db
          .collection('users').doc(uid)
          .collection('achievements').doc(badge.id);
        batch.set(ref, {
          type: badge.type,
          achievementId: badge.id,
          title: badge.title,
          description: badge.description,
          icon: badge.icon,
          awardedAt: admin.firestore.FieldValue.serverTimestamp(),
          awardedFor: badge.meta || {},
        });
      }
      await batch.commit();
      console.log(`${uid}: wrote ${toWrite.length} badge(s)`);
    }

    totalWrites += toWrite.length;
    processedUsers++;
  }

  console.log(`Done. Users processed: ${processedUsers}. Badge writes: ${totalWrites}.`);
}

main().catch(err => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
