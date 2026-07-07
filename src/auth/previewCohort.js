// Temporary preview cohort.
//
// A small group of learners granted EARLY, TIME-BOXED access to a subset of the
// catalogue while the rest of the content is still under development. These
// users are also on the permanent ECA roster (src/auth/ecaAllowlist.js), but
// this preview grant governs what they can do:
//
//   • Until PREVIEW_ACCESS_UNTIL they can sign in, but only the courses in the
//     released clusters (PREVIEW_RELEASED_CLUSTERS) are open to them. Every
//     other course shows as an "under development" card and cannot be opened.
//   • From PREVIEW_ACCESS_UNTIL onwards their access is put ON HOLD: they can no
//     longer sign in and see a "testing paused, back at launch" message. Nothing
//     is deleted — their progress stays in Firestore — so access simply resumes
//     when they're re-enabled (e.g. removed from this cohort at full launch).
//
// Anyone NOT in this cohort is completely unaffected: no hold, full catalogue.
//
// To wind this down: either delete this file's entries (and the small amount of
// wiring in App.jsx that reads them) once the full catalogue is released to
// everyone, or move these people to normal access by removing them from
// PREVIEW_COHORT.

// All lowercase; the lookup helper lowercases the candidate too.
export const PREVIEW_COHORT = new Set([
  'flaviah.koyesiga@solidaridadnetwork.org',
  'andrew.wanok@solidaridadnetwork.org',
  'moses.ndiritu@solidaridadnetwork.org',
  'dorice.masitsa@solidaridadnetwork.org',
  'roselaida.ngowi@solidaridadnetwork.org',
  'simon.sulle@solidaridadnetwork.org',
  'bifered.alemayehu@solidaridadnetwork.org',
  'adugna.buli@solidaridadnetwork.org',
]);

// End of the testing window: Friday 10 July 2026, 17:00 Kenya time (EAT,
// UTC+3). Written as an absolute instant (with the +03:00 offset) so the cutoff
// is the same moment for every learner regardless of their device timezone.
// From this instant the cohort's access is put on hold.
export const PREVIEW_ACCESS_UNTIL = new Date('2026-07-10T17:00:00+03:00');

// Clusters (by exact CLUSTERS[].name in App.jsx) that ARE released to the
// cohort. Course ids are derived from these names in App.jsx, so the released
// set automatically follows the catalogue if a course moves between clusters.
// Everything outside these clusters shows as "under development" for the cohort.
export const PREVIEW_RELEASED_CLUSTERS = new Set([
  'Strategy & Organisational Excellence',
  'Governance, Ethics & Compliance',
  'Innovation & Strategic Transformation',
  'Gender, Equality & Social Inclusion',
]);

export function isPreviewUser(email) {
  if (!email) return false;
  return PREVIEW_COHORT.has(email.trim().toLowerCase());
}

// True once the testing window has closed — the cohort's access is on hold.
// Injectable `now` for testing; defaults to the current time.
export function isPreviewOnHold(now = new Date()) {
  return now >= PREVIEW_ACCESS_UNTIL;
}
