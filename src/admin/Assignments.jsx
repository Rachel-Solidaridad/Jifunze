import React, { useMemo, useState } from 'react';
import { Plus, Trash2, X, Calendar } from 'lucide-react';
import { createAssignment, deleteAssignment } from './queries';

const YELLOW = '#FFC800';

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

function fmtDue(ts) {
  const date = ts?.toDate?.();
  if (!date) return '—';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Assignments({ loading, users, courses, assignments, currentUid, onChanged }) {
  const [showForm, setShowForm] = useState(false);
  const liveCourses = useMemo(() => courses.filter(c => !c.placeholder), [courses]);

  const userById = useMemo(() => {
    const m = {};
    for (const u of users) m[u.uid] = u;
    return m;
  }, [users]);

  const courseById = useMemo(() => {
    const m = {};
    for (const c of courses) m[c.id] = c;
    return m;
  }, [courses]);

  const rows = useMemo(() => {
    return [...assignments].sort((a, b) => {
      const ta = a.assignedAt?.toDate?.()?.getTime() || 0;
      const tb = b.assignedAt?.toDate?.()?.getTime() || 0;
      return tb - ta;
    });
  }, [assignments]);

  const handleDelete = async (id) => {
    if (!confirm('Remove this assignment?')) return;
    try {
      await deleteAssignment(id);
      await onChanged?.();
    } catch (e) {
      console.error('Delete assignment failed', e);
      alert('Failed to delete: ' + (e.message || ''));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm text-gray-600">
          {rows.length} active {rows.length === 1 ? 'assignment' : 'assignments'}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 text-sm font-extrabold uppercase tracking-wider rounded-lg inline-flex items-center gap-2"
          style={{ backgroundColor: YELLOW, color: '#000' }}
        >
          <Plus size={14} /> Assign course
        </button>
      </div>

      {loading && rows.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading assignments…</div>
      ) : rows.length === 0 ? (
        <div className="mt-6 py-12 text-center text-sm text-gray-500 border-2 border-dashed border-gray-200 rounded-2xl">
          No required-course assignments yet. Click "Assign course" to require a learner to take a course.
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto bg-white border border-gray-200 rounded-2xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500 font-bold">
              <tr>
                <th className="px-4 py-3">Learner</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Assigned</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(a => {
                const u = userById[a.userId];
                const c = courseById[a.courseId];
                return (
                  <tr key={a.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{u?.displayName || '—'}</div>
                      <div className="text-xs text-gray-500">{u?.email || a.userId}</div>
                    </td>
                    <td className="px-4 py-3">{c?.title || a.courseId}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{timeAgo(a.assignedAt)}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{fmtDue(a.dueAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="p-2 rounded hover:bg-red-50 text-gray-500 hover:text-red-600"
                        title="Remove assignment"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm ? (
        <AssignForm
          users={users}
          courses={liveCourses}
          currentUid={currentUid}
          onClose={() => setShowForm(false)}
          onCreated={async () => { setShowForm(false); await onChanged?.(); }}
        />
      ) : null}
    </div>
  );
}

function AssignForm({ users, courses, currentUid, onClose, onCreated }) {
  const [userId, setUserId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [due, setDue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId || !courseId) {
      setError('Pick a learner and a course.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const dueAt = due ? new Date(due) : null;
      await createAssignment({
        userId,
        courseId,
        assignedBy: currentUid,
        dueAt,
      });
      await onCreated();
    } catch (err) {
      console.error('createAssignment failed', err);
      setError(err.message || 'Failed to create assignment.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <form
        onSubmit={handleSubmit}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md bg-white rounded-2xl border-2 border-black p-6"
      >
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-extrabold tracking-tight">Assign a required course</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Learner</label>
            <select
              value={userId}
              onChange={e => setUserId(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': YELLOW }}
            >
              <option value="">Choose a learner…</option>
              {users.map(u => (
                <option key={u.uid} value={u.uid}>
                  {u.displayName || u.email || u.uid}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Course</label>
            <select
              value={courseId}
              onChange={e => setCourseId(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': YELLOW }}
            >
              <option value="">Choose a course…</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Due date (optional)</label>
            <input
              type="date"
              value={due}
              onChange={e => setDue(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': YELLOW }}
            />
          </div>

          {error ? (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 font-extrabold uppercase tracking-wider rounded-lg disabled:opacity-50"
            style={{ backgroundColor: YELLOW, color: '#000' }}
          >
            {busy ? 'Assigning…' : 'Assign course'}
          </button>
        </div>
      </form>
    </div>
  );
}
