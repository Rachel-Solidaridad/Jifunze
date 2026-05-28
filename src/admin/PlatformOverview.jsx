import React, { useMemo } from 'react';
import { Users as UsersIcon, Activity, GraduationCap, Clock, Award, TrendingUp } from 'lucide-react';
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
  loading, users, allProgress, certificates, courses, computeCompletion,
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
    };
  }, [users, allProgress, certificates, liveCourses, computeCompletion]);

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
    </div>
  );
}
