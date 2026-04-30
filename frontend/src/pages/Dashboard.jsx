import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Calendar, TrendingUp, Clock,
  Plus, Sparkles, CheckCircle2, Activity, ArrowUpRight
} from 'lucide-react';

const STATS = [
  { label: 'Total Sessions',      value: '30',          icon: Calendar,   trend: null },
  { label: 'Overall Attendance',  value: '82.3%',       icon: TrendingUp, trend: '+2.4%' },
  { label: 'Active Students',     value: '36',          icon: Users,      trend: null },
  { label: 'Last Session',        value: 'Apr 30, 2026',icon: Clock,      trend: null },
];

const OVERVIEW = [
  { label: 'Total Sessions',       value: '30',           sub: null,     type: null },
  { label: 'Average Attendance',   value: '82.3%',        sub: null,     type: null },
  { label: 'Highest Attendance',   value: 'Akash Jain',   sub: '100%',   type: 'success' },
  { label: 'Lowest Attendance',    value: 'Shruthi P',    sub: '66.7%',  type: 'danger' },
];

const ACTIVITY = [
  'Marked attendance for Productionizing ML Models',
  'Marked attendance for Large Language Models 101',
  'Marked attendance for ReAct Agent Pattern',
  'Marked attendance for AI Safety and Ethics',
  'Marked attendance for Capstone Project Kickoff',
];

export default function Dashboard() {
  const [userName, setUserName] = useState('Mentor');

  useEffect(() => {
    const mockUser = JSON.parse(localStorage.getItem('forge_mock_user') || 'null');
    if (mockUser?.display_name) {
      setUserName(mockUser.display_name.split(' ')[0]);
    }
  }, []);

  return (
    <div className="space-y-10 pb-16">

      {/* ── Welcome Header ─────────────────────────────────────── */}
      <header>
        <p className="text-[11px] text-fg-tertiary uppercase tracking-[0.18em] font-bold mb-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </p>
        <h1 className="text-display-md text-fg-primary tracking-tight">
          Welcome back, <span className="text-accent-glow">{userName}</span> 👋
        </h1>
        <p className="text-fg-secondary mt-1">Here's what's happening in your bootcamp today.</p>
      </header>

      {/* ── Stats Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, icon: Icon, trend }) => (
          <div
            key={label}
            className="card p-6 flex flex-col justify-between h-32 group hover:bg-surface-raised transition-colors cursor-default border border-border-subtle"
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-fg-tertiary font-bold uppercase tracking-widest">{label}</span>
              <Icon size={16} className="text-fg-tertiary group-hover:text-accent-glow transition-colors" />
            </div>
            <div className="flex items-end justify-between">
              <span className="text-display-sm text-fg-primary tabular-nums">{value}</span>
              {trend && (
                <span className="text-[10px] text-success flex items-center gap-0.5 font-bold">
                  <ArrowUpRight size={10} />{trend}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Two-Column Grid ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Left: Today's Session + Attendance */}
        <div className="space-y-6">

          {/* Today's Session Card */}
          <div className="card border border-accent-glow/15 bg-surface/60 backdrop-blur-sm p-10 flex flex-col items-center text-center space-y-5 min-h-[260px] justify-center rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-accent-glow/10 flex items-center justify-center">
              <Sparkles size={22} className="text-accent-glow" />
            </div>
            <div>
              <p className="text-[10px] text-fg-tertiary uppercase tracking-[0.18em] font-bold mb-2">Today's Session</p>
              <h3 className="text-xl font-bold text-fg-primary">No session scheduled</h3>
              <p className="text-sm text-fg-tertiary mt-1 max-w-[240px] mx-auto">
                Create a new session to start tracking attendance.
              </p>
            </div>
            <Link
              to="/attendance"
              className="btn-primary flex items-center gap-2 px-8 py-3 rounded-xl shadow-lg shadow-accent-glow/20 text-sm font-bold"
            >
              <Plus size={16} /> Create Session
            </Link>
          </div>

          {/* Attendance Summary Card */}
          <div className="card p-8 border border-dashed border-border-default bg-transparent rounded-2xl flex flex-col items-center text-center space-y-3 min-h-[130px] justify-center">
            <div className="w-10 h-10 rounded-full bg-surface-raised flex items-center justify-center">
              <Users size={18} className="text-fg-tertiary" />
            </div>
            <div>
              <p className="text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">Attendance Summary</p>
              <p className="text-sm text-fg-tertiary mt-1">Create a session first to view today's summary.</p>
            </div>
          </div>
        </div>

        {/* Right: Overview + Activity */}
        <div className="space-y-6">

          {/* Program Overview */}
          <div className="card p-8 rounded-2xl border border-border-subtle space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] text-fg-tertiary uppercase tracking-[0.15em] font-bold">Program Overview</h3>
              <Activity size={15} className="text-fg-tertiary" />
            </div>
            <div className="space-y-4">
              {OVERVIEW.map(({ label, value, sub, type }) => (
                <div key={label} className="flex justify-between items-center border-b border-border-subtle pb-3 last:border-0 last:pb-0">
                  <span className="text-sm text-fg-secondary">{label}</span>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${
                      type === 'success' ? 'text-success' :
                      type === 'danger'  ? 'text-danger'  : 'text-fg-primary'
                    }`}>
                      {value}
                    </p>
                    {sub && (
                      <p className={`text-[10px] font-bold ${type === 'success' ? 'text-success' : 'text-danger'}`}>
                        {sub}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card p-8 rounded-2xl border border-border-subtle space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] text-fg-tertiary uppercase tracking-[0.15em] font-bold">Recent Activity</h3>
              <CheckCircle2 size={15} className="text-fg-tertiary" />
            </div>
            <div className="space-y-4">
              {ACTIVITY.map((action, i) => (
                <div key={i} className="flex gap-3 group">
                  <div className="w-7 h-7 rounded-full bg-success-bg border border-success-border flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={13} className="text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-fg-secondary group-hover:text-fg-primary transition-colors leading-snug">
                      {action}
                    </p>
                    <p className="text-[10px] text-fg-tertiary font-bold mt-0.5">1d ago</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
