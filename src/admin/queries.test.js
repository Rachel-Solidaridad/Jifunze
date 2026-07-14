import { describe, it, expect, vi } from 'vitest';

// queries.js imports `db` from ../firebase, which initializes Firestore with a
// persistent IndexedDB cache at module load — that hangs under jsdom. The pure
// helpers under test never touch `db`, so stub the module out.
vi.mock('../firebase', () => ({ db: {} }));

import {
  SEVEN_DAYS_MS, durationToHours, isActiveSince,
  listUsers, listActiveUsers, listEnrollments, hoursByCourse, splitProfiles, attachUser,
} from './queries';

// Firestore Timestamp stub: only `.toDate()` is used by the helpers.
const ts = ms => ({ toDate: () => new Date(ms) });
const NOW = 1_700_000_000_000; // fixed epoch so tests are deterministic
const DAY = 24 * 60 * 60 * 1000;

const users = [
  { uid: 'u1', displayName: 'Alice', email: 'a@x.org', role: 'learner', profileCompletedAt: 'x', country: 'Kenya', jobTitle: 'Agronomist', lastActiveAt: ts(NOW - 1 * DAY) },
  { uid: 'u2', displayName: 'Bob', email: 'b@x.org', role: 'manager', profileCompletedAt: null, lastActiveAt: ts(NOW - 10 * DAY) },
  { uid: 'u3', displayName: 'Cara', email: 'c@x.org', role: 'admin', profileCompletedAt: 'x', lastActiveAt: null },
];

const liveCourses = [
  { id: 'c1', title: 'Course One', duration: '2 hours' },
  { id: 'c2', title: 'Course Two', duration: '30 min' },
];

const allProgress = {
  u1: { c1: { pct: 100 }, c2: { pct: 50 } },
  u2: { c1: { pct: 0 } },
};

// computeCompletion stub: progress docs carry a ready-made `pct`.
const computeCompletion = (_course, p) => p.pct;

describe('durationToHours', () => {
  it('parses hours and minutes', () => {
    expect(durationToHours('2 hours')).toBe(2);
    expect(durationToHours('30 min')).toBe(0.5);
    expect(durationToHours('')).toBe(0);
    expect(durationToHours(undefined)).toBe(0);
  });
});

describe('isActiveSince', () => {
  it('is true only when lastActiveAt is within the window', () => {
    expect(isActiveSince(users[0], NOW - SEVEN_DAYS_MS)).toBe(true);
    expect(isActiveSince(users[1], NOW - SEVEN_DAYS_MS)).toBe(false);
    expect(isActiveSince(users[2], NOW - SEVEN_DAYS_MS)).toBe(false); // null lastActiveAt
  });
});

describe('listUsers', () => {
  it('returns every user, most-recently-active first', () => {
    const rows = listUsers(users);
    expect(rows).toHaveLength(users.length);
    expect(rows.map(u => u.uid)).toEqual(['u1', 'u2', 'u3']); // u3 (null) sorts last
  });
});

describe('listActiveUsers', () => {
  it('keeps only users active since the cutoff', () => {
    const rows = listActiveUsers(users, NOW - SEVEN_DAYS_MS);
    expect(rows.map(u => u.uid)).toEqual(['u1']);
  });
});

describe('listEnrollments', () => {
  it('emits one row per (user, course) with a progress doc, highest completion first', () => {
    const rows = listEnrollments(users, allProgress, liveCourses, computeCompletion);
    expect(rows).toHaveLength(3); // u1-c1, u1-c2, u2-c1
    expect(rows[0].pct).toBe(100);
    expect(rows[rows.length - 1].pct).toBe(0);
    // each row is joined to its user object
    expect(rows.find(r => r.uid === 'u1').user.displayName).toBe('Alice');
    // the count is exactly what the "Enrollments" card would show
    const naive = Object.keys(allProgress).reduce(
      (n, uid) => n + liveCourses.filter(c => allProgress[uid][c.id]).length, 0);
    expect(rows.length).toBe(naive);
  });
});

describe('hoursByCourse', () => {
  it('sums duration × completion fraction per enrolled course', () => {
    const rows = hoursByCourse(liveCourses, allProgress, computeCompletion);
    // c1: 2h × (100% + 0%) = 2h over 2 enrollments; c2: 0.5h × 50% = 0.25h
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ enrolled: 2 });
    expect(rows[0].hours).toBeCloseTo(2);
    expect(rows[1].hours).toBeCloseTo(0.25);
    const total = rows.reduce((s, r) => s + r.hours, 0);
    expect(total).toBeCloseTo(2.25);
  });
});

describe('splitProfiles', () => {
  it('splits users by profileCompletedAt', () => {
    const { complete, incomplete } = splitProfiles(users);
    expect(complete.map(u => u.uid)).toEqual(['u1', 'u3']);
    expect(incomplete.map(u => u.uid)).toEqual(['u2']);
  });
});

describe('attachUser', () => {
  it('joins records to their user by uid', () => {
    const certs = [{ uid: 'u1', courseId: 'c1' }, { uid: 'missing', courseId: 'c9' }];
    const rows = attachUser(certs, users);
    expect(rows[0].user.displayName).toBe('Alice');
    expect(rows[1].user).toBeNull();
    expect(rows).toHaveLength(certs.length); // count == card number
  });
});
