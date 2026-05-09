import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { Link } from 'react-router-dom';
import {
  Users, Calendar, TrendingUp, Clock,
  Sparkles, CheckCircle2, Activity, ArrowUpRight,
  ChevronRight, Zap
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


  const userName = user?.name?.split(' ')[0] || 'Mentor';

  useEffect(() => {
    let isMounted = true;
    
    async function loadStats() {
      try {
        const [sessionCount, studentCount, latestSession] = await Promise.all([
          sessionService.getCount().catch(() => 0),
          studentService.getCount().catch(() => 0),
          sessionService.getLatest().catch(() => null)
        ]);
        if (!isMounted) return;
        setStats(prev => ({
          ...prev,
          totalSessions: sessionCount,
          activeStudents: studentCount,
          lastSessionDate: latestSession 
            ? new Date(latestSession.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : '—'
        }));
      } catch { /* Silent fail */ }
    }

    async function loadAttendanceAndOverview() {
      try {
        const [allAttendance, todaySess] = await Promise.all([
          attendanceService.getAllRecordsDetailed().catch(() => []),
          sessionService.getToday().catch(() => null)
        ]);
        
        if (!isMounted) return;
        setTodaySession(todaySess);

        const presentCount = allAttendance.filter(r => r.present).length;
        const overallPct = allAttendance.length > 0 
          ? Math.round((presentCount / allAttendance.length) * 100) 
          : 0;

        setStats(prev => ({ ...prev, overallAttendance: `${overallPct}%` }));

        if (todaySess) {
          const todayRecs = allAttendance.filter(r => r.session_id === todaySess.id);
          const present = todayRecs.filter(r => r.present).length;
          setTodayAttendance({
            present,
            total: stats.activeStudents || todayRecs.length || 0,
            absentList: todayRecs
              .filter(r => !r.present)
              .map(r => r.students?.name || 'Unknown Student')
          });
        }

        const studentMap = {};
        allAttendance.forEach(record => {
          if (!studentMap[record.student_id]) {
            studentMap[record.student_id] = { present: 0, total: 0, name: record.students?.name };
          }
          studentMap[record.student_id].total++;
          if (record.present) studentMap[record.student_id].present++;
        });

        const studentStats = Object.values(studentMap).map(s => ({
          name: s.name || 'Unknown',
          pct: s.total > 0 ? (s.present / s.total * 100) : 0
        }));

        const sorted = studentStats.sort((a, b) => b.pct - a.pct);
        const highest = sorted[0];
        const lowest = sorted.length > 0 ? sorted[sorted.length - 1] : null;

        setOverview([
          { label: 'Platform Utilization', value: stats.totalSessions || 0, type: 'info' },
          { label: 'Cohort Average',      value: `${overallPct}%`,      type: 'accent' },
          { label: 'Highest Performer',   value: highest?.name || '—',  sub: highest ? `${Math.round(highest.pct)}%` : null, type: 'success' },
          { label: 'Engagement Risk',     value: lowest?.name || '—',   sub: lowest ? `${Math.round(lowest.pct)}%` : null, type: 'danger' },
        ]);
      } catch { /* Silent fail */ }
    }

    async function loadActivity() {
      try {
        const recentActivity = await attendanceService.getRecentActivity(8).catch(() => []);
        if (!isMounted) return;
        setActivity(recentActivity.map(r => ({
          text: `Synced attendance for ${r.sessions?.topic || 'Bootcamp Session'}`,
          time: new Date(r.marked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          by: r.marked_by
        })));
      } catch { /* Silent fail */ }
      finally { if (isMounted) setLoading(false); }
    }

    loadStats().then(() => {
      loadAttendanceAndOverview();
      loadActivity();
    });

    return () => { isMounted = false; };
  }, [stats.activeStudents, stats.totalSessions]);

  const dashboardStatsList = [
    { label: 'Total Sessions',      value: stats.totalSessions,     icon: Calendar,   trend: null },
    { label: 'Overall Attendance',  value: stats.overallAttendance, icon: TrendingUp, trend: '+2.4%' },
    { label: 'Active Students',     value: stats.activeStudents,    icon: Users,      trend: null },
    { label: 'Last Sync',           value: stats.lastSessionDate,   icon: Clock,      trend: null },
  ];

  if (loading && stats.totalSessions === 0) {
    return (
      <div className="space-y-12 pb-16 animate-fade-in">
        <header className="space-y-4">
          <div className="h-4 w-32 bg-surface-raised rounded animate-pulse" />
          <div className="h-16 w-96 bg-surface-raised rounded-2xl animate-pulse" />
        </header>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-36 bg-surface-raised/40 rounded-[2rem] border border-border-subtle animate-glass-shimmer" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="h-[320px] bg-surface-raised/40 rounded-[2.5rem] border border-border-subtle animate-glass-shimmer" />
           <div className="h-[320px] bg-surface-raised/40 rounded-[2.5rem] border border-border-subtle animate-glass-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-16 animate-slide-up">

      {/* ── Welcome Header ─────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
           <p className="text-[10px] text-accent-glow uppercase tracking-[0.25em] font-black mb-1">
             System Status: Operational
           </p>
           <h1 className="text-display-lg text-fg-primary tracking-tighter">
             Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-glow to-info">{userName}</span>
           </h1>
           <p className="text-lg text-fg-secondary tracking-tight">Here's a strategic overview of your cohort's performance.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-4 py-2 bg-surface-raised rounded-xl border border-border-subtle flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest text-fg-secondary">Live Sync Active</span>
           </div>
        </div>
      </header>

      {/* ── High-Density Stats Grid ───────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStatsList.map(({ label, value, icon: Icon, trend }) => (
          <div
            key={label}
            className="card p-7 flex flex-col justify-between h-40 group hover:bg-surface-raised transition-all duration-500 cursor-default border border-border-subtle hover:border-accent-glow/40 shadow-card hover:shadow-raised relative overflow-hidden rounded-[2rem]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-glow/5 rounded-full blur-3xl -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <div className="flex justify-between items-start relative z-10">
              <span className="text-[10px] text-fg-tertiary font-black uppercase tracking-widest">{label}</span>
              <Icon size={18} className="text-fg-tertiary group-hover:text-accent-glow transition-colors duration-500" />
            </div>
            <div className="flex items-end justify-between relative z-10">
              <span className="text-display-sm text-fg-primary tabular-nums tracking-tighter">{value}</span>
              {trend && (
                <span className="text-[10px] text-success font-black flex items-center gap-1 bg-success-bg px-2.5 py-1 rounded-full border border-success-border">
                  {trend}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Intelligent Grid ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Left: Tactical Focus */}
        <div className="space-y-8">

          {/* Active Session Insight */}
          <div className={`card p-8 flex flex-col rounded-[2.5rem] min-h-[280px] shadow-raised relative overflow-hidden transition-all duration-500 ${todaySession ? 'bg-surface/40' : 'bg-surface-raised/20 items-center text-center justify-center border-dashed border-border-strong group hover:bg-accent-glow/[0.02]'}`}>
            {todaySession ? (
              <>
                <div className="absolute top-0 right-0 w-72 h-72 bg-accent-glow/10 rounded-full blur-[100px] -mr-24 -mt-24 pointer-events-none" />
                
                <div className="flex justify-between items-start mb-8 relative z-10">
                   <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-glow/10 border border-accent-glow/20 rounded-full text-[9px] font-black uppercase tracking-widest text-accent-glow">
                         <Zap size={10} /> Active Session
                      </div>
                      <h3 className="text-display-sm font-black text-fg-primary leading-tight tracking-tighter">{todaySession.topic}</h3>
                   </div>
                   <Link to="/attendance" className="w-12 h-12 rounded-2xl bg-surface-raised border border-border-strong flex items-center justify-center text-fg-tertiary hover:text-accent-glow hover:border-accent-glow/40 transition-all">
                      <ArrowUpRight size={20} />
                   </Link>
                </div>
                
                <div className="grid grid-cols-2 gap-6 relative z-10 mt-auto">
                   <div className="space-y-1">
                      <p className="text-[10px] text-fg-tertiary font-black uppercase tracking-widest">Temporal Density</p>
                      <p className="text-lg font-black text-fg-primary">{todaySession.duration_hours}H Block</p>
                   </div>
                   <div className="space-y-1 text-right">
                      <p className="text-[10px] text-fg-tertiary font-black uppercase tracking-widest">Protocol</p>
                      <p className="text-lg font-black text-fg-primary capitalize">{todaySession.session_type}</p>
                   </div>
                </div>
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.05)_0%,_transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                <div className="w-16 h-16 rounded-[2rem] bg-surface-raised border border-border-default flex items-center justify-center mb-6 shadow-card relative z-10">
                  <Sparkles size={28} className="text-fg-tertiary group-hover:text-accent-glow transition-colors" />
                </div>
                <div className="relative z-10 max-w-[300px]">
                  <h3 className="text-2xl font-black text-fg-primary tracking-tight">Deployment Ready</h3>
                  <p className="text-sm text-fg-secondary mt-3 leading-relaxed">
                    No active sessions detected for this period. Initialize a new track to begin monitoring.
                  </p>
                </div>
                <Link
                  to="/attendance"
                  className="mt-8 btn-primary px-10 py-4 rounded-2xl shadow-glow hover:scale-105 text-sm font-black transition-all relative z-10"
                >
                  Launch New Session
                </Link>
              </>
            )}
          </div>

          {/* Real-time Metrics */}
          <div className="card p-8 border border-border-subtle bg-surface-raised/30 backdrop-blur-3xl rounded-[2.5rem] flex flex-col justify-center min-h-[160px] hover:border-border-strong transition-all duration-500">
            {todaySession ? (
              <div className="flex items-center gap-10">
                 <div className="relative w-28 h-28 shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                       <circle cx="18" cy="18" r="16" fill="none" className="stroke-surface-inset" strokeWidth="3" />
                       <circle 
                         cx="18" cy="18" r="16" fill="none" 
                         className="stroke-accent-glow transition-all duration-1000 ease-out" 
                         strokeWidth="3" 
                         strokeDasharray={`${(todayAttendance.present / todayAttendance.total) * 100}, 100`} 
                         strokeLinecap="round" 
                       />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <span className="text-3xl font-black text-fg-primary leading-none tracking-tighter">{todayAttendance.present}</span>
                       <span className="text-[9px] text-fg-tertiary font-black uppercase mt-1 tracking-widest">Active</span>
                    </div>
                 </div>
                 
                 <div className="space-y-4 flex-1">
                    <div>
                       <p className="text-[10px] text-fg-tertiary font-black uppercase tracking-[0.2em] mb-1">Live Attendance Density</p>
                       <h4 className="text-xl font-black text-fg-primary tracking-tight">
                          {todayAttendance.total > 0 ? Math.round((todayAttendance.present / todayAttendance.total) * 100) : 0}% Cohort Presence
                       </h4>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                       {todayAttendance.absentList.length > 0 ? (
                         todayAttendance.absentList.slice(0, 3).map((name, i) => (
                           <span key={i} className="px-3 py-1 rounded-lg bg-danger-bg border border-danger-border text-[10px] font-bold text-danger">
                             {name}
                           </span>
                         ))
                       ) : (
                         <span className="px-3 py-1 rounded-lg bg-success-bg border border-success-border text-[10px] font-bold text-success flex items-center gap-2">
                           <CheckCircle2 size={12} /> Full Cohort Sync
                         </span>
                       )}
                       {todayAttendance.absentList.length > 3 && (
                         <span className="px-3 py-1 rounded-lg bg-surface-inset border border-border-subtle text-[10px] font-bold text-fg-tertiary">
                           +{todayAttendance.absentList.length - 3} More
                         </span>
                       )}
                    </div>
                 </div>
              </div>
            ) : (
              <div className="flex items-center gap-6 opacity-40 grayscale">
                 <div className="w-20 h-20 rounded-full border-4 border-border-subtle flex items-center justify-center font-black text-fg-tertiary">0%</div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest">Real-time Telemetry</p>
                    <p className="text-sm font-bold">Waiting for session initialization...</p>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Operational Activity */}
        <div className="space-y-8">

          {/* Strategic Overview */}
          <div className="card p-8 rounded-[2.5rem] border border-border-subtle bg-canvas/40 shadow-raised relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none" />
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-[11px] text-fg-tertiary uppercase tracking-[0.25em] font-black">Strategic Overview</h3>
                <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border-subtle flex items-center justify-center text-fg-tertiary">
                   <Activity size={16} />
                </div>
             </div>
             <div className="space-y-6">
                {overview.map(({ label, value, sub, type }) => (
                  <div key={label} className="flex justify-between items-center group cursor-default">
                    <span className="text-sm font-bold text-fg-secondary group-hover:text-fg-primary transition-colors">{label}</span>
                    <div className="text-right">
                      <p className={`text-base font-black tracking-tight ${
                        type === 'success' ? 'text-success' :
                        type === 'danger'  ? 'text-danger'  : 
                        type === 'accent'  ? 'text-accent-glow' : 'text-fg-primary'
                      }`}>
                        {value}
                      </p>
                      {sub && (
                        <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${type === 'success' ? 'text-success' : 'text-danger'}`}>
                          {sub}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
             </div>
          </div>

          {/* Live Action Feed */}
          <div className="card p-8 rounded-[2.5rem] border border-border-subtle bg-canvas/40 shadow-raised flex flex-col min-h-[340px]">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-[11px] text-fg-tertiary uppercase tracking-[0.25em] font-black">Platform Activity Feed</h3>
                <div className="flex gap-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-accent-glow animate-pulse" />
                </div>
             </div>
             <div className="space-y-5 flex-1">
                {activity.length > 0 ? activity.map((act, i) => (
                  <div key={i} className="flex gap-4 group cursor-default">
                    <div className="w-9 h-9 rounded-xl bg-surface-raised border border-border-subtle flex items-center justify-center shrink-0 group-hover:border-accent-glow/40 transition-all">
                      <Zap size={14} className="text-fg-tertiary group-hover:text-accent-glow transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0 border-b border-border-subtle pb-4 last:border-0">
                      <p className="text-sm font-bold text-fg-primary leading-snug truncate">
                        {act.text}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                         <span className="text-[10px] text-fg-tertiary font-black uppercase tracking-widest">{act.time}</span>
                         <span className="w-1 h-1 rounded-full bg-border-strong" />
                         <span className="text-[10px] text-accent-glow font-black uppercase tracking-widest opacity-80">{act.by}</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-12">
                     <div className="w-16 h-16 rounded-[2rem] bg-surface-raised border border-border-subtle flex items-center justify-center text-fg-tertiary opacity-20">
                        <Activity size={32} />
                     </div>
                     <p className="text-xs text-fg-tertiary font-black uppercase tracking-widest">Telemetric feed empty</p>
                  </div>
                )}
             </div>
             <Link to="/history" className="mt-6 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-fg-tertiary hover:text-accent-glow transition-colors">
                View Intelligence Report <ChevronRight size={14} />
             </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
