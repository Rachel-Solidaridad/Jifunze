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
 *     node scripts/backfill-achievements.cjs [--dry-run]
 *
 * Or via gcloud ADC:
 *   gcloud auth application-default login --project jifunze-7dbfe
 *   node scripts/backfill-achievements.cjs
 *
 * Pre-req: regenerate the catalogue snapshot first
 *   node scripts/snapshot-catalogue.cjs > scripts/catalogue.snapshot.json
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const adminApp = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// ----------------------------------------------------------------------------
// Catalogue (mirrors src/achievements/awards.js; kept Node-pure to avoid
// pulling in browser-side Firebase client modules)
// ----------------------------------------------------------------------------

const MASTERY_PCT = 95;

function clusterCourseIds(cluster, allCourses) {
  const liveSet = new Set(allCourses.filter(c => !c.placeholder).map(c => c.id));
  const ids = [...(cluster.courseIds || [])];
  for (const sc of (cluster.subClusters || [])) {
    ids.push(...(sc.courseIds || []));
  }
  return ids.filter(id => liveSet.has(id));
}

function clusterSlug(name) {
  return name.toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const CLUSTER_BADGE_TITLES = {
  'Strategy & Organisational Excellence': 'Strategy Practitioner',
  'Governance, Ethics & Compliance':      'Integrity Steward',
  'Innovation & Strategic Transformation':'Systems Innovator',
  'Gender, Equality & Social Inclusion':  'Gender & Inclusion Advocate',
  'Nature-Based Solutions':               'Climate & Nature Specialist',
  'Commodities':                          'Commodities Specialist',
  'Sustainability & Responsible Business':'Sustainable Business Champion',
};

function clusterBadgeTitle(cluster) {
  return CLUSTER_BADGE_TITLES[cluster.name] || `${cluster.name} Specialist`;
}

function buildBadgeCatalogue(allCourses, allClusters) {
  const liveCourses = allCourses.filter(c => !c.placeholder);
  const catalogue = [];

  for (const c of liveCourses) {
    catalogue.push({
      id: `course:${c.id}`,
      type: 'course',
      category: 'Course Completion',
      title: `${c.title || c.id} — Complete`,
      description: `Finished every module, scenario and quiz of ${c.title || c.id}.`,
      icon: 'Award',
      meta: { courseId: c.id },
      isUnlocked: (ctx) => ctx.courseCompletion(c.id) === 100,
    });
  }
  for (const c of liveCourses) {
    catalogue.push({
      id: `mastery:${c.id}`,
      type: 'mastery',
      category: 'Mastery',
      title: `${c.title || c.id} — Mastery`,
      description: `Scored ${MASTERY_PCT}% or higher on the ${c.title || c.id} quiz.`,
      icon: 'Trophy',
      meta: { courseId: c.id },
      isUnlocked: (ctx) => {
        const q = ctx.progress?.[c.id]?.quiz;
        const total = (c.quiz || []).length;
        if (!q || !total || q.score == null) return false;
        return (q.score / total) * 100 >= MASTERY_PCT;
      },
    });
  }
  for (const cluster of allClusters) {
    const ids = clusterCourseIds(cluster, allCourses);
    if (ids.length === 0) continue;
    catalogue.push({
      id: `cluster:${clusterSlug(cluster.name)}`,
      type: 'cluster',
      category: 'Cluster Breadth',
      title: clusterBadgeTitle(cluster),
      description: `Completed every live course in the ${cluster.name} cluster (${ids.length} courses).`,
      icon: 'Layers',
      meta: { clusterName: cluster.name, courseIds: ids },
      isUnlocked: (ctx) => ids.every(id => ctx.courseCompletion(id) === 100),
    });
  }
  catalogue.push({
    id: 'master',
    type: 'master',
    category: 'Master Learner',
    title: 'Master Learner',
    description: `Completed every live course on Jifunze (${liveCourses.length}). The rarest badge.`,
    icon: 'Sparkles',
    meta: {},
    isUnlocked: (ctx) => ctx.allComplete === true,
  });
  const milestones = [
    { id: 'milestone:first-course',  title: 'First Course',       desc: 'Completed your first Jifunze course.', n: 1 },
    { id: 'milestone:five-courses',  title: 'Five-Course Streak', desc: 'Completed five Jifunze courses.',     n: 5 },
    { id: 'milestone:ten-courses',   title: 'Ten-Course Streak',  desc: 'Completed ten Jifunze courses.',      n: 10 },
  ];
  for (const m of milestones) {
    catalogue.push({
      id: m.id,
      type: 'milestone',
      category: 'Milestones',
      title: m.title,
      description: m.desc,
      icon: 'CheckCircle2',
      meta: { milestoneN: m.n },
      isUnlocked: (ctx) => liveCourses.filter(c => ctx.courseCompletion(c.id) === 100).length >= m.n,
    });
  }
  catalogue.push({
    id: 'milestone:three-clusters',
    type: 'milestone',
    category: 'Milestones',
    title: 'Cross-Cluster Learner',
    description: 'Completed at least one course across three or more different clusters.',
    icon: 'Globe',
    meta: {},
    isUnlocked: (ctx) => {
      let hit = 0;
      for (const cluster of allClusters) {
        const ids = clusterCourseIds(cluster, allCourses);
        if (ids.some(id => ctx.courseCompletion(id) === 100)) hit++;
      }
      return hit >= 3;
    },
  });

  return catalogue;
}

function computeCompletion(course, p = {}) {
  if (!course || !Array.isArray(course.lessons)) return 0;
  const totalSteps = course.lessons.length + 2;
  let done = 0;
  course.lessons.forEach(l => { if (p[`lesson-${l.id}`]) done++; });
  if (p.interactive) done++;
  const q = p.quiz;
  const total = (course.quiz || []).length;
  const quizPassed = q && (typeof q.passed === 'boolean'
    ? q.passed
    : total > 0 && (q.score || 0) / total >= 0.8);
  if (quizPassed) done++;
  return Math.round((done / totalSteps) * 100);
}

function loadCatalogue() {
  const file = path.join(__dirname, 'catalogue.snapshot.json');
  if (!fs.existsSync(file)) {
    throw new Error(
      `Missing ${file}. Generate it first with:\n` +
      `  node scripts/snapshot-catalogue.cjs > scripts/catalogue.snapshot.json`,
    );
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  if (admin.getApps().length === 0) {
    // Prefer Application Default Credentials (service account JSON via
    // GOOGLE_APPLICATION_CREDENTIALS, or `gcloud auth application-default
    // login`). Fall back to the firebase-tools CLI refresh token if the
    // CLI is logged in but ADC isn't configured — the typical state on a
    // dev machine that has just been deploying rules with `firebase deploy`.
    let credential = null;
    try {
      credential = adminApp.applicationDefault();
      // Probe by requesting a token so we fail fast when ADC isn't set up,
      // before any Firestore call is attempted.
      await credential.getAccessToken();
    } catch (e) {
      const cfgPath = path.join(
        process.env.HOME || '',
        '.config',
        'configstore',
        'firebase-tools.json',
      );
      if (!fs.existsSync(cfgPath)) {
        throw new Error(
          'No Application Default Credentials AND no firebase-tools login on this machine.\n' +
          'Run either:\n' +
          '  gcloud auth application-default login --project jifunze-7dbfe\n' +
          'or:\n' +
          '  firebase login\n',
        );
      }
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      if (!cfg.tokens?.refresh_token) {
        throw new Error(`firebase-tools config at ${cfgPath} has no refresh_token`);
      }
      // Write a temporary credentials JSON in the firebase-tools format and
      // load it via refreshToken(). The client id/secret are the public desktop
      // OAuth credentials the Firebase CLI uses, so this works without any
      // additional setup on a machine where `firebase login` has been run.
      const tmpFile = path.join(__dirname, '.firebase-cli-credentials.json');
      fs.writeFileSync(tmpFile, JSON.stringify({
        type: 'authorized_user',
        client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
        client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
        refresh_token: cfg.tokens.refresh_token,
      }, null, 2), { mode: 0o600 });
      credential = adminApp.refreshToken(tmpFile);
      console.log(`Using firebase-tools refresh token for ${cfg.user?.email || 'current user'}`);
    }
    admin.initializeApp({ credential, projectId: 'jifunze-7dbfe' });
  }
  const db = getFirestore();

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

    const ctx = {
      courseCompletion: (id) => {
        const cc = COURSES.find(x => x.id === id);
        return computeCompletion(cc, progress[id] || {});
      },
      allCourses: COURSES,
      allClusters: CLUSTERS,
      progress,
      allComplete: liveCourses.length > 0 && liveCourses.every(c => computeCompletion(c, progress[c.id] || {}) === 100),
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
          awardedAt: FieldValue.serverTimestamp(),
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
