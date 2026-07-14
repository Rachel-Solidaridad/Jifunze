import React, { useMemo, useState } from 'react';
import Drawer from './Drawer';
import { ROLES, ROLE_LABELS } from '../auth/roles';
import {
  SEVEN_DAYS_MS, listUsers, listActiveUsers, listEnrollments,
  hoursByCourse, splitProfiles, attachUser,
} from './queries';

// --- small presentational helpers ---

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

function nameOf(user) {
  return user?.displayName || user?.email?.split('@')[0] || 'Unnamed learner';
}

function EmptyState({ children }) {
  return <p className="text-sm text-gray-500">{children}</p>;
}

function Row({ title, subtitle, meta }) {
  return (
    <li className="flex items-center justify-between gap-3 border border-gray-200 rounded-lg p-3">
      <div className="min-w-0">
        <div className="text-sm font-semibold truncate">{title}</div>
        {subtitle ? <div className="text-[11px] text-gray-500 truncate">{subtitle}</div> : null}
      </div>
      {meta != null ? (
        <div className="text-xs font-bold text-gray-700 flex-shrink-0">{meta}</div>
      ) : null}
    </li>
  );
}

function ChipBar({ chips, active, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map(c => (
        <button
          key={c.key}
          onClick={() => onSelect(c.key)}
          className={
            'px-3 py-1 rounded-full text-xs font-bold border transition ' +
            (active === c.key
              ? 'bg-black text-white border-black'
              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400')
          }
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

function UserList({ users, emptyText, metaFor }) {
  if (users.length === 0) return <EmptyState>{emptyText}</EmptyState>;
  return (
    <ul className="space-y-2">
      {users.map(u => (
        <Row key={u.uid} title={nameOf(u)} subtitle={u.email} meta={metaFor ? metaFor(u) : null} />
      ))}
    </ul>
  );
}

// --- per-card content ---

function TotalUsersContent({ users }) {
  const sorted = useMemo(() => listUsers(users), [users]);
  const [role, setRole] = useState('all');
  const count = r => sorted.filter(u => u.role === r).length;
  const chips = [
    { key: 'all', label: `All (${sorted.length})` },
    { key: ROLES.LEARNER, label: `Learners (${count(ROLES.LEARNER)})` },
    { key: ROLES.MANAGER, label: `Managers (${count(ROLES.MANAGER)})` },
    { key: ROLES.ADMIN, label: `Admins (${count(ROLES.ADMIN)})` },
  ];
  const shown = role === 'all' ? sorted : sorted.filter(u => u.role === role);
  return (
    <div>
      <ChipBar chips={chips} active={role} onSelect={setRole} />
      <div className="mt-4">
        <UserList users={shown} emptyText="No matching users." metaFor={u => ROLE_LABELS[u.role]} />
      </div>
    </div>
  );
}

function ActiveUsersContent({ users }) {
  const rows = useMemo(() => listActiveUsers(users, Date.now() - SEVEN_DAYS_MS), [users]);
  return <UserList users={rows} emptyText="No one active in the last 7 days." metaFor={u => timeAgo(u.lastActiveAt)} />;
}

function EnrollmentsContent({ users, allProgress, liveCourses, computeCompletion }) {
  const rows = useMemo(
    () => listEnrollments(users, allProgress, liveCourses, computeCompletion),
    [users, allProgress, liveCourses, computeCompletion],
  );
  if (rows.length === 0) return <EmptyState>No enrollments yet.</EmptyState>;
  return (
    <ul className="space-y-2">
      {rows.map(r => (
        <Row key={`${r.uid}-${r.course.id}`} title={nameOf(r.user)} subtitle={r.course.title} meta={`${r.pct}%`} />
      ))}
    </ul>
  );
}

function HoursContent({ allProgress, liveCourses, computeCompletion }) {
  const rows = useMemo(
    () => hoursByCourse(liveCourses, allProgress, computeCompletion),
    [liveCourses, allProgress, computeCompletion],
  );
  if (rows.length === 0) return <EmptyState>No learning hours recorded yet.</EmptyState>;
  return (
    <ul className="space-y-2">
      {rows.map(r => (
        <Row
          key={r.course.id}
          title={r.course.title}
          subtitle={`${r.enrolled} ${r.enrolled === 1 ? 'enrollment' : 'enrollments'}`}
          meta={`${r.hours.toFixed(1)}h`}
        />
      ))}
    </ul>
  );
}

function ProfilesContent({ users }) {
  const { complete, incomplete } = useMemo(() => splitProfiles(users), [users]);
  const [tab, setTab] = useState('complete');
  const chips = [
    { key: 'complete', label: `Complete (${complete.length})` },
    { key: 'incomplete', label: `Incomplete (${incomplete.length})` },
  ];
  const shown = tab === 'complete' ? complete : incomplete;
  const emptyText = tab === 'complete' ? 'No complete profiles yet.' : 'All profiles are complete.';
  return (
    <div>
      <ChipBar chips={chips} active={tab} onSelect={setTab} />
      <div className="mt-4">
        <UserList
          users={shown}
          emptyText={emptyText}
          metaFor={u => [u.country, u.jobTitle].filter(Boolean).join(' · ') || 'Missing details'}
        />
      </div>
    </div>
  );
}

function RecordList({ records, users, emptyText, subtitleFor, tsFor }) {
  const rows = useMemo(() => attachUser(records, users), [records, users]);
  if (rows.length === 0) return <EmptyState>{emptyText}</EmptyState>;
  return (
    <ul className="space-y-2">
      {rows.map((r, i) => (
        <Row
          key={`${r.uid}-${i}`}
          title={nameOf(r.user)}
          subtitle={subtitleFor(r)}
          meta={tsFor(r) ? timeAgo(tsFor(r)) : null}
        />
      ))}
    </ul>
  );
}

// --- router config: card key -> drawer title/subtitle/content ---

const CONFIG = {
  totalUsers: {
    title: 'Users',
    subtitle: ctx => `${ctx.users.length} total`,
    render: ctx => <TotalUsersContent users={ctx.users} />,
  },
  active: {
    title: 'Active in the last 7 days',
    subtitle: () => 'Signed in within the past week',
    render: ctx => <ActiveUsersContent users={ctx.users} />,
  },
  enrollments: {
    title: 'Enrollments',
    subtitle: () => 'One row per learner per live course · completion %',
    render: ctx => <EnrollmentsContent {...ctx} />,
  },
  certificates: {
    title: 'Certificates issued',
    render: ctx => (
      <RecordList
        records={ctx.certificates}
        users={ctx.users}
        emptyText="No certificates issued yet."
        subtitleFor={c => c.courseTitle || c.courseId}
        tsFor={c => c.issuedAt}
      />
    ),
  },
  badges: {
    title: 'Badges issued',
    subtitle: () => 'Across all learners',
    render: ctx => (
      <RecordList
        records={ctx.achievements}
        users={ctx.users}
        emptyText="No badges issued yet."
        subtitleFor={b => b.title || b.achievementId}
        tsFor={b => b.awardedAt}
      />
    ),
  },
  hours: {
    title: 'Learning hours by course',
    subtitle: () => 'Estimated from course duration × completion',
    render: ctx => <HoursContent {...ctx} />,
  },
  avgCompletion: {
    title: 'Completion by enrollment',
    subtitle: () => 'Highest completion first',
    render: ctx => <EnrollmentsContent {...ctx} />,
  },
  profiles: {
    title: 'Profile completion',
    subtitle: () => 'Country + job title present',
    render: ctx => <ProfilesContent users={ctx.users} />,
  },
  feedback: {
    title: 'Feedback responses',
    subtitle: () => 'Poll & debate votes',
    render: ctx => (
      <RecordList
        records={ctx.votes}
        users={ctx.users}
        emptyText="No feedback responses yet."
        subtitleFor={v => (v.source === 'debate' ? 'Debate stance' : 'Poll vote')}
        tsFor={v => v.votedAt}
      />
    ),
  },
};

export default function StatDrilldown({
  drilldown, onClose,
  users = [], allProgress = {}, certificates = [], achievements = [], votes = [],
  liveCourses = [], computeCompletion,
}) {
  const entry = CONFIG[drilldown];
  if (!entry) return null;
  const ctx = { users, allProgress, certificates, achievements, votes, liveCourses, computeCompletion };
  return (
    <Drawer
      title={entry.title}
      subtitle={entry.subtitle ? entry.subtitle(ctx) : undefined}
      onClose={onClose}
    >
      {entry.render(ctx)}
    </Drawer>
  );
}
