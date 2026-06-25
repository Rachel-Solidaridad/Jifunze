import React, { useMemo, useState } from 'react';
import { Search, X, Award, BookOpen, Clock, Calendar } from 'lucide-react';
import { ROLES, ROLE_LABELS, ROLE_OPTIONS, canChangeRoles } from '../auth/roles';
import { setUserRole, quizPct, quizPassed, QUIZ_PASS_PCT } from './queries';

const YELLOW = '#FFC800';

function durationToHours(d) {
  if (!d) return 0;
  const m = d.match(/(\d+(?:\.\d+)?)/);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  if (/min/i.test(d)) return n / 60;
  return n;
}

function timeAgo(ts) {
  const date = ts?.toDate?.();
  if (!date) return '—';
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function roleBadge(role) {
  if (role === ROLES.ADMIN) return { bg: '#000', fg: YELLOW };
  if (role === ROLES.MANAGER) return { bg: YELLOW, fg: '#000' };
  return { bg: '#F1F1ED', fg: '#000' };
}

export default function UserManagement({
  loading, users, allProgress, certificates, courses,
  computeCompletion, currentRole, currentUid, onChanged,
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [busyUid, setBusyUid] = useState('');

  const canEdit = canChangeRoles(currentRole);
  const liveCourses = useMemo(() => courses.filter(c => !c.placeholder), [courses]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users
      .map(u => {
        const p = allProgress[u.uid] || {};
        let started = 0, completed = 0, hours = 0;
        for (const c of liveCourses) {
          const cp = p[c.id];
          if (!cp) continue;
          started++;
          const pct = computeCompletion(c, cp);
          if (pct === 100) completed++;
          hours += durationToHours(c.duration) * (pct / 100);
        }
        const certs = certificates.filter(c => c.uid === u.uid).length;
        return { ...u, started, completed, hours, certs };
      })
      .filter(u => {
        if (!q) return true;
        return (u.displayName || '').toLowerCase().includes(q)
          || (u.email || '').toLowerCase().includes(q);
      })
      .sort((a, b) => {
        // Active users first
        const ta = a.lastActiveAt?.toDate?.()?.getTime() || 0;
        const tb = b.lastActiveAt?.toDate?.()?.getTime() || 0;
        return tb - ta;
      });
  }, [users, allProgress, certificates, liveCourses, computeCompletion, search]);

  const handleRoleChange = async (uid, newRole) => {
    if (!canEdit || busyUid) return;
    setBusyUid(uid);
    try {
      await setUserRole(uid, newRole);
      await onChanged?.();
    } catch (e) {
      console.error('Role change failed', e);
      alert('Failed to change role. ' + (e.message || ''));
    } finally {
      setBusyUid('');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm text-gray-600">
          {rows.length} {rows.length === 1 ? 'user' : 'users'}
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': YELLOW }}
          />
        </div>
      </div>

      {loading && rows.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading users…</div>
      ) : rows.length === 0 ? (
        <div className="mt-6 py-12 text-center text-sm text-gray-500 border-2 border-dashed border-gray-200 rounded-2xl">
          No users match your search.
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto bg-white border border-gray-200 rounded-2xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500 font-bold">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-right">Started</th>
                <th className="px-4 py-3 text-right">Completed</th>
                <th className="px-4 py-3 text-right">Hours</th>
                <th className="px-4 py-3 text-right">Last active</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(u => {
                const badge = roleBadge(u.role);
                return (
                  <tr
                    key={u.uid}
                    className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelected(u)}
                  >
                    <td className="px-4 py-3 font-semibold">{u.displayName || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{u.email || '—'}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      {canEdit ? (
                        <select
                          value={u.role}
                          disabled={busyUid === u.uid}
                          onChange={e => handleRoleChange(u.uid, e.target.value)}
                          className="text-xs font-bold px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2"
                          style={{ '--tw-ring-color': YELLOW, backgroundColor: badge.bg, color: badge.fg }}
                        >
                          {ROLE_OPTIONS.map(r => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className="inline-block text-xs font-bold uppercase tracking-wider px-2 py-1 rounded"
                          style={{ backgroundColor: badge.bg, color: badge.fg }}
                        >
                          {ROLE_LABELS[u.role]}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">{u.started}</td>
                    <td className="px-4 py-3 text-right">{u.completed}</td>
                    <td className="px-4 py-3 text-right">{u.hours.toFixed(1)}</td>
                    <td className="px-4 py-3 text-right text-xs text-gray-600">{timeAgo(u.lastActiveAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected ? (
        <UserDetailDrawer
          user={selected}
          courses={liveCourses}
          progress={allProgress[selected.uid] || {}}
          certificates={certificates.filter(c => c.uid === selected.uid)}
          computeCompletion={computeCompletion}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}

function UserDetailDrawer({ user, courses, progress, certificates, computeCompletion, onClose }) {
  const enrolled = courses
    .map(c => ({ course: c, p: progress[c.id] }))
    .filter(x => x.p);

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-lg bg-white h-full overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-extrabold tracking-tight">
              {user.displayName || 'Unnamed user'}
            </h3>
            <p className="text-xs text-gray-600 mt-1">{user.email}</p>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-bold">
              {ROLE_LABELS[user.role]}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Courses ({enrolled.length})</h4>
            {enrolled.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">No courses started.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {enrolled.map(({ course, p }) => {
                  const pct = computeCompletion(course, p);
                  const quizTotal = course.quiz?.length || 0;
                  const quizScorePct = quizPct(p.quiz?.score, course);
                  const quizDidPass = quizPassed(p.quiz, course);
                  return (
                    <div key={course.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold truncate">{course.title}</div>
                        <div className="text-xs font-bold text-gray-700">{pct}%</div>
                      </div>
                      <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full" style={{ width: `${pct}%`, backgroundColor: YELLOW }} />
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-[11px] text-gray-500">
                        {p.quiz?.score != null ? (
                          <span>
                            Quiz: {p.quiz.score}/{quizTotal} ({quizScorePct}%)
                            {' · '}
                            <span style={{ fontWeight: 700, color: quizDidPass ? '#15803d' : '#b91c1c' }}>
                              {quizDidPass ? 'Pass' : `Below ${QUIZ_PASS_PCT}%`}
                            </span>
                          </span>
                        ) : null}
                        {p.completedAt?.toDate ? (
                          <span>Completed {timeAgo(p.completedAt)}</span>
                        ) : p.lastActiveAt?.toDate ? (
                          <span>Active {timeAgo(p.lastActiveAt)}</span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Certificates ({certificates.length})</h4>
            {certificates.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">No certificates earned yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {certificates.map(c => (
                  <li key={c.courseId} className="flex items-center justify-between gap-3 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Award size={16} className="flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{c.courseTitle}</div>
                        <div className="text-[11px] text-gray-500">{c.certId} · {timeAgo(c.issuedAt)}</div>
                      </div>
                    </div>
                    {c.score != null ? <div className="text-xs font-bold">{c.score}%</div> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
