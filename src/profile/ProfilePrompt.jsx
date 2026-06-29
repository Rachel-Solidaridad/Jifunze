import React, { useState } from 'react';
import CountryPicker from './CountryPicker';
import { saveProfile } from './profileApi';

const YELLOW = '#FFC800';

// Welcome / complete-your-profile modal. Fires on every login until the
// learner has supplied name + country + job title — there is no skip path,
// because Solidaridad ECA admin reporting depends on all three fields. The
// modal cannot be dismissed by clicking the backdrop or pressing Escape; the
// only way out is to save a complete profile.
export default function ProfilePrompt({ uid, initialName, initialCountry, initialJobTitle, onClose }) {
  const [name, setName] = useState(initialName || '');
  const [country, setCountry] = useState(initialCountry || '');
  const [jobTitle, setJobTitle] = useState(initialJobTitle || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const allFilled =
    name.trim().length > 0 &&
    country.trim().length > 0 &&
    jobTitle.trim().length > 0;

  const handleSave = async () => {
    if (!allFilled || busy) return;
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
        completed: true,
      });
    } catch (e) {
      setError(e.message || 'Could not save profile. Please try again.');
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
          Solidaridad ECA team report on uptake across offices and roles. All
          three fields are required to continue — you can update them anytime
          from <span className="font-bold">My Profile</span>.
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

        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={!allFilled || busy}
            className="w-full px-5 py-3 font-extrabold uppercase tracking-wider text-sm rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: YELLOW, color: '#000' }}
            title={!allFilled ? 'Fill in name, country, and job title to continue' : ''}
          >
            {busy ? 'Saving…' : allFilled ? 'Save profile & continue' : 'Complete all fields to continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
