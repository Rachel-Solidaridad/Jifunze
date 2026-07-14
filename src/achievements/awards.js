// Jifunze achievements — badge catalogue, award triggers, tier derivation.
//
// REUSE PRINCIPLES (per the plan):
//  - Badge eligibility is derived from existing progress data already in
//    /users/{uid}/progress and /users/{uid}/certificates — no parallel
//    accounting.
//  - Badge docs at /users/{uid}/achievements/{achievementId} are write-once,
//    same shape and rule pattern as certificates.
//  - The catalogue is GENERATED from COURSES + CLUSTERS so adding a new
//    course or cluster automatically introduces its badges, no maintenance.

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const MASTERY_PCT = 95;   // mastery badge threshold (set above QUIZ_PASS_PCT)
const QUIZ_PASS_PCT = 80; // mirrors App.jsx; pass threshold for course-complete badge

// ---------------------------------------------------------------------------
// Cluster helpers
// ---------------------------------------------------------------------------

// Returns the flat list of courseIds for a top-level cluster — including
// sub-cluster courseIds. Excludes placeholder courses (they cannot be earned).
export function clusterCourseIds(cluster, allCourses) {
  const liveSet = new Set(allCourses.filter(c => !c.placeholder).map(c => c.id));
  const ids = [...(cluster.courseIds || [])];
  for (const sc of (cluster.subClusters || [])) {
    ids.push(...(sc.courseIds || []));
  }
  return ids.filter(id => liveSet.has(id));
}

// Slug for a cluster name → stable id (used in achievement doc ids).
function clusterSlug(name) {
  return name.toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Friendly title for a cluster-breadth badge. Falls back to a generic
// "<Cluster> Specialist" pattern; specific overrides for the known clusters
// give them voice.
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

// ---------------------------------------------------------------------------
// Catalogue — every possible badge a learner can earn
// ---------------------------------------------------------------------------

// Builds the full catalogue from COURSES + CLUSTERS. Returns an array of
// badge definitions; each has a stable id, type, title, description,
// lucide icon name, category label and an `isUnlocked(ctx)` predicate.
//
// ctx = { courseCompletion, allCourses, allClusters, certCount, allComplete,
//        progress, achievementIds }
//
// The predicate uses ONLY context already available in the React tree — no
// extra Firestore reads, no separate scoring system.
export function buildBadgeCatalogue(allCourses, allClusters) {
  const liveCourses = allCourses.filter(c => !c.placeholder);
  const catalogue = [];

  // --- Course Completion badges (one per live course) ----------------------
  for (const c of liveCourses) {
    catalogue.push({
      id: `course:${c.id}`,
      type: 'course',
      category: 'Course Completion',
      title: `${c.title} — Complete`,
      description: `Finished every module, scenario and quiz of ${c.title}.`,
      icon: 'Award',
      meta: { courseId: c.id },
      isUnlocked: (ctx) => ctx.courseCompletion(c.id) === 100,
    });
  }

  // --- Mastery badges (one per live course) --------------------------------
  // Requires BOTH: the course fully completed (every lesson + interactive +
  // a passed quiz, i.e. courseCompletion === 100) AND a quiz score ≥ 95%.
  // Completing the course is the floor; the high score is what elevates it to
  // "mastery" — you cannot master a course you have not finished.
  for (const c of liveCourses) {
    catalogue.push({
      id: `mastery:${c.id}`,
      type: 'mastery',
      category: 'Mastery',
      title: `${c.title} — Mastery`,
      description: `Completed ${c.title} and scored ${MASTERY_PCT}% or higher on its quiz.`,
      icon: 'Trophy',
      meta: { courseId: c.id },
      isUnlocked: (ctx) => {
        if (ctx.courseCompletion(c.id) !== 100) return false;
        const q = ctx.progress?.[c.id]?.quiz;
        const total = c.quiz?.length || 0;
        if (!q || !total || q.score == null) return false;
        return (q.score / total) * 100 >= MASTERY_PCT;
      },
    });
  }

  // --- Cluster Breadth badges (one per top-level cluster) ------------------
  for (const cluster of allClusters) {
    const ids = clusterCourseIds(cluster, allCourses);
    if (ids.length === 0) continue; // skip clusters with no live courses
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

  // --- Master Learner badge ------------------------------------------------
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

  // --- Milestone badges ----------------------------------------------------
  const milestones = [
    { id: 'milestone:first-course',  title: 'First Course',     desc: 'Completed your first Jifunze course.',                    n: 1 },
    { id: 'milestone:five-courses',  title: 'Five-Course Streak', desc: 'Completed five Jifunze courses.',                         n: 5 },
    { id: 'milestone:ten-courses',   title: 'Ten-Course Streak',  desc: 'Completed ten Jifunze courses.',                          n: 10 },
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

  // Breadth-across-clusters milestone.
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

// ---------------------------------------------------------------------------
// Award trigger — call after any progress write that might unlock a badge.
// Writes any newly-eligible badges to /users/{uid}/achievements/{id}.
// Idempotent: skips badges that already exist for the user.
// ---------------------------------------------------------------------------

export async function awardEligibleBadges(uid, ctx) {
  if (!uid) return [];
  const newlyAwarded = [];
  const catalogue = buildBadgeCatalogue(ctx.allCourses, ctx.allClusters);

  for (const badge of catalogue) {
    let eligible;
    try { eligible = badge.isUnlocked(ctx); } catch { eligible = false; }
    if (!eligible) continue;
    if (ctx.achievementIds?.has?.(badge.id)) continue; // already earned, skip

    try {
      const ref = doc(db, 'users', uid, 'achievements', badge.id);
      const existing = await getDoc(ref);
      if (existing.exists()) continue; // safety: double-check Firestore
      await setDoc(ref, {
        type: badge.type,
        achievementId: badge.id,
        title: badge.title,
        description: badge.description,
        icon: badge.icon,
        awardedAt: serverTimestamp(),
        awardedFor: badge.meta || {},
      });
      newlyAwarded.push(badge.id);
    } catch (e) {
      console.error('awardEligibleBadges failed for', badge.id, e);
      // Best-effort: never throw out to the caller — course-complete UX must not break.
    }
  }
  return newlyAwarded;
}

// ---------------------------------------------------------------------------
// Tier derivation — purely client-side, no XP currency stored anywhere.
// ---------------------------------------------------------------------------

export const TIERS = [
  { name: 'Newcomer',     min: 0,  max: 0  },
  { name: 'Practitioner', min: 1,  max: 3  },
  { name: 'Champion',     min: 4,  max: 9  },
  { name: 'Specialist',   min: 10, max: 19 },
  { name: 'Master',       min: 20, max: Infinity },
];

export function tierFor(badgeCount, hasMasterBadge) {
  if (hasMasterBadge) return TIERS[TIERS.length - 1];
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (badgeCount >= TIERS[i].min) return TIERS[i];
  }
  return TIERS[0];
}

export function nextTierProgress(badgeCount, hasMasterBadge) {
  const current = tierFor(badgeCount, hasMasterBadge);
  const idx = TIERS.indexOf(current);
  if (idx === TIERS.length - 1) return { isMax: true, current, remaining: 0, nextName: null };
  const next = TIERS[idx + 1];
  return {
    isMax: false,
    current,
    next,
    nextName: next.name,
    remaining: Math.max(0, next.min - badgeCount),
  };
}
