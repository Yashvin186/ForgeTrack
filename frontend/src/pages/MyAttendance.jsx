import { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, XCircle, Calendar, ShieldAlert, Activity, Award, Flame, Zap, ChevronRight } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { attendanceService } from '../services/attendance.service';

export default function MyAttendance() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  const userName = user?.name?.split(' ')[0] || 'Student';

  useEffect(() => {
    let isMounted = true;
    if (!user?.id) return;

    async function fetchMyData() {
      try {
        setLoading(true);
        const records = await attendanceService.getByStudent(user.id).catch(() => []);
        if (!isMounted) return;
        setHistory(records);
      } catch { /* Silent fail */ }
      finally { if (isMounted) setLoading(false); }
    }
    fetchMyData();
    return () => { isMounted = false; };
  }, [user?.id]);

  const stats = useMemo(() => {
    const present = history.filter(r => r.present).length;
    const total = history.length;
    const pct = total > 0 ? Math.round((present / total) * 100) : 0;
    const meetsThreshold = pct >= 75;
    
    // Streak logic
    const sorted = [...history].sort((a, b) => new Date(a.sessions?.date || 0) - new Date(b.sessions?.date || 0));
    let streak = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].present) streak++;
      else break;
    }

    return { present, total, pct, meetsThreshold, streak };
  }, [history]);

  if (loading) {
    return (
      <div className="space-y-12 pb-16 animate-fade-in">
        <header className="space-y-4">
          <div className="h-4 bg-surface-raised rounded w-32 animate-pulse" />
          <div className="h-16 bg-surface-raised rounded-2xl w-96 animate-pulse" />
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="h-[500px] bg-surface-raised/40 rounded-[2.5rem] border border-border-subtle animate-glass-shimmer" />
           <div className="lg:col-span-2 h-[500px] bg-surface-raised/40 rounded-[2.5rem] border border-border-subtle animate-glass-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 animate-slide-up">

      {/* ── Welcome Header ───────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
           <p className="text-[10px] text-accent-glow font-black uppercase tracking-[0.25em] mb-1 flex items-center gap-2">
             <Activity size={12} /> Live Progress Tracking
           </p>
           <h1 className="text-display-md text-fg-primary tracking-tighter">
             Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-glow to-info">{userName}</span>
           </h1>
           <p className="text-lg text-fg-secondary tracking-tight font-medium">Monitor your academic participation and track system eligibility.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-5 py-2.5 bg-surface-raised/30 border border-border-subtle rounded-2xl flex items-center gap-3 shadow-sm">
              <div className={`w-2.5 h-2.5 rounded-full shadow-glow ${stats.meetsThreshold ? 'bg-success' : 'bg-danger'}`} />
              <span className="text-[11px] font-black uppercase tracking-widest text-fg-primary">
                 {stats.meetsThreshold ? 'Protocol Compliant' : 'Risk Warning'}
              </span>
           </div>
        </div>
      </header>

      {history.length === 0 ? (
        <div className="card p-24 flex flex-col items-center text-center space-y-8 border-dashed border-border-strong bg-surface-raised/10 rounded-[3rem] group hover:bg-accent-glow/[0.02] transition-colors">
           <div className="w-24 h-24 rounded-[2.5rem] bg-surface-raised border border-border-default flex items-center justify-center text-fg-tertiary shadow-raised group-hover:scale-110 transition-transform">
              <Calendar size={48} strokeWidth={1} />
           </div>
           <div className="max-w-md space-y-4">
              <h3 className="text-3xl font-black text-fg-primary tracking-tight">System Node Initialized</h3>
              <p className="text-lg text-fg-secondary font-medium leading-relaxed">
                 Your academic telemetry will appear here once your mentor synchronizes the first participation records.
              </p>
           </div>
           <button onClick={() => window.location.reload()} className="btn-primary px-10 py-4 rounded-2xl shadow-glow text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
              Refresh Stream <Zap size={16} />
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          
          {/* Integrity Metric Card */}
          <div className="card border border-border-subtle rounded-[2.5rem] p-10 space-y-10 bg-surface-raised/20 relative overflow-hidden shadow-raised group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-glow/[0.03] rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none" />
            
            <div className="space-y-2">
              <p className="text-[10px] text-fg-tertiary uppercase tracking-[0.25em] font-black">Attendance Magnitude</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-[5rem] font-black tabular-nums leading-none tracking-tighter ${stats.pct >= 75 ? 'text-success' : 'text-danger'}`}>
                  {stats.pct}
                </span>
                <span className={`text-2xl font-black ${stats.pct >= 75 ? 'text-success' : 'text-danger'}`}>%</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end px-1">
                <div className="space-y-1">
                   <p className="text-[10px] text-fg-tertiary uppercase tracking-widest font-black">Vector Sync</p>
                   <p className="text-sm font-black text-fg-primary">{stats.present} / {stats.total} Records</p>
                </div>
                <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border ${stats.meetsThreshold ? 'bg-success-bg border-success-border text-success' : 'bg-danger-bg border-danger-border text-danger'}`}>
                   {stats.meetsThreshold ? 'Stable' : 'Critical'}
                </div>
              </div>
              <div className="h-3.5 w-full bg-surface-inset rounded-full overflow-hidden p-0.5 border border-border-subtle shadow-inner">
                <div
                  className={`h-full transition-all duration-1000 ease-out rounded-full shadow-glow ${stats.pct >= 75 ? 'bg-success' : stats.pct >= 60 ? 'bg-warning' : 'bg-danger'}`}
                  style={{ width: `${stats.pct}%` }}
                />
              </div>
            </div>

            <div className={`p-6 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-4 border transition-all ${
              stats.meetsThreshold
                ? 'bg-success-bg/20 border-success-border text-success shadow-success/10'
                : 'bg-danger-bg/20 border-danger-border text-danger shadow-danger/10'
            }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stats.meetsThreshold ? 'bg-success/10' : 'bg-danger/10'}`}>
                 {stats.meetsThreshold ? <Award size={20} /> : <ShieldAlert size={20} />}
              </div>
              <span className="leading-tight">
                {stats.meetsThreshold
                  ? 'System Eligible: Capstone Protocol Active'
                  : 'Action Required: Participation Threshold Violation'
                }
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Active Streak', value: stats.streak, icon: Flame, color: 'text-warning' },
                { label: 'Prime Node',   value: 'A+',          icon: Award, color: 'text-accent-glow' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-surface-inset/50 rounded-[1.5rem] p-5 text-center border border-border-subtle group-hover:bg-surface-raised/80 transition-colors">
                  <Icon size={20} className={`${color} mx-auto mb-3 group-hover:scale-125 transition-transform`} />
                  <p className="text-2xl font-black text-fg-primary tabular-nums tracking-tighter">{value}</p>
                  <p className="text-[9px] text-fg-tertiary uppercase tracking-widest font-black mt-1 opacity-60">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Log Engine */}
          <div className="card border border-border-subtle rounded-[2.5rem] overflow-hidden lg:col-span-2 bg-canvas shadow-raised">
            <div className="px-10 py-7 border-b border-border-subtle bg-surface-raised/40 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <Activity size={20} className="text-fg-tertiary" />
                 <h3 className="font-black text-fg-primary uppercase tracking-widest text-sm">Temporal Sync Log</h3>
              </div>
              <span className="text-[10px] text-fg-tertiary uppercase tracking-widest font-black bg-surface-inset px-4 py-1.5 rounded-xl border border-border-subtle">
                {stats.total} Atomic Entries
              </span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-inset">
                    {['Date Vector', 'Operational Objective', 'Status Rank', 'Duration'].map((h) => (
                      <th
                        key={h}
                        className="px-8 py-4 text-[10px] text-fg-tertiary uppercase tracking-[0.2em] font-black first:pl-10 last:pr-10 last:text-right"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/50">
                  {history.map((rec) => (
                    <tr
                      key={rec.id}
                      className="hover:bg-accent-glow/[0.02] transition-all group"
                    >
                      <td className="pl-10 py-6 font-mono text-xs text-fg-tertiary uppercase whitespace-nowrap opacity-60 group-hover:opacity-100">
                        {new Date(rec.sessions?.date || 0).toLocaleDateString('en-US', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="px-8 py-6">
                         <p className="text-sm text-fg-primary font-black tracking-tight group-hover:text-accent-glow transition-colors">
                           {rec.sessions?.topic || 'Terminated Node'}
                         </p>
                         <p className="text-[9px] text-fg-tertiary font-black uppercase tracking-widest mt-1 opacity-60">Verified Track</p>
                      </td>
                      <td className="px-8 py-6">
                        {rec.present ? (
                          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-success-bg/20 border border-success-border text-success shadow-success/10">
                            <CheckCircle2 size={12} strokeWidth={3} /> Synchronized
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-danger-bg/20 border border-danger-border text-danger shadow-danger/10">
                            <XCircle size={12} strokeWidth={3} /> Absent
                          </span>
                        )}
                      </td>
                      <td className="pr-10 py-6 text-right font-mono text-xs text-fg-tertiary group-hover:text-fg-primary transition-colors">
                        {rec.sessions?.duration_hours || 0}H Block
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-10 py-6 border-t border-border-subtle bg-surface-raised/20 flex justify-center">
               <button className="text-[10px] font-black text-fg-tertiary uppercase tracking-[0.25em] hover:text-accent-glow transition-colors flex items-center gap-2">
                  Expand Ledger <ChevronRight size={14} />
               </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
