import React, { useMemo, useState } from 'react';
import {
  Award, Trophy, Layers, Sparkles, CheckCircle2, Globe, Lock, X, Calendar,
} from 'lucide-react';
import { buildBadgeCatalogue, tierFor, nextTierProgress, TIERS } from './awards';

const YELLOW = '#FFC800';
const BLACK = '#000000';
const GREY = '#D9D9C3';

// Lucide names referenced in awards.js → component lookup. Keeping it small
// and explicit so the catalogue can be serialised to Firestore as strings.
const ICONS = { Award, Trophy, Layers, Sparkles, CheckCircle2, Globe };

const CATEGORY_ORDER = [
  'Course Completion',
  'Mastery',
  'Cluster Breadth',
  'Master Learner',
  'Milestones',
];

function timeAgo(ts) {
  const d = ts?.toDate?.();
  if (!d) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AchievementsPage({
  userName,
  allCourses,
  allClusters,
  courseCompletion,
  progress,
  achievements,
  allComplete,
}) {
  const [selected, setSelected] = useState(null);

  const catalogue = useMemo(
    () => buildBadgeCatalogue(allCourses, allClusters),
    [allCourses, allClusters],
  );

  // Map achievement docs by their id for quick lookup of awardedAt.
  const byId = useMemo(() => {
    const m = {};
    for (const a of (achievements || [])) m[a.id || a.achievementId] = a;
    return m;
  }, [achievements]);

  // Compute unlocked state for each badge from the catalogue predicate so
  // earned badges show their actual awardedAt; freshly-eligible badges that
  // haven't been written yet (e.g. before the trigger has run) still display
  // as unlocked.
  const ctx = useMemo(() => ({
    courseCompletion,
    allCourses,
    allClusters,
    progress,
    allComplete,
    achievementIds: new Set(Object.keys(byId)),
  }), [courseCompletion, allCourses, allClusters, progress, allComplete, byId]);

  const rows = useMemo(() => catalogue.map(b => {
    const earned = byId[b.id];
    const eligible = !!earned || b.isUnlocked(ctx);
    return {
      ...b,
      unlocked: eligible,
      awardedAt: earned?.awardedAt || null,
    };
  }), [catalogue, byId, ctx]);

  const unlockedCount = rows.filter(r => r.unlocked).length;
  const hasMaster = !!byId['master'] || rows.some(r => r.id === 'master' && r.unlocked);
  const tier = tierFor(unlockedCount, hasMaster);
  const progressToNext = nextTierProgress(unlockedCount, hasMaster);

  const byCategory = useMemo(() => {
    const out = {};
    for (const r of rows) {
      const k = r.category;
      if (!out[k]) out[k] = [];
      out[k].push(r);
    }
    return out;
  }, [rows]);

  const firstName = userName ? userName.split(' ')[0] : 'there';

  return (
    <div>
      {/* Tier header */}
      <div className="relative bg-black text-white rounded-2xl p-6 md:p-8 overflow-hidden">
        <svg
          viewBox="0 0 200 200"
          className="absolute -right-6 -top-6 w-40 h-40 md:w-56 md:h-56 opacity-15"
          fill="none" stroke={YELLOW} strokeWidth="3"
        >
          <circle cx="100" cy="100" r="70" />
          <circle cx="100" cy="100" r="50" />
          <circle cx="100" cy="100" r="30" />
        </svg>
        <div className="relative max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
            <Trophy size={14} /> Achievements
          </div>
          <h1 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight">
            {firstName}, your tier: <span style={{ color: YELLOW }}>{tier.name}</span>
          </h1>
          <p className="mt-3 text-sm md:text-base text-gray-300 leading-relaxed">
            {unlockedCount} of {rows.length} badges earned. Badges recognise course completion,
            mastery (≥95% quiz), full-cluster breadth, and cross-cutting milestones.
          </p>
          {!progressToNext.isMax ? (
            <div className="mt-4 max-w-md">
              <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <span>{tier.name}</span>
                <span>{progressToNext.nextName}</span>
              </div>
              <div className="mt-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full"
                  style={{
                    width: `${Math.min(100, (unlockedCount / (progressToNext.next.min || 1)) * 100)}%`,
                    backgroundColor: YELLOW,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-400">
                {progressToNext.remaining > 0
                  ? `${progressToNext.remaining} more badge${progressToNext.remaining === 1 ? '' : 's'} to reach ${progressToNext.nextName}.`
                  : `You’ve reached ${progressToNext.nextName} — refresh to update.`}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-xs uppercase tracking-widest font-bold" style={{ color: YELLOW }}>
              Top tier — congratulations.
            </p>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="mt-8 space-y-10">
        {CATEGORY_ORDER.filter(k => byCategory[k]?.length).map(category => {
          const list = byCategory[category];
          const earned = list.filter(b => b.unlocked).length;
          return (
            <section key={category}>
              <div className="flex items-baseline justify-between flex-wrap gap-x-4 gap-y-1">
                <h2 className="text-lg md:text-xl font-extrabold tracking-tight uppercase">
                  {category}
                </h2>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {earned} of {list.length} earned
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {list.map(b => (
                  <BadgeCard
                    key={b.id}
                    badge={b}
                    onClick={() => setSelected(b)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {selected ? (
        <BadgeModal badge={selected} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}

function BadgeCard({ badge, onClick }) {
  const Icon = ICONS[badge.icon] || Award;
  const unlocked = badge.unlocked;
  return (
    <button
      onClick={onClick}
      className={`text-left bg-white border rounded-2xl p-4 flex flex-col items-center text-center transition-all hover:-translate-y-0.5 ${
        unlocked
          ? 'border-black shadow-sm hover:shadow-lg'
          : 'border-gray-200 opacity-70 hover:opacity-100'
      }`}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ backgroundColor: unlocked ? YELLOW : GREY }}
      >
        {unlocked ? (
          <Icon size={32} className="text-black" />
        ) : (
          <Lock size={24} className="text-gray-500" />
        )}
      </div>
      <h3 className="mt-3 text-sm font-extrabold tracking-tight leading-snug line-clamp-2">
        {badge.title}
      </h3>
      <p className={`mt-1 text-[11px] line-clamp-2 ${unlocked ? 'text-gray-600' : 'text-gray-500'}`}>
        {unlocked
          ? (badge.awardedAt ? `Earned ${timeAgo(badge.awardedAt)}` : 'Just unlocked')
          : 'Locked'}
      </p>
    </button>
  );
}

function BadgeModal({ badge, onClose }) {
  const Icon = ICONS[badge.icon] || Award;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-full max-w-md bg-white rounded-2xl border-2 border-black p-6 md:p-8"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded hover:bg-gray-100"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <div className="flex flex-col items-center text-center">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{ backgroundColor: badge.unlocked ? YELLOW : GREY }}
          >
            {badge.unlocked ? (
              <Icon size={48} className="text-black" />
            ) : (
              <Lock size={36} className="text-gray-500" />
            )}
          </div>
          <p className="mt-3 text-xs font-bold uppercase tracking-widest text-gray-500">
            {badge.category}
          </p>
          <h3 className="mt-1 text-xl md:text-2xl font-extrabold tracking-tight">
            {badge.title}
          </h3>
          <p className="mt-3 text-sm text-gray-700 leading-relaxed">
            {badge.description}
          </p>
          {badge.unlocked && badge.awardedAt ? (
            <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-gray-700">
              <Calendar size={14} /> Earned {timeAgo(badge.awardedAt)}
            </div>
          ) : badge.unlocked ? (
            <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: '#9C7A00' }}>
              <Sparkles size={14} /> Just unlocked — refresh to record
            </div>
          ) : (
            <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
              <Lock size={14} /> Locked
            </div>
          )}
          <div className="mt-6 w-full pt-4 border-t border-gray-200 text-xs text-gray-500">
            Sharing your badge to LinkedIn is coming soon.
          </div>
        </div>
      </div>
    </div>
  );
}
