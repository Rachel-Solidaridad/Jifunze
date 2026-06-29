// Profile persistence helpers.
//
// Mirrors the existing saveUserName pattern in App.jsx but writes any subset of
// {displayName, country, jobTitle}. When both country and jobTitle are present
// (after the write), profileCompletedAt is stamped — the UI uses this as the
// "should I still nudge?" signal so callers don't have to re-read the doc.

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export async function saveProfile(uid, partial) {
  if (!uid) return;
  const update = { ...partial, updatedAt: serverTimestamp() };

  // Decide whether this write completes the profile. We need to know the
  // POST-write state of both fields, so merge the incoming partial with the
  // current doc and check both. Avoids a double round-trip in the happy path
  // (modal: caller passes all three fields) while staying correct for partial
  // saves from the Profile page.
  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    const current = snap.exists() ? snap.data() : {};
    const after = { ...current, ...partial };
    const countryFilled = !!(after.country && String(after.country).trim());
    const titleFilled   = !!(after.jobTitle && String(after.jobTitle).trim());
    const nameFilled    = !!(after.displayName && String(after.displayName).trim());
    if (countryFilled && titleFilled && nameFilled && !current.profileCompletedAt) {
      update.profileCompletedAt = serverTimestamp();
    }
    await setDoc(ref, update, { merge: true });
  } catch (e) {
    console.error('saveProfile failed', e);
    throw e;
  }
}

// True when both country and jobTitle are present. Used by the sidebar nudge
// and the modal trigger.
export function isProfileComplete(userDoc) {
  if (!userDoc) return false;
  if (userDoc.profileCompletedAt) return true;
  const country = userDoc.country;
  const jobTitle = userDoc.jobTitle;
  return !!(country && String(country).trim() && jobTitle && String(jobTitle).trim());
}
