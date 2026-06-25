import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { getCourseStats, quizPct, quizPassed, QUIZ_PASS_PCT } from './queries';

const YELLOW = '#FFC800';
const GREY = '#D9D9C3';

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

export default function CourseAnalytics({ loading, users, courses, allProgress, computeCompletion }) {
  const [selectedId, setSelectedId] = useState(null);
  const liveCourses = useMemo(() => courses.filter(c => !c.placeholder), [courses]);
  const userMap = useMemo(() => {
    const m = {};
    for (const u of users || []) m[u.uid] = u;
    return m;
  }, [users]);

  const rows = useMemo(() => {
    return liveCourses
      .map(c => ({ course: c, stats: getCourseStats(c, allProgress, computeCompletion) }))
      .sort((a, b) => b.stats.enrolled - a.stats.enrolled);
  }, [liveCourses, allProgress, computeCompletion]);

  const selected = selectedId ? liveCourses.find(c => c.id === selectedId) : null;

  return (
    <div>
      {loading && rows.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading course stats…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map(({ course, stats }) => (
            <button
              key={course.id}
              onClick={() => setSelectedId(course.id)}
              className="text-left bg-white border border-gray-200 rounded-2xl p-5 hover:border-black transition-colors"
            >
              <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {course.category}
              </div>
              <h3 className="mt-1 text-base font-extrabold tracking-tight leading-tight">
                {course.title}
              </h3>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Metric label="Enrolled" value={stats.enrolled} />
                <Metric label="Completed" value={stats.completed} />
                <Metric label="Avg score" value={stats.avgScore != null ? `${stats.avgScore}%` : '—'} />
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <span>Completion</span>
                  <span>{stats.completionRate}%</span>
                </div>
                <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full"
                    style={{ width: `${stats.completionRate}%`, backgroundColor: YELLOW }}
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected ? (
        <CourseDrillDown
          course={selected}
          userMap={userMap}
          allProgress={allProgress}
          computeCompletion={computeCompletion}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg py-2">
      <div className="text-lg font-extrabold tracking-tight">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</div>
    </div>
  );
}

function CourseDrillDown({ course, userMap, allProgress, computeCompletion, onClose }) {
  const learners = useMemo(() => {
    const list = [];
    for (const uid of Object.keys(allProgress)) {
      const p = allProgress[uid]?.[course.id];
      if (!p) continue;
      const u = userMap?.[uid];
      list.push({
        uid,
        name: u?.displayName || '',
        email: u?.email || '',
        pct: computeCompletion(course, p),
        score: p.quiz?.score,
        scorePct: quizPct(p.quiz?.score, course),
        quizPassed: quizPassed(p.quiz, course),
        lastActiveAt: p.lastActiveAt,
        completedAt: p.completedAt,
      });
    }
    list.sort((a, b) => b.pct - a.pct);
    return list;
  }, [course, userMap, allProgress, computeCompletion]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-xl bg-white h-full overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500">{course.category}</div>
            <h3 className="mt-1 text-xl font-extrabold tracking-tight">{course.title}</h3>
            <p className="mt-1 text-xs text-gray-600">{course.duration} · {course.lessons?.length || 0} lessons</p>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Learners ({learners.length})
          </h4>
          {learners.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No one has started this course yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {learners.map(l => (
                <li key={l.uid} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {l.name || l.email || `${l.uid.slice(0, 12)}…`}
                      </div>
                      {l.name && l.email ? (
                        <div className="text-[11px] text-gray-500 truncate">{l.email}</div>
                      ) : null}
                    </div>
                    <div className="text-xs font-bold shrink-0">{l.pct}%</div>
                  </div>
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full" style={{ width: `${l.pct}%`, backgroundColor: l.pct === 100 ? '#000' : YELLOW }} />
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-500">
                    {l.score != null ? (
                      <span>
                        Quiz: {l.score}/{course.quiz?.length || 0} ({l.scorePct}%)
                        {' · '}
                        <span style={{ fontWeight: 700, color: l.quizPassed ? '#15803d' : '#b91c1c' }}>
                          {l.quizPassed ? 'Pass' : `Below ${QUIZ_PASS_PCT}%`}
                        </span>
                      </span>
                    ) : null}
                    {l.completedAt?.toDate
                      ? <span>Completed {timeAgo(l.completedAt)}</span>
                      : l.lastActiveAt?.toDate ? <span>Active {timeAgo(l.lastActiveAt)}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
