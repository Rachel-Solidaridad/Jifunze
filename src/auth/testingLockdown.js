import { isManagerOrAdmin } from './roles';

// Temporary final-testing lockdown.
//
// Before the official launch the team is doing final testing on the live site,
// so access is restricted to admins and managers only. Every learner is blocked
// at sign-in and shown a "back at launch" message.
//
// NOTHING is deleted. Firebase Auth accounts and all Firestore data
// (users/{uid} docs, progress, badges, certificates) stay exactly as they are.
// A blocked learner's access resumes the instant this lockdown is switched off —
// they simply sign in again and pick up where they left off. This is why we gate
// sign-in rather than removing anyone: "rejoin at launch" means flip one switch,
// not re-create accounts.
//
// Who is allowed through is decided by the user's ROLE (users/{uid}.role in
// Firestore), not by their email — so anyone promoted to manager/admin via the
// User Management UI is let in automatically, with no email list to maintain.
//
// ┌───────────────────────────────────────────────────────────────────────────┐
// │  LAUNCH SWITCH — flip this ONE line at full launch.                        │
// │                                                                           │
// │  Leave `true` during final testing: only admins and managers can sign in; │
// │  learners are put on hold.                                                 │
// │                                                                           │
// │  Set to `false` to LAUNCH: instantly reopens the site to all learners,    │
// │  no other file changes. (You can delete this module and its App.jsx       │
// │  wiring later; flipping this is the quick path.)                          │
// └───────────────────────────────────────────────────────────────────────────┘
export const TESTING_LOCKDOWN_ENABLED = true;

// True when this signed-in user must be blocked: the lockdown is on and their
// role is not manager/admin (i.e. a plain learner). `role` is the value read
// from Firestore (users/{uid}.role); callers should normalize it first.
export function isLockedOutRole(role) {
  if (!TESTING_LOCKDOWN_ENABLED) return false;
  return !isManagerOrAdmin(role);
}
