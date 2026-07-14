// Admin dashboard Firestore queries. All run client-side; fine for the
// org's expected scale (low hundreds of users). If usage grows past
// ~1000 users, pre-aggregate via a Cloud Function into a /stats/ doc.

import {
  collection, collectionGroup, getDocs, query, where, doc, setDoc,
  deleteDoc, addDoc, serverTimestamp, writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { ROLES, normalizeRole } from '../auth/roles';

// --- Quiz scoring ---
// Quiz scores are stored as a raw COUNT of correct answers, not a percentage.
// Convert to a true percent using the course's question count. Mirrors the
// pass rule and conversion used in App.jsx (QUIZ_PASS_PCT / quizPassed).
export const QUIZ_PASS_PCT = 80;

export function quizPct(score, course) {
  const total = course?.quiz?.length || 0;
  if (!total || score == null) return null;
  return Math.round((score / total) * 100);
}

export function quizPassed(quiz, course) {
  if (!quiz) return false;
  if (typeof quiz.passed === 'boolean') return quiz.passed;
  const pct = quizPct(quiz.score, course);
  return pct != null && pct >= QUIZ_PASS_PCT;
}

// --- Users ---

export async function listAllUsers() {
  const snap = await getDocs(collection(db, 'users'));
  const out = [];
  snap.forEach(d => {
    const data = d.data();
    out.push({
      uid: d.id,
      displayName: data.displayName || '',
      email: data.email || '',
      role: normalizeRole(data.role),
      country: data.country || '',
      jobTitle: data.jobTitle || '',
      profileCompletedAt: data.profileCompletedAt || null,
      createdAt: data.createdAt || null,
      lastActiveAt: data.lastActiveAt || null,
    });
  });
  return out;
}

export async function setUserRole(uid, role) {
  if (!uid) return;
  await setDoc(doc(db, 'users', uid), { role: normalizeRole(role) }, { merge: true });
}

// --- Progress (any user) ---

export async function getProgressForUser(uid) {
  if (!uid) return {};
  const snap = await getDocs(collection(db, 'users', uid, 'progress'));
  const out = {};
  snap.forEach(d => { out[d.id] = d.data(); });
  return out;
}

// Load ALL users' progress in parallel. Returns a map keyed by uid -> { courseId: progressDoc }.
// Heaviest query in the dashboard — for N users, this is N parallel collection reads.
export async function getAllProgress(users) {
  const entries = await Promise.all(
    users.map(async (u) => [u.uid, await getProgressForUser(u.uid)]),
  );
  const out = {};
  for (const [uid, p] of entries) out[uid] = p;
  return out;
}

// --- Certificates ---

export async function getAllCertificates() {
  try {
    const snap = await getDocs(collectionGroup(db, 'certificates'));
    const out = [];
    snap.forEach(d => {
      // certificates live at /users/{uid}/certificates/{courseId}
      const parentUid = d.ref.parent.parent?.id;
      out.push({
        uid: parentUid,
        courseId: d.id,
        ...d.data(),
      });
    });
    return out;
  } catch (e) {
    console.error('getAllCertificates failed', e);
    return [];
  }
}

// --- Achievements (badges) ---

export async function getAllAchievements() {
  try {
    const snap = await getDocs(collectionGroup(db, 'achievements'));
    const out = [];
    snap.forEach(d => {
      // achievements live at /users/{uid}/achievements/{achievementId}
      const parentUid = d.ref.parent.parent?.id;
      out.push({
        uid: parentUid,
        achievementId: d.id,
        ...d.data(),
      });
    });
    return out;
  } catch (e) {
    console.error('getAllAchievements failed', e);
    return [];
  }
}

// --- Feedback (poll / debate participation) ---

// Every poll vote and debate stance lives in a `voters` subcollection:
//   /polls/{pollId}/voters/{uid}    ({ name, choice, votedAt })
//   /debates/{debateId}/voters/{uid} ({ name, side,   votedAt })
// The doc id IS the voter's uid, so the admin can attribute each response to
// a country by joining on the users list — no country is stored on the vote
// itself, and this works retroactively for votes cast before this report
// existed. One collectionGroup read covers both polls and debates.
export async function getAllVotes() {
  try {
    const snap = await getDocs(collectionGroup(db, 'voters'));
    const out = [];
    snap.forEach(d => {
      const parentDoc = d.ref.parent.parent;          // the poll or debate doc
      const topCollectionId = parentDoc?.parent?.id;  // 'polls' or 'debates'
      const data = d.data();
      out.push({
        uid: d.id,
        source: topCollectionId === 'debates' ? 'debate' : 'poll',
        parentId: parentDoc?.id || null,
        choice: data.choice ?? null, // poll option key (A–D)
        side: data.side ?? null,     // debate stance (pro/con)
        votedAt: data.votedAt || null,
      });
    });
    return out;
  } catch (e) {
    console.error('getAllVotes failed', e);
    return [];
  }
}

// --- Assignments ---

export async function listAllAssignments() {
  const snap = await getDocs(collection(db, 'assignments'));
  const out = [];
  snap.forEach(d => out.push({ id: d.id, ...d.data() }));
  return out;
}

export async function listAssignmentsForUser(uid) {
  if (!uid) return [];
  const q = query(collection(db, 'assignments'), where('userId', '==', uid));
  const snap = await getDocs(q);
  const out = [];
  snap.forEach(d => out.push({ id: d.id, ...d.data() }));
  return out;
}

export async function createAssignment({ userId, courseId, assignedBy, dueAt = null }) {
  return await addDoc(collection(db, 'assignments'), {
    userId,
    courseId,
    assignedBy,
    assignedAt: serverTimestamp(),
    dueAt,
    status: 'assigned',
  });
}

// Bulk-assign one course to many learners in a single pass. Uses Firestore
// batched writes (capped at 500 ops each, so we chunk at 450 for headroom).
// `userIds` is de-duped and emptied of falsy values by the caller's filter;
// returns the number of assignment docs actually written.
export async function createAssignmentsBulk({ userIds, courseId, assignedBy, dueAt = null }) {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  let created = 0;
  for (let i = 0; i < ids.length; i += 450) {
    const chunk = ids.slice(i, i + 450);
    const batch = writeBatch(db);
    for (const userId of chunk) {
      const ref = doc(collection(db, 'assignments'));
      batch.set(ref, {
        userId,
        courseId,
        assignedBy,
        assignedAt: serverTimestamp(),
        dueAt,
        status: 'assigned',
      });
      created++;
    }
    await batch.commit();
  }
  return created;
}

export async function deleteAssignment(id) {
  if (!id) return;
  await deleteDoc(doc(db, 'assignments', id));
}

// --- Flash Polls & Micro-Debates (admin authoring) ---
// Polls/debates are admin-authored content stored in Firestore (unlike the
// hardcoded COURSES). Counters are seeded to 0 at creation so the "+1" vote
// rule in firestore.rules has a base to compare against (mirrors forum
// replyCount). Votes themselves are written client-side from App.jsx.

function sortByCreatedDesc(list) {
  return list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
}

export async function createPoll({ question, options, createdBy }) {
  return await addDoc(collection(db, 'polls'), {
    question,
    options, // [{ key: 'A', label }, ...]
    createdBy,
    createdAt: serverTimestamp(),
    status: 'active',
    countA: 0,
    countB: 0,
    countC: 0,
    countD: 0,
    total: 0,
  });
}

export async function createDebate({ question, proLabel, conLabel, createdBy }) {
  return await addDoc(collection(db, 'debates'), {
    question,
    proLabel,
    conLabel,
    createdBy,
    createdAt: serverTimestamp(),
    status: 'active',
    proCount: 0,
    conCount: 0,
    total: 0,
    argumentCount: 0,
  });
}

export async function listPolls() {
  // Resilient: if the polls rules aren't deployed yet (or any transient error),
  // return [] rather than rejecting and failing the whole admin dashboard load.
  try {
    const snap = await getDocs(collection(db, 'polls'));
    const out = [];
    snap.forEach(d => out.push({ id: d.id, ...d.data() }));
    return sortByCreatedDesc(out);
  } catch (e) {
    console.error('listPolls failed', e);
    return [];
  }
}

export async function listDebates() {
  try {
    const snap = await getDocs(collection(db, 'debates'));
    const out = [];
    snap.forEach(d => out.push({ id: d.id, ...d.data() }));
    return sortByCreatedDesc(out);
  } catch (e) {
    console.error('listDebates failed', e);
    return [];
  }
}

export async function setPollStatus(id, status) {
  if (!id) return;
  await setDoc(doc(db, 'polls', id), { status }, { merge: true });
}

export async function setDebateStatus(id, status) {
  if (!id) return;
  await setDoc(doc(db, 'debates', id), { status }, { merge: true });
}

// --- Aggregation helpers (work on already-fetched data) ---

export function isActiveSince(user, sinceMs) {
  const ts = user.lastActiveAt?.toDate?.();
  if (!ts) return false;
  return ts.getTime() >= sinceMs;
}

// Build a daily-active-users series for the last `days` days from the
// `lastActiveAt` field on each user. This is a coarse proxy — it counts
// each user once per day they were most-recently-active, NOT every session.
// For the v1 dashboard this is "good enough" and free; richer per-day
// tracking would require a per-event log collection.
export function buildDauSeries(users, days = 30) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    const dayMs = day.getTime();
    const nextMs = next.getTime();
    const active = users.filter(u => {
      const ts = u.lastActiveAt?.toDate?.();
      if (!ts) return false;
      const t = ts.getTime();
      return t >= dayMs && t < nextMs;
    }).length;
    series.push({
      label: day.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      active,
    });
  }
  return series;
}

// Returns aggregate stats for ONE course given the full progress map.
export function getCourseStats(course, allProgress, computeCompletion) {
  const uids = Object.keys(allProgress);
  let enrolled = 0; // any progress doc means they started
  let completed = 0;
  let totalScore = 0;
  let scoreCount = 0;
  for (const uid of uids) {
    const p = allProgress[uid]?.[course.id];
    if (!p) continue;
    enrolled++;
    const pct = computeCompletion(course, p);
    if (pct === 100) completed++;
    const scorePct = quizPct(p.quiz?.score, course);
    if (scorePct != null) {
      totalScore += scorePct;
      scoreCount++;
    }
  }
  return {
    enrolled,
    completed,
    completionRate: enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0,
    avgScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : null,
  };
}

// Course-level completion buckets across the whole platform.
export function completionBuckets(courses, allProgress, computeCompletion) {
  let notStarted = 0, inProgress = 0, completed = 0;
  const liveCourses = courses.filter(c => !c.placeholder);
  const uids = Object.keys(allProgress);
  for (const uid of uids) {
    for (const c of liveCourses) {
      const p = allProgress[uid]?.[c.id];
      if (!p) { notStarted++; continue; }
      const pct = computeCompletion(c, p);
      if (pct === 0) notStarted++;
      else if (pct === 100) completed++;
      else inProgress++;
    }
  }
  // For users with NO progress doc at all on a course, the loop above already
  // counted them in notStarted. We do not pre-count empty users (zero docs)
  // for courses they've never touched — that's also `notStarted`. Result:
  // every (user, course) pair is bucketed exactly once.
  return { notStarted, inProgress, completed };
}

// --- Drill-down list builders --------------------------------------------
// Pure helpers that turn the already-fetched dashboard data into the row
// lists shown when an admin clicks a KPI card. Each returns the SAME set its
// matching card counts, so `list.length` is the single source of truth for
// the headline number — the card and its drawer can never disagree.

export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Parse an estimated hours figure out of a course `duration` string
// (e.g. "45 min" -> 0.75, "2 hours" -> 2). Mirrors the copies in
// PlatformOverview/UserManagement; exported here so the hours drill-down and
// the KPI share one implementation.
export function durationToHours(d) {
  if (!d) return 0;
  const m = String(d).match(/(\d+(?:\.\d+)?)/);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  if (/min/i.test(d)) return n / 60;
  return n;
}

function tsMs(ts) {
  return ts?.toDate?.()?.getTime() || 0;
}

export function indexUsersByUid(users) {
  const map = {};
  for (const u of users) map[u.uid] = u;
  return map;
}

// All users, most-recently-active first — backs the "Total users" card.
export function listUsers(users) {
  return [...users].sort((a, b) => tsMs(b.lastActiveAt) - tsMs(a.lastActiveAt));
}

// Users active since `sinceMs`, most-recent first — backs "Active (7 days)".
export function listActiveUsers(users, sinceMs) {
  return users
    .filter(u => isActiveSince(u, sinceMs))
    .sort((a, b) => tsMs(b.lastActiveAt) - tsMs(a.lastActiveAt));
}

// One row per (user, live course) that has a progress doc, highest completion
// first — backs the "Enrollments" and "Avg completion" cards.
export function listEnrollments(users, allProgress, liveCourses, computeCompletion) {
  const byUid = indexUsersByUid(users);
  const rows = [];
  for (const uid of Object.keys(allProgress)) {
    for (const c of liveCourses) {
      const p = allProgress[uid]?.[c.id];
      if (!p) continue;
      rows.push({
        uid,
        user: byUid[uid] || null,
        course: c,
        pct: computeCompletion(c, p),
        completedAt: p.completedAt || null,
      });
    }
  }
  return rows.sort((a, b) => b.pct - a.pct);
}

// Estimated learning hours grouped by course (duration × completion fraction,
// summed over enrollments), most hours first — backs the "Learning hours" card.
export function hoursByCourse(liveCourses, allProgress, computeCompletion) {
  const uids = Object.keys(allProgress);
  const rows = liveCourses
    .map(c => {
      const dur = durationToHours(c.duration);
      let hours = 0;
      let enrolled = 0;
      for (const uid of uids) {
        const p = allProgress[uid]?.[c.id];
        if (!p) continue;
        enrolled++;
        hours += dur * (computeCompletion(c, p) / 100);
      }
      return { course: c, hours, enrolled };
    })
    .filter(r => r.enrolled > 0);
  return rows.sort((a, b) => b.hours - a.hours);
}

// Users split by whether their profile is complete — backs "Profiles complete".
export function splitProfiles(users) {
  const complete = [];
  const incomplete = [];
  for (const u of users) (u.profileCompletedAt ? complete : incomplete).push(u);
  return { complete, incomplete };
}

// Attach the matching user object to each cert/badge/vote record (which store
// only a `uid`) so drill-down rows can show a name — backs the Certificates,
// Badges and Feedback cards.
export function attachUser(records, users) {
  const byUid = indexUsersByUid(users);
  return records.map(r => ({ ...r, user: byUid[r.uid] || null }));
}
