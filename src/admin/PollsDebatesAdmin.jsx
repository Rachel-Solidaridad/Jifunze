import React, { useMemo, useState } from 'react';
import { Plus, X, BarChart3, MessageSquare } from 'lucide-react';
import {
  createPoll, createDebate, setPollStatus, setDebateStatus,
} from './queries';

const YELLOW = '#FFC800';
const PRO_GREEN = '#16a34a';
const CON_RED = '#dc2626';
const OPTION_KEYS = ['A', 'B', 'C', 'D'];

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

export default function PollsDebatesAdmin({ loading, polls, debates, currentUid, onChanged }) {
  const [sub, setSub] = useState('polls'); // 'polls' | 'debates'

  return (
    <div>
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { id: 'polls', label: 'Flash Polls', icon: BarChart3 },
          { id: 'debates', label: 'Micro-Debates', icon: MessageSquare },
        ].map(t => {
          const Icon = t.icon;
          const active = sub === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSub(t.id)}
              className={`px-4 py-2.5 text-sm font-bold inline-flex items-center gap-2 whitespace-nowrap border-b-2 transition-colors ${
                active ? 'text-black' : 'text-gray-500 hover:text-black border-transparent'
              }`}
              style={active ? { borderColor: YELLOW } : {}}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {sub === 'polls'
          ? <PollsSection loading={loading} polls={polls} currentUid={currentUid} onChanged={onChanged} />
          : <DebatesSection loading={loading} debates={debates} currentUid={currentUid} onChanged={onChanged} />}
      </div>
    </div>
  );
}

// ---------- Flash Polls ----------

function PollsSection({ loading, polls, currentUid, onChanged }) {
  const [showForm, setShowForm] = useState(false);
  const rows = useMemo(() => polls || [], [polls]);

  const toggleStatus = async (p) => {
    try {
      await setPollStatus(p.id, p.status === 'active' ? 'closed' : 'active');
      await onChanged?.();
    } catch (e) {
      console.error('toggle poll status failed', e);
      alert('Failed to update: ' + (e.message || ''));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm text-gray-600">{rows.length} {rows.length === 1 ? 'poll' : 'polls'}</div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 text-sm font-extrabold uppercase tracking-wider rounded-lg inline-flex items-center gap-2"
          style={{ backgroundColor: YELLOW, color: '#000' }}
        >
          <Plus size={14} /> New poll
        </button>
      </div>

      {loading && rows.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading polls…</div>
      ) : rows.length === 0 ? (
        <div className="mt-6 py-12 text-center text-sm text-gray-500 border-2 border-dashed border-gray-200 rounded-2xl">
          No flash polls yet. Click "New poll" to publish a single-tap question.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map(p => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-extrabold tracking-tight leading-snug">{p.question}</h3>
                  <div className="mt-1 text-xs text-gray-500">{timeAgo(p.createdAt)} · {p.total || 0} votes</div>
                </div>
                <StatusToggle status={p.status} onClick={() => toggleStatus(p)} />
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(p.options || []).map(opt => {
                  const count = p[`count${opt.key}`] || 0;
                  const pct = p.total ? Math.round((count / p.total) * 100) : 0;
                  return (
                    <div key={opt.key} className="text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="truncate"><span className="font-bold">{opt.key}.</span> {opt.label}</span>
                        <span className="text-gray-500 flex-shrink-0">{count} · {pct}%</span>
                      </div>
                      <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full" style={{ width: `${pct}%`, backgroundColor: YELLOW }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <PollForm
          currentUid={currentUid}
          onClose={() => setShowForm(false)}
          onCreated={async () => { setShowForm(false); await onChanged?.(); }}
        />
      ) : null}
    </div>
  );
}

function PollForm({ currentUid, onClose, onCreated }) {
  const [question, setQuestion] = useState('');
  const [labels, setLabels] = useState({ A: '', B: '', C: '', D: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const options = OPTION_KEYS
      .map(k => ({ key: k, label: labels[k].trim() }))
      .filter(o => o.label);
    if (!question.trim() || options.length < 2) {
      setError('Add a question and at least two options.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await createPoll({ question: question.trim(), options, createdBy: currentUid });
      await onCreated();
    } catch (err) {
      console.error('createPoll failed', err);
      setError(err.message || 'Failed to create poll.');
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
        className="relative w-full max-w-md bg-white rounded-2xl border-2 border-black p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-extrabold tracking-tight">New flash poll</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Question</label>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              rows={2}
              maxLength={200}
              placeholder="e.g. Which digital tool will most impact sustainable supply chains by 2030?"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 resize-y"
              style={{ '--tw-ring-color': YELLOW }}
            />
          </div>
          {OPTION_KEYS.map(k => (
            <div key={k}>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Option {k}{(k === 'C' || k === 'D') ? ' (optional)' : ''}
              </label>
              <input
                type="text"
                value={labels[k]}
                onChange={e => setLabels({ ...labels, [k]: e.target.value })}
                maxLength={120}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': YELLOW }}
              />
            </div>
          ))}

          {error ? (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 font-extrabold uppercase tracking-wider rounded-lg disabled:opacity-50"
            style={{ backgroundColor: YELLOW, color: '#000' }}
          >
            {busy ? 'Publishing…' : 'Publish poll'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------- Micro-Debates ----------

function DebatesSection({ loading, debates, currentUid, onChanged }) {
  const [showForm, setShowForm] = useState(false);
  const rows = useMemo(() => debates || [], [debates]);

  const toggleStatus = async (d) => {
    try {
      await setDebateStatus(d.id, d.status === 'active' ? 'closed' : 'active');
      await onChanged?.();
    } catch (e) {
      console.error('toggle debate status failed', e);
      alert('Failed to update: ' + (e.message || ''));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm text-gray-600">{rows.length} {rows.length === 1 ? 'debate' : 'debates'}</div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 text-sm font-extrabold uppercase tracking-wider rounded-lg inline-flex items-center gap-2"
          style={{ backgroundColor: YELLOW, color: '#000' }}
        >
          <Plus size={14} /> New debate
        </button>
      </div>

      {loading && rows.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading debates…</div>
      ) : rows.length === 0 ? (
        <div className="mt-6 py-12 text-center text-sm text-gray-500 border-2 border-dashed border-gray-200 rounded-2xl">
          No micro-debates yet. Click "New debate" to publish a Pro/Con question.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map(d => {
            const total = d.total || 0;
            const proPct = total ? Math.round(((d.proCount || 0) / total) * 100) : 0;
            const conPct = total ? 100 - proPct : 0;
            return (
              <div key={d.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-extrabold tracking-tight leading-snug">{d.question}</h3>
                    <div className="mt-1 text-xs text-gray-500">
                      {timeAgo(d.createdAt)} · {total} took a side · {d.argumentCount || 0} arguments
                    </div>
                  </div>
                  <StatusToggle status={d.status} onClick={() => toggleStatus(d)} />
                </div>
                <div className="mt-3 flex items-center gap-3 text-sm">
                  <span className="font-bold" style={{ color: PRO_GREEN }}>PRO {d.proCount || 0} ({proPct}%)</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden flex">
                    <div className="h-full" style={{ width: `${proPct}%`, backgroundColor: PRO_GREEN }} />
                    <div className="h-full" style={{ width: `${conPct}%`, backgroundColor: CON_RED }} />
                  </div>
                  <span className="font-bold" style={{ color: CON_RED }}>CON {d.conCount || 0} ({conPct}%)</span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  PRO: {d.proLabel} · CON: {d.conLabel}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm ? (
        <DebateForm
          currentUid={currentUid}
          onClose={() => setShowForm(false)}
          onCreated={async () => { setShowForm(false); await onChanged?.(); }}
        />
      ) : null}
    </div>
  );
}

function DebateForm({ currentUid, onClose, onCreated }) {
  const [question, setQuestion] = useState('');
  const [proLabel, setProLabel] = useState('');
  const [conLabel, setConLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || !proLabel.trim() || !conLabel.trim()) {
      setError('Add a question and both Pro and Con stances.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await createDebate({
        question: question.trim(),
        proLabel: proLabel.trim(),
        conLabel: conLabel.trim(),
        createdBy: currentUid,
      });
      await onCreated();
    } catch (err) {
      console.error('createDebate failed', err);
      setError(err.message || 'Failed to create debate.');
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
        className="relative w-full max-w-md bg-white rounded-2xl border-2 border-black p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-extrabold tracking-tight">New micro-debate</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Debate question</label>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              rows={2}
              maxLength={200}
              placeholder="e.g. Can corporate transparency alone eliminate child labour?"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 resize-y"
              style={{ '--tw-ring-color': YELLOW }}
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: PRO_GREEN }}>Pro stance</label>
            <input
              type="text"
              value={proLabel}
              onChange={e => setProLabel(e.target.value)}
              maxLength={120}
              placeholder="e.g. Yes, it is the crucial catalyst"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': YELLOW }}
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: CON_RED }}>Con stance</label>
            <input
              type="text"
              value={conLabel}
              onChange={e => setConLabel(e.target.value)}
              maxLength={120}
              placeholder="e.g. No, more direct action is needed"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': YELLOW }}
            />
          </div>

          {error ? (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 font-extrabold uppercase tracking-wider rounded-lg disabled:opacity-50"
            style={{ backgroundColor: YELLOW, color: '#000' }}
          >
            {busy ? 'Publishing…' : 'Publish debate'}
          </button>
        </div>
      </form>
    </div>
  );
}

function StatusToggle({ status, onClick }) {
  const active = status === 'active';
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border-2 transition-colors ${
        active ? 'border-black hover:bg-gray-50' : 'border-gray-300 text-gray-500 hover:border-black hover:text-black'
      }`}
      title={active ? 'Click to close' : 'Click to re-open'}
    >
      {active ? 'Active' : 'Closed'}
    </button>
  );
}
