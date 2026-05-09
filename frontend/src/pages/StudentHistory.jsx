import { useState, useEffect, useMemo } from 'react';
import { 
  Search, TrendingUp, TrendingDown, Minus, 
  Activity, Flame, Award, AlertCircle,
  ChevronLeft, BarChart3, Users, Filter,
  Layers, Sparkles, Download, CheckCircle2, XCircle
} from 'lucide-react';
import { studentService } from '../services/student.service';
import { attendanceService } from '../services/attendance.service';
import { sessionService } from '../services/session.service';

function PctBadge({ pct }) {
  const color = pct >= 75 ? 'text-success bg-success-bg border-success-border'
              : pct >= 60 ? 'text-warning bg-warning-bg border-warning-border'
              : 'text-danger bg-danger-bg border-danger-border';
  const Icon  = pct >= 75 ? TrendingUp : pct >= 60 ? Minus : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${color}`}>
      <Icon size={10} strokeWidth={3} /> {pct}%
    </span>
  );
}

export default function StudentHistory() {
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        setLoading(true);
        const [studentList, sessionList, allAttendance] = await Promise.all([
          studentService.getAll().catch(() => []),
          sessionService.getAll().catch(() => []),
          attendanceService.getAllRecordsDetailed().catch(() => [])
        ]);
        
        if (!isMounted) return;

        const attendanceByStudent = {};
        allAttendance.forEach(rec => {
          if (!attendanceByStudent[rec.student_id]) {
            attendanceByStudent[rec.student_id] = { present: 0, total: 0 };
          }
          attendanceByStudent[rec.student_id].total++;
          if (rec.present) attendanceByStudent[rec.student_id].present++;
        });

        const enrichedStudents = studentList.map(s => {
          const stats = attendanceByStudent[s.id] || { present: 0, total: 0 };
          return { 
            ...s, 
            present: stats.present, 
            total: stats.total, 
            pct: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0 
          };
        });

        setStudents(enrichedStudents);
        setSessions(sessionList);
      } catch { /* Silent fail */ }
      finally { if (isMounted) setLoading(false); }
    }
    init();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedStudentId) return;
    
    async function fetchHistory() {
      try {
        setHistoryLoading(true);
        const records = await attendanceService.getByStudent(selectedStudentId).catch(() => []);
        setStudentHistory(records);
      } catch { /* Silent fail */ }
      finally { setHistoryLoading(false); }
    }
    fetchHistory();
  }, [selectedStudentId]);

  const filtered = useMemo(() => {
    return students
      .filter((s) =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.usn.toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) => b.pct - a.pct);
  }, [students, query]);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const streaks = useMemo(() => {
    if (!studentHistory.length) return { current: 0, longest: 0 };
    const sorted = [...studentHistory].sort((a, b) => new Date(a.sessions?.date || 0) - new Date(b.sessions?.date || 0));
    let current = 0; let longest = 0; let temp = 0;
    sorted.forEach(rec => {
      if (rec.present) { temp++; if (temp > longest) longest = temp; }
      else temp = 0;
    });
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].present) current++;
      else break;
    }
    return { current, longest };
  }, [studentHistory]);

  const stats = useMemo(() => {
    const total = students.length;
    const avgPct = total > 0 ? Math.round(students.reduce((acc, s) => acc + s.pct, 0) / total) : 0;
    const atRisk = students.filter((s) => s.pct < 75).length;
    return { total, avgPct, atRisk, sessionCount: sessions.length };
  }, [students, sessions]);

  if (loading && students.length === 0) {
    return (
      <div className="space-y-12 pb-16 animate-fade-in">
        <header className="space-y-4">
          <div className="h-4 w-32 bg-surface-raised rounded animate-pulse" />
          <div className="h-14 w-96 bg-surface-raised rounded-2xl animate-pulse" />
        </header>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
             <div key={i} className="h-32 bg-surface-raised/40 rounded-[2rem] border border-border-subtle animate-glass-shimmer" />
          ))}
        </div>
        <div className="card h-[600px] bg-surface-raised/40 border border-border-subtle animate-glass-shimmer rounded-[3rem]" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 animate-slide-up">
      {/* ── Header ────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <p className="text-[10px] text-accent-glow font-black uppercase tracking-[0.25em] mb-1">Intelligence Layer</p>
          <h1 className="text-display-md text-fg-primary tracking-tighter">Student Analytics</h1>
          <p className="text-lg text-fg-secondary tracking-tight font-medium">Evaluate individual performance vectors across the temporal domain.</p>
        </div>
        {selectedStudentId && (
          <button 
            onClick={() => setSelectedStudentId(null)}
            className="group flex items-center gap-3 px-6 py-3 rounded-2xl border border-border-strong bg-surface hover:bg-surface-raised transition-all text-sm font-black text-fg-secondary hover:text-fg-primary"
          >
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back to Fleet
          </button>
        )}
      </header>

      {!selectedStudentId ? (
        <>
          {/* Summary Dash */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Registered Entities', value: stats.total, sub: 'active cohort', icon: Users },
              { label: 'Participation Mean',  value: `${stats.avgPct}%`,   sub: 'system average', icon: BarChart3 },
              { label: 'Engagement Risk',     value: stats.atRisk,          sub: 'below 75% threshold', icon: AlertCircle },
              { label: 'Temporal Tracks',     value: stats.sessionCount,    sub: 'recorded sessions', icon: Layers },
            ].map(({ label, value, sub, icon: Icon }) => (
              <div key={label} className="card border border-border-subtle rounded-[2rem] p-7 group hover:bg-surface-raised transition-all duration-500 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-glow/[0.03] rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                <div className="flex items-center justify-between mb-4">
                   <p className="text-[10px] text-fg-tertiary uppercase tracking-widest font-black">{label}</p>
                   <Icon size={16} className="text-fg-tertiary group-hover:text-accent-glow transition-colors" />
                </div>
                <p className="text-display-sm text-fg-primary tabular-nums font-black leading-none tracking-tighter">{value}</p>
                <p className="text-[11px] text-fg-tertiary font-bold uppercase tracking-widest mt-3 opacity-60">{sub}</p>
              </div>
            ))}
          </div>

          {/* Registry Ledger */}
          <div className="card border border-border-subtle rounded-[3rem] bg-canvas shadow-raised overflow-hidden">
            <div className="px-10 py-6 border-b border-border-subtle bg-surface-raised/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
               <div className="relative flex-1 max-w-sm">
                 <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-tertiary" />
                 <input
                   type="text"
                   placeholder="Search identity or USN…"
                   value={query}
                   onChange={(e) => setQuery(e.target.value)}
                   className="input w-full pl-12 h-12 text-sm font-bold bg-surface-inset border-border-strong focus:border-accent-glow"
                 />
               </div>
               <div className="flex items-center gap-6">
                  <span className="text-[10px] text-fg-tertiary font-black uppercase tracking-[0.2em]">
                    {filtered.length} Indexed Entities
                  </span>
                  <button className="text-[10px] text-accent-glow font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-80">
                     <Filter size={14} /> Refine List
                  </button>
               </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-inset">
                    <th className="pl-10 py-4 text-left text-[10px] text-fg-tertiary uppercase tracking-widest font-black">#</th>
                    <th className="px-8 py-4 text-left text-[10px] text-fg-tertiary uppercase tracking-widest font-black">Entity Identity</th>
                    <th className="px-8 py-4 text-left text-[10px] text-fg-tertiary uppercase tracking-widest font-black">Identifier</th>
                    <th className="px-8 py-4 text-left text-[10px] text-fg-tertiary uppercase tracking-widest font-black">Scope</th>
                    <th className="px-8 py-4 text-left text-[10px] text-fg-tertiary uppercase tracking-widest font-black">Participation</th>
                    <th className="pr-10 py-4 text-right text-[10px] text-fg-tertiary uppercase tracking-widest font-black">Integrity Rank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/50">
                  {filtered.map((s, idx) => (
                    <tr 
                      key={s.id} 
                      onClick={() => setSelectedStudentId(s.id)}
                      className="group border-b border-border-subtle/30 hover:bg-accent-glow/[0.02] transition-all cursor-pointer"
                    >
                      <td className="pl-10 py-5 text-fg-tertiary font-mono text-xs opacity-40">{String(idx + 1).padStart(2, '0')}</td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-surface-raised border border-border-subtle flex items-center justify-center text-accent-glow font-black text-sm shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                            {s.name.charAt(0)}
                          </div>
                          <span className="text-sm text-fg-primary font-black tracking-tight group-hover:text-accent-glow transition-colors">
                            {s.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 font-mono text-xs text-fg-secondary">{s.usn}</td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 rounded-xl bg-surface-raised border border-border-subtle text-[10px] font-black uppercase tracking-widest text-fg-tertiary">
                          {s.branch_code}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                         <p className="text-sm font-black text-fg-primary tabular-nums tracking-tighter">{s.present} / {s.total}</p>
                         <p className="text-[9px] text-fg-tertiary uppercase font-black tracking-widest mt-0.5">Records Logged</p>
                      </td>
                      <td className="pr-10 py-5 text-right">
                        <div className="flex flex-col items-end gap-2">
                          <PctBadge pct={s.pct} />
                          <div className="w-24 h-1.5 bg-surface-inset rounded-full overflow-hidden border border-border-subtle p-0.5">
                            <div
                              className={`h-full rounded-full transition-all duration-700 shadow-glow ${s.pct >= 75 ? 'bg-success' : s.pct >= 60 ? 'bg-warning' : 'bg-danger'}`}
                              style={{ width: `${s.pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-10 animate-in slide-in-from-right duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
             {/* Profile Engine */}
             <div className="card border border-border-subtle rounded-[2.5rem] p-10 space-y-8 bg-surface-raised/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-accent-glow/5 to-transparent pointer-events-none" />
                
                <div className="flex items-center gap-6 relative z-10">
                   <div className="w-20 h-20 rounded-[2rem] bg-surface-raised border border-border-strong flex items-center justify-center text-3xl font-black text-accent-glow shadow-raised">
                      {selectedStudent.name.charAt(0)}
                   </div>
                   <div>
                      <h2 className="text-2xl font-black text-fg-primary tracking-tighter leading-none">{selectedStudent.name}</h2>
                      <p className="text-xs font-mono text-fg-tertiary uppercase tracking-widest mt-2">{selectedStudent.usn}</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 relative z-10">
                   <div className="bg-surface-inset/50 p-5 rounded-2xl border border-border-subtle flex flex-col justify-center">
                      <p className="text-[10px] text-fg-tertiary uppercase tracking-widest font-black mb-1.5 opacity-60">Entity Domain</p>
                      <p className="text-lg font-black text-fg-primary tracking-tight uppercase">{selectedStudent.branch_code}</p>
                   </div>
                   <div className="bg-surface-inset/50 p-5 rounded-2xl border border-border-subtle flex flex-col justify-center">
                      <p className="text-[10px] text-fg-tertiary uppercase tracking-widest font-black mb-1.5 opacity-60">System Batch</p>
                      <p className="text-lg font-black text-fg-primary tracking-tight">{selectedStudent.batch || '2024'}</p>
                   </div>
                </div>

                <div className="space-y-4 relative z-10">
                   <div className="flex justify-between items-baseline px-1">
                      <p className="text-[10px] text-fg-tertiary uppercase tracking-[0.2em] font-black">Engagement Integrity</p>
                      <span className={`text-3xl font-black tabular-nums tracking-tighter ${selectedStudent.pct >= 75 ? 'text-success' : 'text-danger'}`}>{selectedStudent.pct}%</span>
                   </div>
                   <div className="h-3 w-full bg-surface-inset rounded-full overflow-hidden p-0.5 border border-border-subtle shadow-inner">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 shadow-glow ${selectedStudent.pct >= 75 ? 'bg-success' : 'bg-danger'}`}
                        style={{ width: `${selectedStudent.pct}%` }}
                      />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 relative z-10">
                   <div className="p-5 rounded-2xl border border-border-subtle bg-surface-raised flex flex-col items-center group cursor-default">
                      <Flame size={20} className="text-warning mb-2 group-hover:scale-125 transition-transform" />
                      <span className="text-2xl font-black text-fg-primary tracking-tighter">{streaks.current}</span>
                      <span className="text-[10px] text-fg-tertiary uppercase font-black tracking-widest mt-1">Live Streak</span>
                   </div>
                   <div className="p-5 rounded-2xl border border-border-subtle bg-surface-raised flex flex-col items-center group cursor-default">
                      <Award size={20} className="text-accent-glow mb-2 group-hover:scale-125 transition-transform" />
                      <span className="text-2xl font-black text-fg-primary tracking-tighter">{streaks.longest}</span>
                      <span className="text-[10px] text-fg-tertiary uppercase font-black tracking-widest mt-1">Prime Record</span>
                   </div>
                </div>

                <button className="w-full py-4 rounded-2xl border border-border-strong text-[10px] font-black uppercase tracking-[0.25em] text-fg-tertiary hover:text-fg-primary hover:bg-surface-raised transition-all">
                   Generate Strategic Report
                </button>
             </div>

             {/* Insight Heatmap */}
             <div className="card lg:col-span-2 border border-border-subtle rounded-[2.5rem] p-10 bg-canvas/40 shadow-raised relative overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 p-10 opacity-5">
                   <Activity size={120} className="text-accent-glow" />
                </div>
                
                <div className="flex items-center justify-between mb-10 relative z-10">
                   <div className="space-y-1">
                      <h3 className="text-lg font-black text-fg-primary tracking-tight flex items-center gap-3">
                         <Sparkles size={18} className="text-accent-glow" /> Participation Heatmap
                      </h3>
                      <p className="text-[10px] text-fg-tertiary font-black uppercase tracking-widest">Temporal Density Visualization</p>
                   </div>
                   <div className="flex items-center gap-6 text-[9px] text-fg-tertiary font-black uppercase tracking-widest">
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-success rounded-md shadow-glow" /> Sync</div>
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-danger rounded-md" /> Void</div>
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-surface-inset border border-border-subtle rounded-md" /> No Data</div>
                   </div>
                </div>

                <div className="grid grid-cols-7 sm:grid-cols-10 gap-3 relative z-10">
                   {sessions.slice(0, 40).map((session) => {
                      const record = studentHistory.find(r => r.session_id === session.id);
                      const status = record ? (record.present ? 'present' : 'absent') : 'none';
                      
                      return (
                         <div 
                           key={session.id}
                           className={`aspect-square rounded-xl border-2 transition-all duration-500 hover:scale-110 cursor-help group relative ${
                              status === 'present' ? 'bg-success/20 border-success shadow-glow' :
                              status === 'absent'  ? 'bg-danger/10 border-danger/40' :
                              'bg-surface-inset border-border-subtle opacity-40'
                           }`}
                         >
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-4 bg-void/90 backdrop-blur-xl border border-border-strong rounded-2xl text-[10px] font-black opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-20 shadow-2xl scale-90 group-hover:scale-100">
                               <p className="text-accent-glow uppercase tracking-widest mb-1">Session Node</p>
                               <p className="text-fg-primary text-xs tracking-tight mb-2 leading-tight">{session.topic}</p>
                               <div className="flex justify-between items-center pt-2 border-t border-white/10">
                                  <span className="text-fg-tertiary">{new Date(session.date).toLocaleDateString()}</span>
                                  <span className={status === 'present' ? 'text-success' : status === 'absent' ? 'text-danger' : 'text-fg-tertiary'}>
                                     {status.toUpperCase()}
                                  </span>
                               </div>
                            </div>
                         </div>
                      );
                   })}
                </div>
                <div className="mt-auto pt-10 flex items-center justify-between relative z-10">
                   <p className="text-[10px] text-fg-tertiary font-black uppercase tracking-[0.2em] opacity-40">Integrated Telemetry View</p>
                   <button className="text-[10px] text-accent-glow font-black uppercase tracking-widest flex items-center gap-2 hover:underline">
                      <Download size={14} /> Export Visual Map
                   </button>
                </div>
             </div>
          </div>

          {/* History Ledger */}
          <div className="card border border-border-subtle rounded-[3rem] bg-canvas shadow-raised overflow-hidden">
             <div className="px-10 py-6 border-b border-border-subtle bg-surface-raised/40 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <Activity size={18} className="text-fg-tertiary" />
                   <h3 className="text-[11px] font-black text-fg-primary uppercase tracking-[0.2em]">Temporal Activity Log</h3>
                </div>
                <div className="px-4 py-1.5 bg-surface-inset border border-border-subtle rounded-xl text-[10px] font-black text-fg-tertiary tracking-widest uppercase">
                   {studentHistory.length} Atomic Records
                </div>
             </div>
             {historyLoading ? (
               <div className="py-32 flex flex-col items-center justify-center gap-6">
                  <div className="w-12 h-12 rounded-full border-2 border-accent-glow/20 border-t-accent-glow animate-spin" />
                  <p className="text-[10px] text-fg-tertiary font-black uppercase tracking-[0.25em] animate-pulse">Syncing Log Stream...</p>
               </div>
             ) : (
               <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-inset">
                      <th className="pl-10 py-4 text-left text-[10px] text-fg-tertiary uppercase tracking-widest font-black">Record Date</th>
                      <th className="px-8 py-4 text-left text-[10px] text-fg-tertiary uppercase tracking-widest font-black">Session Objective</th>
                      <th className="px-8 py-4 text-left text-[10px] text-fg-tertiary uppercase tracking-widest font-black">Status Vector</th>
                      <th className="pr-10 py-4 text-right text-[10px] text-fg-tertiary uppercase tracking-widest font-black">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle/50">
                    {studentHistory.map((rec) => (
                      <tr key={rec.id} className="hover:bg-accent-glow/[0.02] transition-colors group">
                        <td className="pl-10 py-5 text-xs font-mono text-fg-tertiary uppercase">
                          {new Date(rec.sessions?.date || 0).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-sm font-black text-fg-primary tracking-tight group-hover:text-accent-glow transition-colors">{rec.sessions?.topic || 'Terminated Node'}</p>
                          <p className="text-[9px] text-fg-tertiary font-black uppercase tracking-[0.15em] mt-1 opacity-60">System Synchronized</p>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                            rec.present ? 'bg-success-bg border-success-border text-success shadow-success/10' : 'bg-danger-bg border-danger-border text-danger shadow-danger/10'
                          }`}>
                            {rec.present ? <CheckCircle2 size={12} strokeWidth={3} /> : <XCircle size={12} strokeWidth={3} />}
                            {rec.present ? 'Verified' : 'Absent'}
                          </span>
                        </td>
                        <td className="pr-10 py-5 text-right font-mono text-xs text-fg-tertiary group-hover:text-fg-primary transition-colors">{rec.sessions?.duration_hours || 0}H Block</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
