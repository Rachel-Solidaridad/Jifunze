import React, { useMemo } from 'react';
import { Users as UsersIcon, Activity, GraduationCap, Clock, Award, TrendingUp, Trophy, CheckCircle2, Layers } from 'lucide-react';
import KpiCard from './charts/KpiCard';
import EnrollmentBarChart from './charts/EnrollmentBarChart';
import ActivityLineChart from './charts/ActivityLineChart';
import CompletionDonut from './charts/CompletionDonut';
import {
  isActiveSince, buildDauSeries, getCourseStats, completionBuckets,
} from './queries';
import { ROLES } from '../auth/roles';

function durationToHours(d) {
  if (!d) return 0;
  const match = d.match(/(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  const n = parseFloat(match[1]);
  if (/min/i.test(d)) return n / 60;
  return n;
}

export default function PlatformOverview({
  loading, users, allProgress, certificates, achievements = [], courses, computeCompletion,
}) {
  const liveCourses = useMemo(() => courses.filter(c => !c.placeholder), [courses]);

  const stats = useMemo(() => {
    const roleCounts = { learner: 0, manager: 0, admin: 0 };
    for (const u of users) roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;

    const sevenDays = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const activeLast7 = users.filter(u => isActiveSince(u, sevenDays)).length;

    let enrollments = 0;
    let totalHours = 0;
    let totalCompletionPct = 0;
    let completionCount = 0;
    for (const uid of Object.keys(allProgress)) {
      for (const c of liveCourses) {
        const p = allProgress[uid]?.[c.id];
        if (!p) continue;
        enrollments++;
        const pct = computeCompletion(c, p);
        totalHours += durationToHours(c.duration) * (pct / 100);
        totalCompletionPct += pct;
        completionCount++;
      }
    }
    const avgCompletion = completionCount > 0 ? Math.round(totalCompletionPct / completionCount) : 0;

    return {
      totalUsers: users.length,
      roleCounts,
      activeLast7,
      enrollments,
      totalHours,
      avgCompletion,
      certificatesIssued: certificates.length,
      badgesIssued: achievements.length,
    };
  }, [users, allProgress, certificates, achievements, liveCourses, computeCompletion]);

  const dau = useMemo(() => buildDauSeries(users, 30), [users]);

  const topCourses = useMemo(() => {
    return liveCourses
      .map(c => ({
        name: c.title.length > 22 ? c.title.slice(0, 22) + '…' : c.title,
        ...getCourseStats(c, allProgress, computeCompletion),
      }))
      .filter(c => c.enrolled > 0)
      .sort((a, b) => b.enrolled - a.enrolled)
      .slice(0, 5)
      .map(c => ({ name: c.name, enrollments: c.enrolled }));
  }, [liveCourses, allProgress, computeCompletion]);

  const buckets = useMemo(
    () => completionBuckets(courses, allProgress, computeCompletion),
    [courses, allProgress, computeCompletion],
  );

  // Top-5 leaderboards by badge category. Counts are derived from
  // achievements that were loaded at admin-load time; the Refresh button
  // (and any reload) re-pulls the data so these stay current.
  const leaderboards = useMemo(() => {
    const buildTop = (predicate) => {
      const tally = {};
      for (const a of achievements) {
        if (!predicate(a)) continue;
        const uid = a.uid;
        if (!uid) continue;
        tally[uid] = (tally[uid] || 0) + 1;
      }
      const userById = {};
      for (const u of users) userById[u.uid] = u;
      return Object.entries(tally)
        .map(([uid, count]) => {
          const u = userById[uid];
          return {
            uid,
            name: u?.displayName || u?.email?.split('@')[0] || 'Unnamed learner',
            email: u?.email || '',
            count,
          };
        })
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
        .slice(0, 5);
    };
    return {
      completion: buildTop(a => a.type === 'course'),
      mastery:    buildTop(a => a.type === 'mastery'),
      milestones: buildTop(a => a.type === 'milestone' || a.type === 'cluster' || a.type === 'master'),
    };
  }, [achievements, users]);

  if (loading && users.length === 0) {
    return <div className="py-12 text-center text-sm text-gray-500">Loading platform stats…</div>;
  }

  const roleSub = `${stats.roleCounts[ROLES.LEARNER] || 0} learners · ${stats.roleCounts[ROLES.MANAGER] || 0} managers · ${stats.roleCounts[ROLES.ADMIN] || 0} admins`;

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <KpiCard icon={UsersIcon} label="Total users" value={stats.totalUsers} sublabel={roleSub} />
        <KpiCard icon={Activity} label="Active (7 days)" value={stats.activeLast7} sublabel="signed in this week" />
        <KpiCard icon={GraduationCap} label="Enrollments" value={stats.enrollments} sublabel="across all live courses" />
        <KpiCard icon={Award} label="Certificates issued" value={stats.certificatesIssued} />
        <KpiCard icon={Trophy} label="Badges issued" value={stats.badgesIssued} sublabel="across all learners" />
        <KpiCard icon={Clock} label="Learning hours" value={stats.totalHours.toFixed(1)} sublabel="platform-wide (estimated)" />
        <KpiCard icon={TrendingUp} label="Avg completion" value={`${stats.avgCompletion}%`} sublabel="across active enrollments" />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="text-sm font-extrabold uppercase tracking-wider">Daily active learners</h3>
          <p className="text-xs text-gray-500 mt-0.5">Last 30 days, based on last sign-in.</p>
          <div className="mt-3">
            <ActivityLineChart data={dau} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="text-sm font-extrabold uppercase tracking-wider">Top courses by enrollment</h3>
          <p className="text-xs text-gray-500 mt-0.5">Most-started courses on the platform.</p>
          <div className="mt-3">
            <EnrollmentBarChart data={topCourses} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 lg:col-span-2">
          <h3 className="text-sm font-extrabold uppercase tracking-wider">Completion breakdown</h3>
          <p className="text-xs text-gray-500 mt-0.5">Every (user × course) pair, by progress status.</p>
          <div className="mt-3">
            <CompletionDonut {...buckets} />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-baseline justify-between flex-wrap gap-x-4 gap-y-1">
          <h2 className="text-lg md:text-xl font-extrabold tracking-tight uppercase">
            Top Learners
          </h2>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Top 5 by badge category — refresh to update
          </span>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <LeaderboardCard
            icon={CheckCircle2}
            title="Course Completion"
            countLabel="completions"
            rows={leaderboards.completion}
          />
          <LeaderboardCard
            icon={Trophy}
            title="Mastery"
            countLabel="≥95% quizzes"
            rows={leaderboards.mastery}
          />
          <LeaderboardCard
            icon={Layers}
            title="Milestones & Clusters"
            countLabel="badges"
            rows={leaderboards.milestones}
          />
        </div>
      </div>
    </div>
  );
}

function LeaderboardCard({ icon: Icon, title, countLabel, rows }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Icon size={18} className="text-black" />
        <h3 className="text-sm font-extrabold uppercase tracking-wider">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">
          No badges in this category yet.
        </p>
      ) : (
        <ol className="mt-4 space-y-2">
          {rows.map((r, i) => (
            <li
              key={r.uid}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${
                  i === 0 ? 'bg-black text-white'
                  : i === 1 ? 'bg-gray-200 text-black'
                  : 'bg-gray-100 text-black'
                }`}
                style={i === 0 ? { backgroundColor: '#FFC800', color: '#000' } : {}}
              >
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">{r.name}</div>
                <div className="text-[11px] text-gray-500 truncate">{r.email}</div>
              </div>
              <div className="text-sm font-extrabold tracking-tight">
                {r.count}
                <span className="ml-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  {countLabel}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
