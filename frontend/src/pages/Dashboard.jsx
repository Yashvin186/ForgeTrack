import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { Link } from 'react-router-dom';
import {
  Users, Calendar, TrendingUp, Clock,
  Plus, Sparkles, CheckCircle2, Activity, ArrowUpRight,
  UserCheck, UserX, AlertCircle
} from 'lucide-react';
import { sessionService } from '../services/session.service';
import { studentService } from '../services/student.service';
import { attendanceService } from '../services/attendance.service';

export default function Dashboard() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: 0,
    overallAttendance: '0%',
    activeStudents: 0,
    lastSessionDate: '—'
  });
  const [todaySession, setTodaySession] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState({ present: 0, total: 0, absentList: [] });
  const [overview, setOverview] = useState([]);
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState(null);

  const userName = user?.name?.split(' ')[0] || 'Mentor';

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        
        // 1. Fetch Basic Stats
        const [sessionCount, studentCount, latestSession, allRecords] = await Promise.all([
          sessionService.getCount(),
          studentService.getCount(),
          sessionService.getLatest(),
          attendanceService.getAllRecords()
        ]);

        const presentCount = allRecords.filter(r => r.present).length;
        const overallPct = allRecords.length > 0 
          ? Math.round((presentCount / allRecords.length) * 100) 
          : 0;

        setStats({
          totalSessions: sessionCount,
          overallAttendance: `${overallPct}%`,
          activeStudents: studentCount,
          lastSessionDate: latestSession 
            ? new Date(latestSession.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : '—'
        });

        // 2. Today's Session & Attendance
        const todaySess = await sessionService.getToday();
        setTodaySession(todaySess);

        if (todaySess) {
          const todayRecs = await attendanceService.getBySession(todaySess.id);
          const present = todayRecs.filter(r => r.present).length;
          const total = studentCount; // Or todayRecs.length if we only want those marked
          const absentList = todayRecs.filter(r => !r.present).map(r => r.students?.name || 'Unknown Student');
          
          setTodayAttendance({
            present,
            total,
            absentList
          });
        }

        // 3. Program Overview (Highest/Lowest)
        // For simplicity in Phase 3, we fetch students and their attendance
        // In a real production app, this would be a single optimized query or View
        const students = await studentService.getAll();
        const studentStats = await Promise.all(students.map(async (s) => {
          const records = await attendanceService.getByStudent(s.id);
          const present = records.filter(r => r.present).length;
          const total = records.length;
          return {
            name: s.name,
            pct: total > 0 ? (present / total * 100) : 0
          };
        }));

        const sorted = studentStats.sort((a, b) => b.pct - a.pct);
        const highest = sorted[0];
        const lowest = sorted[sorted.length - 1];

        setOverview([
          { label: 'Total Sessions',       value: sessionCount, sub: null,     type: null },
          { label: 'Average Attendance',   value: `${overallPct}%`, sub: null,     type: null },
          { label: 'Highest Attendance',   value: highest?.name || '—', sub: highest ? `${Math.round(highest.pct)}%` : null, type: 'success' },
          { label: 'Lowest Attendance',    value: lowest?.name || '—', sub: lowest ? `${Math.round(lowest.pct)}%` : null, type: 'danger' },
        ]);

        // 4. Recent Activity
        const recent = await attendanceService.getRecentActivity(5);
        setActivity(recent.map(r => ({
          text: `Marked attendance for ${r.sessions?.topic || 'a session'}`,
          time: new Date(r.marked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          by: r.marked_by
        })));

      } catch (err) {
        console.error('[Dashboard] Error fetching data:', err);
        setError('No data available. Please check your connection.');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-10 pb-16 animate-fade-in">
        <header className="space-y-3">
          <div className="h-4 bg-surface-raised rounded w-32" />
          <div className="h-12 bg-surface-raised rounded-xl w-64" />
          <div className="h-4 bg-surface-raised rounded w-96" />
        </header>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-surface-raised rounded-xl animate-glass-shimmer" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-[400px] bg-surface-raised rounded-2xl animate-glass-shimmer" />
          <div className="h-[400px] bg-surface-raised rounded-2xl animate-glass-shimmer" />
        </div>
      </div>
    );
  }

  const dashboardStats = [
    { label: 'Total Sessions',      value: stats.totalSessions, icon: Calendar,   trend: null },
    { label: 'Overall Attendance',  value: stats.overallAttendance, icon: TrendingUp, trend: null },
    { label: 'Active Students',     value: stats.activeStudents, icon: Users,      trend: null },
    { label: 'Last Session',        value: stats.lastSessionDate, icon: Clock,      trend: null },
  ];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <AlertCircle size={48} className="text-fg-tertiary opacity-20" />
        <h2 className="text-xl font-bold text-fg-primary">Oops! Something went wrong</h2>
        <p className="text-fg-secondary max-w-xs">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="btn-primary px-6 py-2 rounded-xl text-sm font-bold shadow-raised"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16 animate-slide-up">

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map(({ label, value, icon: Icon, trend }) => (
          <div
            key={label}
            className="card p-6 flex flex-col justify-between h-36 group hover:-translate-y-1 hover:bg-surface-raised/80 backdrop-blur-xl transition-all duration-300 cursor-default border border-border-subtle hover:border-accent-glow/40 shadow-lg hover:shadow-accent-glow/10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-glow/5 rounded-full blur-3xl -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <div className="flex justify-between items-start relative z-10">
              <span className="text-[10px] text-fg-tertiary font-bold uppercase tracking-widest">{label}</span>
              <Icon size={18} className="text-fg-tertiary group-hover:text-accent-glow transition-colors duration-300" />
            </div>
            <div className="flex items-end justify-between relative z-10">
              <span className="text-display-sm text-fg-primary tabular-nums tracking-tight">{value}</span>
              {trend && (
                <span className="text-[10px] text-success flex items-center gap-0.5 font-bold bg-success-bg px-2 py-0.5 rounded-full border border-success-border">
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
          <div className={`card border p-8 flex flex-col rounded-2xl min-h-[260px] shadow-xl backdrop-blur-xl relative overflow-hidden transition-all duration-300 hover:border-border-default ${todaySession ? 'border-border-subtle bg-surface/50' : 'border-accent-glow/20 bg-surface/40 items-center text-center justify-center group hover:border-accent-glow/50'}`}>
            {todaySession ? (
              <>
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-glow/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                   <div>
                      <p className="text-[10px] text-fg-tertiary uppercase tracking-[0.18em] font-bold mb-2">Today's Session</p>
                      <h3 className="text-3xl font-bold text-fg-primary leading-tight tracking-tight">{todaySession.topic}</h3>
                   </div>
                   <div className="w-12 h-12 rounded-2xl bg-accent-glow/10 border border-accent-glow/20 flex items-center justify-center shadow-inner">
                      <Sparkles size={20} className="text-accent-glow" />
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-auto relative z-10">
                   <div className="bg-surface-inset/80 backdrop-blur-md p-4 rounded-xl border border-border-subtle shadow-inner">
                      <div className="flex items-center gap-2 text-fg-tertiary mb-1">
                        <Clock size={14} />
                        <span className="text-[10px] uppercase font-bold tracking-widest">Duration</span>
                      </div>
                      <p className="text-base font-bold text-fg-primary">{todaySession.duration_hours} Hours</p>
                   </div>
                   <div className="bg-surface-inset/80 backdrop-blur-md p-4 rounded-xl border border-border-subtle shadow-inner">
                      <div className="flex items-center gap-2 text-fg-tertiary mb-1">
                        <CheckCircle2 size={14} />
                        <span className="text-[10px] uppercase font-bold tracking-widest">Type</span>
                      </div>
                      <p className="text-base font-bold text-fg-primary capitalize">{todaySession.session_type}</p>
                   </div>
                </div>
                
                <Link
                  to="/attendance"
                  className="mt-6 flex items-center justify-center gap-2 text-accent-glow text-sm font-bold hover:text-white transition-colors relative z-10"
                >
                  View in Mark Attendance <ArrowUpRight size={16} />
                </Link>
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent-glow/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                
                <div className="w-14 h-14 rounded-2xl bg-accent-glow/10 border border-accent-glow/20 flex items-center justify-center mb-6 shadow-inner relative z-10">
                  <Sparkles size={24} className="text-accent-glow" />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] text-fg-tertiary uppercase tracking-[0.18em] font-bold mb-2">Today's Session</p>
                  <h3 className="text-2xl font-bold text-fg-primary tracking-tight">No session scheduled</h3>
                  <p className="text-sm text-fg-tertiary mt-2 max-w-[260px] mx-auto leading-relaxed">
                    Create a new session to start tracking attendance and managing materials.
                  </p>
                </div>
                <Link
                  to="/attendance"
                  className="mt-8 btn-primary flex items-center gap-2 px-8 py-3.5 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] text-sm font-bold transition-all relative z-10"
                >
                  <Plus size={18} /> Create Session
                </Link>
              </>
            )}
          </div>

          {/* Attendance Summary Card */}
          <div className="card p-8 border border-border-subtle bg-surface-raised/30 backdrop-blur-md rounded-2xl flex flex-col min-h-[160px] justify-center hover:bg-surface-raised/50 transition-colors shadow-lg">
            {todaySession ? (
              <div className="flex items-center gap-8">
                 <div className="relative w-24 h-24 shrink-0 drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                       <path
                         className="stroke-surface-inset"
                         strokeWidth="3.5"
                         fill="none"
                         d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                       />
                       <path
                         className="stroke-success transition-all duration-1000 ease-out"
                         strokeWidth="3.5"
                         strokeDasharray={`${(todayAttendance.present / todayAttendance.total) * 100}, 100`}
                         strokeLinecap="round"
                         fill="none"
                         d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                       />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                       <span className="text-2xl font-black text-fg-primary leading-none tracking-tighter">{todayAttendance.present}</span>
                       <span className="text-[9px] text-fg-tertiary font-bold uppercase mt-0.5 tracking-wider">Present</span>
                    </div>
                 </div>
                 
                 <div className="flex-1">
                    <p className="text-[10px] text-fg-tertiary uppercase tracking-[0.15em] font-bold mb-1">Today's Attendance</p>
                    <h4 className="text-lg font-bold text-fg-primary mb-3">
                       {todayAttendance.total > 0 ? Math.round((todayAttendance.present / todayAttendance.total) * 100) : 0}% Completion Rate
                    </h4>
                    
                    {todayAttendance.absentList.length > 0 ? (
                      <div className="bg-surface-inset/50 p-3 rounded-lg border border-border-subtle">
                        <p className="text-xs text-fg-secondary leading-relaxed">
                          <span className="text-danger font-bold mr-1 flex items-center inline-flex gap-1"><UserX size={12}/> {todayAttendance.absentList.length} Absent: </span>
                          {todayAttendance.absentList.slice(0, 2).join(', ')}
                          {todayAttendance.absentList.length > 2 && ` +${todayAttendance.absentList.length - 2} more`}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-success font-bold flex items-center gap-1.5 bg-success-bg/50 px-3 py-2 rounded-lg border border-success-border inline-flex">
                        <UserCheck size={14} /> Perfect attendance today!
                      </p>
                    )}
                 </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-surface-raised border border-border-default flex items-center justify-center shadow-inner">
                  <Users size={20} className="text-fg-tertiary" />
                </div>
                <div>
                  <p className="text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">Attendance Summary</p>
                  <p className="text-sm text-fg-tertiary mt-1 max-w-[200px] mx-auto leading-relaxed">Create a session first to view today's summary.</p>
                </div>
              </div>
            )}
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
              {overview.map(({ label, value, sub, type }) => (
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
              {activity.length > 0 ? activity.map((act, i) => (
                <div key={i} className="flex gap-3 group">
                  <div className="w-7 h-7 rounded-full bg-success-bg border border-success-border flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={13} className="text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-fg-secondary group-hover:text-fg-primary transition-colors leading-snug">
                      {act.text}
                    </p>
                    <p className="text-[10px] text-fg-tertiary font-bold mt-0.5">{act.time}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6">
                   <AlertCircle size={24} className="text-fg-tertiary mx-auto mb-2 opacity-20" />
                   <p className="text-xs text-fg-tertiary font-bold uppercase tracking-widest">No recent activity</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
