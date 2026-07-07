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
//   • From PREVIEW_ACCESS_UNTIL onwards they are blocked at sign-in entirely
//     (a true temporary grant) and see a "preview access has ended" message.
//
// Anyone NOT in this cohort is completely unaffected: no expiry, full catalogue.
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

// First blocked instant (local time). The access window closes at the end of
// 2026-08-06, so sign-in is denied from 2026-08-07 00:00 onward.
export const PREVIEW_ACCESS_UNTIL = new Date('2026-08-07T00:00:00');

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

// Injectable `now` for testing; defaults to the current time.
export function isPreviewExpired(now = new Date()) {
  return now >= PREVIEW_ACCESS_UNTIL;
}
