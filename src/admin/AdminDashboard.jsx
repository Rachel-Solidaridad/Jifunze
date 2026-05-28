import React, { useEffect, useState } from 'react';
import { Shield, BarChart3, Users as UsersIcon, BookOpen, ClipboardCheck, RefreshCw } from 'lucide-react';
import { listAllUsers, getAllProgress, getAllCertificates, listAllAssignments } from './queries';
import PlatformOverview from './PlatformOverview';
import UserManagement from './UserManagement';
import CourseAnalytics from './CourseAnalytics';
import Assignments from './Assignments';

const YELLOW = '#FFC800';

const TABS = [
  { id: 'overview',    label: 'Overview',    icon: BarChart3 },
  { id: 'users',       label: 'Users',       icon: UsersIcon },
  { id: 'courses',     label: 'Courses',     icon: BookOpen },
  { id: 'assignments', label: 'Assignments', icon: ClipboardCheck },
];

export default function AdminDashboard({ currentRole, currentUid, courses, computeCompletion }) {
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [allProgress, setAllProgress] = useState({});
  const [certificates, setCertificates] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const us = await listAllUsers();
      const [progress, certs, asgn] = await Promise.all([
        getAllProgress(us),
        getAllCertificates(),
        listAllAssignments(),
      ]);
      setUsers(us);
      setAllProgress(progress);
      setCertificates(certs);
      setAssignments(asgn);
    } catch (e) {
      console.error('Admin dashboard load failed', e);
      setError(e.message || 'Failed to load admin data. Check your role and Firestore rules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500">
            <Shield size={14} /> Admin
          </div>
          <h1 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight">
            Platform Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Usage, learning hours, and learner management for Jifunze.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="px-4 py-2 border-2 border-black text-sm font-bold uppercase tracking-wider rounded-lg hover:bg-gray-50 disabled:opacity-50 inline-flex items-center gap-2"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      <div className="mt-6 border-b border-gray-200 flex gap-1 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
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

      {error ? (
        <div className="mt-6 p-4 border-2 border-red-200 bg-red-50 rounded-lg text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="mt-6">
        {tab === 'overview' && (
          <PlatformOverview
            loading={loading}
            users={users}
            allProgress={allProgress}
            certificates={certificates}
            courses={courses}
            computeCompletion={computeCompletion}
          />
        )}
        {tab === 'users' && (
          <UserManagement
            loading={loading}
            users={users}
            allProgress={allProgress}
            certificates={certificates}
            courses={courses}
            computeCompletion={computeCompletion}
            currentRole={currentRole}
            currentUid={currentUid}
            onChanged={load}
          />
        )}
        {tab === 'courses' && (
          <CourseAnalytics
            loading={loading}
            courses={courses}
            allProgress={allProgress}
            computeCompletion={computeCompletion}
          />
        )}
        {tab === 'assignments' && (
          <Assignments
            loading={loading}
            users={users}
            courses={courses}
            assignments={assignments}
            currentUid={currentUid}
            onChanged={load}
          />
        )}
      </div>
    </div>
  );
}
