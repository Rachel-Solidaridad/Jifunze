import React, { useState } from 'react';
import { User as UserIcon, Mail, CheckCircle2 } from 'lucide-react';
import CountryPicker from './CountryPicker';
import { saveProfile } from './profileApi';

const YELLOW = '#FFC800';

function fmtDate(ts) {
  const d = ts?.toDate?.();
  if (!d) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Editable profile settings page. Reuses the same saveProfile helper as the
// modal so the write logic stays in one place.
export default function ProfilePage({
  uid,
  userEmail,
  userName,
  initialCountry,
  initialJobTitle,
  createdAt,
  lastActiveAt,
  profileCompletedAt,
  onSaved,
}) {
  const [name, setName] = useState(userName || '');
  const [country, setCountry] = useState(initialCountry || '');
  const [jobTitle, setJobTitle] = useState(initialJobTitle || '');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const canSave = name.trim().length > 0;
  const complete = !!profileCompletedAt || (
    country.trim() && jobTitle.trim() && name.trim()
  );

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
      setToast('Profile saved.');
      setTimeout(() => setToast(''), 2500);
      onSaved?.({
        displayName: name.trim(),
        country: country.trim(),
        jobTitle: jobTitle.trim(),
      });
    } catch (e) {
      setError(e.message || 'Could not save profile.');
    } finally {
      setBusy(false);
    }
  };

  const initial = (userName || userEmail || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500">
        <UserIcon size={14} /> My Profile
      </div>
      <h1 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight">
        Your account
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        Country and job title help the Solidaridad ECA team segment usage by office and role.
      </p>

      {/* Identity header card */}
      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center font-extrabold text-2xl text-black flex-shrink-0"
          style={{ backgroundColor: YELLOW }}
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-base font-extrabold tracking-tight truncate">{userName || 'Unnamed learner'}</div>
          <div className="text-xs text-gray-600 truncate flex items-center gap-1.5">
            <Mail size={12} /> {userEmail}
          </div>
        </div>
        {complete ? (
          <div className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-green-800 bg-green-50 border border-green-200 px-2 py-1 rounded-full">
            <CheckCircle2 size={14} /> Complete
          </div>
        ) : null}
      </div>

      {/* Editable fields */}
      <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-5 md:p-6">
        <h2 className="text-sm font-extrabold uppercase tracking-wider">Profile details</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
              Full name
            </label>
            <input
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

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
              Email (from Google sign-in)
            </label>
            <input
              value={userEmail}
              readOnly
              className="mt-1 w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>

        {error ? (
          <div className="mt-4 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
          <div className="text-[11px] text-gray-500">
            Member since {fmtDate(createdAt)} · Last active {fmtDate(lastActiveAt)}
          </div>
          <div className="flex items-center gap-3">
            {toast ? (
              <span className="text-xs font-bold text-green-800 inline-flex items-center gap-1">
                <CheckCircle2 size={14} /> {toast}
              </span>
            ) : null}
            <button
              onClick={handleSave}
              disabled={!canSave || busy}
              className="px-5 py-2.5 font-extrabold uppercase tracking-wider text-sm rounded-lg disabled:opacity-40"
              style={{ backgroundColor: YELLOW, color: '#000' }}
            >
              {busy ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
