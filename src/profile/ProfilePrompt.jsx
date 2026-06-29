import React, { useState } from 'react';
import CountryPicker from './CountryPicker';
import { saveProfile } from './profileApi';

const YELLOW = '#FFC800';

// Welcome / complete-your-profile modal. Fires on first login (no displayName)
// or once per session for existing users with an incomplete profile.
//
// Two paths:
//  - "Save profile" writes all three fields and dismisses
//  - "Skip for now" optionally writes any changed name, dismisses without
//    stamping profileCompletedAt (so the sidebar nudge stays)
export default function ProfilePrompt({ uid, initialName, initialCountry, initialJobTitle, onClose }) {
  const [name, setName] = useState(initialName || '');
  const [country, setCountry] = useState(initialCountry || '');
  const [jobTitle, setJobTitle] = useState(initialJobTitle || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const canSave = name.trim().length > 0;
  const allFilled = canSave && country.trim().length > 0 && jobTitle.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || busy) return;
    setBusy(true);
    setError('');
    try {
      await saveProfile(uid, {
        displayName: name.trim(),
        country: country.trim(),
        jobTitle: jobTitle.trim(),
      });
      onClose({
        displayName: name.trim(),
        country: country.trim(),
        jobTitle: jobTitle.trim(),
        completed: allFilled,
      });
    } catch (e) {
      setError(e.message || 'Could not save profile. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleSkip = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      // Save name only if it changed (don't overwrite blank/empty).
      const trimmed = name.trim();
      if (trimmed && trimmed !== (initialName || '')) {
        await saveProfile(uid, { displayName: trimmed });
      }
      onClose({
        displayName: trimmed || initialName || '',
        country: initialCountry || '',
        jobTitle: initialJobTitle || '',
        completed: false,
      });
    } catch (e) {
      setError(e.message || 'Could not save name. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white max-w-md w-full p-7 md:p-8 border-2 border-black rounded-2xl">
        <div className="text-xs font-bold uppercase tracking-widest text-gray-500">Welcome</div>
        <h2 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight">
          Complete your profile
        </h2>
        <p className="mt-3 text-sm text-gray-700 leading-relaxed">
          Your name appears on your certificates. Country and job title help the
          Solidaridad ECA team report on uptake across offices and roles. You can
          edit these anytime from <span className="font-bold">My Profile</span>.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
              Full name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': YELLOW }}
            />
          </div>

          <CountryPicker value={country} onChange={setCountry} />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
              Job title
            </label>
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Programme Officer — Coffee"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': YELLOW }}
            />
          </div>

          {error ? (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
              {error}
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            onClick={handleSkip}
            disabled={busy}
            className="text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-black underline underline-offset-2 disabled:opacity-50"
          >
            Skip for now
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || busy}
            className="w-full sm:w-auto px-5 py-3 font-extrabold uppercase tracking-wider text-sm rounded-lg disabled:opacity-40"
            style={{ backgroundColor: YELLOW, color: '#000' }}
          >
            {busy ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
