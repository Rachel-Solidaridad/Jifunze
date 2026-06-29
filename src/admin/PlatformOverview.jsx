import React, { useMemo } from 'react';
import { Users as UsersIcon, Activity, GraduationCap, Clock, Award, TrendingUp, Trophy, CheckCircle2, Layers, UserCheck, MessageSquare, Globe } from 'lucide-react';
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

const UNKNOWN_COUNTRY = 'Country not set';

export default function PlatformOverview({
  loading, users, allProgress, certificates, achievements = [], votes = [], courses, computeCompletion,
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

    const profilesComplete = users.filter(u => u.profileCompletedAt).length;
    const profilesPct = users.length > 0 ? Math.round((profilesComplete / users.length) * 100) : 0;

    return {
      totalUsers: users.length,
      roleCounts,
      activeLast7,
      enrollments,
      totalHours,
      avgCompletion,
      certificatesIssued: certificates.length,
      badgesIssued: achievements.length,
      profilesComplete,
      profilesPct,
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

  // Feedback (poll + debate participation) broken down by country. Each vote
  // doc is keyed by uid, so we attribute it to the voter's profile country;
  // votes from users with no country fall into "Country not set". We also
  // count DISTINCT participants per country (a learner who answers five polls
  // is one participant, five responses).
  const feedbackByCountry = useMemo(() => {
    const countryByUid = {};
    for (const u of users) countryByUid[u.uid] = u.country || UNKNOWN_COUNTRY;

    const map = {}; // country -> { pollVotes, debateVotes, participants:Set }
    for (const v of votes) {
      const country = countryByUid[v.uid] || UNKNOWN_COUNTRY;
      if (!map[country]) map[country] = { country, pollVotes: 0, debateVotes: 0, participants: new Set() };
      if (v.source === 'debate') map[country].debateVotes++;
      else map[country].pollVotes++;
      if (v.uid) map[country].participants.add(v.uid);
    }

    const rows = Object.values(map)
      .map(r => ({
        country: r.country,
        pollVotes: r.pollVotes,
        debateVotes: r.debateVotes,
        total: r.pollVotes + r.debateVotes,
        participants: r.participants.size,
      }))
      .sort((a, b) => b.total - a.total || a.country.localeCompare(b.country));

    const totalResponses = rows.reduce((s, r) => s + r.total, 0);
    const namedCountries = rows.filter(r => r.country !== UNKNOWN_COUNTRY).length;
    return { rows, totalResponses, namedCountries, maxTotal: rows[0]?.total || 0 };
  }, [votes, users]);

  // Course engagement broken down by country: for every learner (grouped by
  // their profile country) we tally enrollments (a started course), completions
  // (100%) and the running completion % across live courses. Mirrors the
  // platform-wide enrollment / avg-completion KPIs, sliced per country.
  const engagementByCountry = useMemo(() => {
    const map = {}; // country -> { learners, enrollments, completions, pctSum, pctCount }
    for (const u of users) {
      const country = u.country || UNKNOWN_COUNTRY;
      if (!map[country]) map[country] = { country, learners: 0, enrollments: 0, completions: 0, pctSum: 0, pctCount: 0 };
      map[country].learners++;
      const p = allProgress[u.uid] || {};
      for (const c of liveCourses) {
        const cp = p[c.id];
        if (!cp) continue;
        const pct = computeCompletion(c, cp);
        map[country].enrollments++;
        if (pct === 100) map[country].completions++;
        map[country].pctSum += pct;
        map[country].pctCount++;
      }
    }
    const rows = Object.values(map)
      .map(r => ({
        country: r.country,
        learners: r.learners,
        enrollments: r.enrollments,
        completions: r.completions,
        avgCompletion: r.pctCount > 0 ? Math.round(r.pctSum / r.pctCount) : 0,
      }))
      .sort((a, b) => b.enrollments - a.enrollments || a.country.localeCompare(b.country));
    return { rows, maxEnroll: rows[0]?.enrollments || 0 };
  }, [users, allProgress, liveCourses, computeCompletion]);

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
        <KpiCard
          icon={UserCheck}
          label="Profiles complete"
          value={`${stats.profilesComplete} / ${stats.totalUsers}`}
          sublabel={`${stats.profilesPct}% with country + job title`}
        />
        <KpiCard
          icon={MessageSquare}
          label="Feedback responses"
          value={feedbackByCountry.totalResponses}
          sublabel={`poll & debate votes · ${feedbackByCountry.namedCountries} ${feedbackByCountry.namedCountries === 1 ? 'country' : 'countries'}`}
        />
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

      <div className="mt-6">
        <div className="flex items-baseline justify-between flex-wrap gap-x-4 gap-y-1">
          <h2 className="text-lg md:text-xl font-extrabold tracking-tight uppercase">
            Course Engagement by Country
          </h2>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Learners attributed by profile country — refresh to update
          </span>
        </div>
        <EngagementByCountryCard data={engagementByCountry} />
      </div>

      <div className="mt-6">
        <div className="flex items-baseline justify-between flex-wrap gap-x-4 gap-y-1">
          <h2 className="text-lg md:text-xl font-extrabold tracking-tight uppercase">
            Feedback by Country
          </h2>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Poll & debate participation — refresh to update
          </span>
        </div>
        <FeedbackByCountryCard data={feedbackByCountry} />
      </div>
    </div>
  );
}

function EngagementByCountryCard({ data }) {
  const { rows, maxEnroll } = data;
  const totalEnroll = rows.reduce((s, r) => s + r.enrollments, 0);
  return (
    <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Globe size={18} className="text-black" />
        <h3 className="text-sm font-extrabold uppercase tracking-wider">
          Enrollments & completions per country
        </h3>
      </div>
      <p className="text-xs text-gray-500 mt-0.5">
        Learners grouped by profile country. Enrollments = started courses; avg % is across started courses.
      </p>

      {totalEnroll === 0 ? (
        <p className="mt-4 text-sm text-gray-500">
          No course activity yet. Once learners start courses, the breakdown appears here.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-gray-500 font-bold">
              <tr>
                <th className="py-2 pr-4">Country</th>
                <th className="py-2 px-2 text-right">Learners</th>
                <th className="py-2 px-2 text-right">Enrollments</th>
                <th className="py-2 px-2 text-right">Completions</th>
                <th className="py-2 pl-2 text-right">Avg %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const pct = maxEnroll > 0 ? Math.round((r.enrollments / maxEnroll) * 100) : 0;
                const muted = r.country === UNKNOWN_COUNTRY;
                return (
                  <tr key={r.country} className="border-t border-gray-100">
                    <td className="py-2.5 pr-4">
                      <div className={`font-semibold ${muted ? 'text-gray-400 italic' : ''}`}>{r.country}</div>
                      <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full" style={{ width: `${pct}%`, backgroundColor: muted ? '#d1d5db' : '#FFC800' }} />
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-right tabular-nums">{r.learners}</td>
                    <td className="py-2.5 px-2 text-right tabular-nums">{r.enrollments}</td>
                    <td className="py-2.5 px-2 text-right tabular-nums">{r.completions}</td>
                    <td className="py-2.5 pl-2 text-right font-extrabold tabular-nums">{r.avgCompletion}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FeedbackByCountryCard({ data }) {
  const { rows, totalResponses, maxTotal } = data;
  return (
    <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Globe size={18} className="text-black" />
        <h3 className="text-sm font-extrabold uppercase tracking-wider">
          Poll & debate responses per country
        </h3>
      </div>
      <p className="text-xs text-gray-500 mt-0.5">
        Each response attributed to the voter's profile country. Participants counts distinct learners.
      </p>

      {totalResponses === 0 ? (
        <p className="mt-4 text-sm text-gray-500">
          No poll or debate responses yet. Once learners vote, the breakdown appears here.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-gray-500 font-bold">
              <tr>
                <th className="py-2 pr-4">Country</th>
                <th className="py-2 px-2 text-right">Participants</th>
                <th className="py-2 px-2 text-right">Poll votes</th>
                <th className="py-2 px-2 text-right">Debate stances</th>
                <th className="py-2 pl-2 text-right">Total responses</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const pct = maxTotal > 0 ? Math.round((r.total / maxTotal) * 100) : 0;
                const muted = r.country === UNKNOWN_COUNTRY;
                return (
                  <tr key={r.country} className="border-t border-gray-100">
                    <td className="py-2.5 pr-4">
                      <div className={`font-semibold ${muted ? 'text-gray-400 italic' : ''}`}>{r.country}</div>
                      <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full" style={{ width: `${pct}%`, backgroundColor: muted ? '#d1d5db' : '#FFC800' }} />
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-right tabular-nums">{r.participants}</td>
                    <td className="py-2.5 px-2 text-right tabular-nums">{r.pollVotes}</td>
                    <td className="py-2.5 px-2 text-right tabular-nums">{r.debateVotes}</td>
                    <td className="py-2.5 pl-2 text-right font-extrabold tabular-nums">{r.total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
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
