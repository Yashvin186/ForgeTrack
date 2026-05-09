import { useState, useEffect, useMemo } from 'react';
import { 
  Search, TrendingUp, TrendingDown, Minus, 
  Calendar, User, ChevronRight, Activity,
  Flame, Award, AlertCircle, Loader2
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
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${color}`}>
      <Icon size={11} /> {pct}%
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
    async function init() {
      try {
        setLoading(true);
        const [studentList, sessionList] = await Promise.all([
          studentService.getAll(),
          sessionService.getAll()
        ]);
        
        // Fetch aggregate attendance for each student to show in the list
        const enrichedStudents = await Promise.all(studentList.map(async (s) => {
          const records = await attendanceService.getByStudent(s.id);
          const present = records.filter(r => r.present).length;
          const total = records.length;
          return { ...s, present, total, pct: total > 0 ? Math.round((present / total) * 100) : 0 };
        }));

        setStudents(enrichedStudents);
        setSessions(sessionList);
      } catch (err) {
        console.error('[StudentHistory] Init error:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedStudentId) return;
    
    async function fetchHistory() {
      try {
        setHistoryLoading(true);
        const records = await attendanceService.getByStudent(selectedStudentId);
        setStudentHistory(records);
      } catch (err) {
        console.error('[StudentHistory] Fetch history error:', err);
      } finally {
        setHistoryLoading(false);
      }
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

  // Calculate streaks for selected student
  const streaks = useMemo(() => {
    if (!studentHistory.length) return { current: 0, longest: 0 };
    
    // Sort by date ascending to calculate streaks
    const sorted = [...studentHistory].sort((a, b) => new Date(a.sessions?.date || 0) - new Date(b.sessions?.date || 0));
    let current = 0;
    let longest = 0;
    let temp = 0;

    sorted.forEach(rec => {
      if (rec.present) {
        temp++;
        if (temp > longest) longest = temp;
      } else {
        temp = 0;
      }
    });
    
    // Current streak (from last record backwards)
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].present) current++;
      else break;
    }

    return { current, longest };
  }, [studentHistory]);

  const stats = useMemo(() => {
    const total = students.length;
    const avgPct = Math.round(students.reduce((acc, s) => acc + s.pct, 0) / (total || 1));
    const atRisk = students.filter((s) => s.pct < 75).length;
    return { total, avgPct, atRisk, sessionCount: sessions.length };
  }, [students, sessions]);

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <header className="space-y-3">
          <div className="h-4 bg-surface-raised rounded w-24" />
          <div className="h-10 bg-surface-raised rounded-xl w-64" />
          <div className="h-4 bg-surface-raised rounded w-96" />
        </header>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-surface-raised rounded-2xl animate-glass-shimmer" />)}
        </div>
        <div className="h-96 bg-surface-raised rounded-2xl animate-glass-shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 animate-slide-up">
      {/* Header */}
      <header className="flex justify-between items-end">
        <div>
          <p className="text-[11px] text-fg-tertiary uppercase tracking-[0.18em] font-bold mb-1">Analytics</p>
          <h1 className="text-display-md text-fg-primary tracking-tight">Student History</h1>
          <p className="text-fg-secondary mt-1">Track individual attendance performance across all sessions.</p>
        </div>
        {selectedStudentId && (
          <button 
            onClick={() => setSelectedStudentId(null)}
            className="text-accent-glow text-sm font-bold flex items-center gap-2 hover:underline"
          >
            <ChevronRight size={16} className="rotate-180" /> Back to List
          </button>
        )}
      </header>

      {!selectedStudentId ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Students', value: stats.total, sub: 'enrolled' },
              { label: 'Avg Attendance',  value: `${stats.avgPct}%`,   sub: 'across cohort' },
              { label: 'At Risk',         value: stats.atRisk,          sub: '< 75%' },
              { label: 'Total Sessions',  value: stats.sessionCount,    sub: 'completed' },
            ].map(({ label, value, sub }) => (
              <div key={label} className="card border border-border-subtle rounded-2xl p-6">
                <p className="text-[10px] text-fg-tertiary uppercase tracking-widest font-bold mb-3">{label}</p>
                <p className="text-display-sm text-fg-primary tabular-nums font-black">{value}</p>
                <p className="text-[11px] text-fg-tertiary mt-1">{sub}</p>
              </div>
            ))}
          </div>

          {/* Search + Table */}
          <div className="card border border-border-subtle rounded-2xl overflow-hidden">
            {/* Search bar */}
            <div className="px-8 py-5 border-b border-border-subtle bg-surface-raised/30 flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-tertiary" />
                <input
                  type="text"
                  placeholder="Search by name or USN…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="input w-full pl-9 h-10 text-sm"
                />
              </div>
              <span className="text-[11px] text-fg-tertiary font-bold uppercase tracking-widest">
                {filtered.length} students
              </span>
            </div>

            <table className="w-full">
              <thead>
                <tr className="bg-surface-inset">
                  {['#', 'Student', 'USN', 'Branch', 'Sessions', 'Attendance'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-6 py-3 text-[10px] text-fg-tertiary uppercase tracking-[0.15em] font-bold text-left ${i === 0 ? 'pl-8 w-12' : ''} ${i === 5 ? 'pr-8' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, idx) => (
                  <tr 
                    key={s.id} 
                    onClick={() => setSelectedStudentId(s.id)}
                    className="border-b border-border-subtle hover:bg-surface-raised/40 transition-colors group cursor-pointer"
                  >
                    <td className="pl-8 py-4 text-fg-tertiary font-mono text-xs">{String(idx + 1).padStart(2, '0')}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent-glow/10 flex items-center justify-center text-accent-glow font-bold text-xs shrink-0">
                          {s.name.charAt(0)}
                        </div>
                        <span className="text-sm text-fg-primary font-medium group-hover:text-accent-glow transition-colors">
                          {s.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-fg-tertiary">{s.usn}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-md bg-surface-raised border border-border-subtle text-[11px] font-bold text-fg-secondary">
                        {s.branch_code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-fg-secondary tabular-nums">{s.present} / {s.total}</td>
                    <td className="pr-8 py-4">
                      <div className="flex items-center gap-3">
                        <PctBadge pct={s.pct} />
                        <div className="flex-1 h-1.5 bg-surface-inset rounded-full min-w-[60px]">
                          <div
                            className={`h-full rounded-full ${s.pct >= 75 ? 'bg-success' : s.pct >= 60 ? 'bg-warning' : 'bg-danger'}`}
                            style={{ width: `${s.pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <AlertCircle size={32} className="mx-auto mb-4 text-fg-tertiary opacity-20" />
                      <p className="text-sm text-fg-tertiary font-bold uppercase tracking-widest">No students found</p>
                      <p className="text-xs text-fg-tertiary mt-1">Try importing students via CSV or check your search query.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-right duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Left: Profile Card */}
             <div className="card border border-border-subtle rounded-2xl p-8 space-y-6">
                <div className="flex items-center gap-4">
                   <div className="w-16 h-16 rounded-2xl bg-accent-glow/10 flex items-center justify-center text-2xl font-black text-accent-glow">
                      {selectedStudent.name.charAt(0)}
                   </div>
                   <div>
                      <h2 className="text-xl font-bold text-fg-primary">{selectedStudent.name}</h2>
                      <p className="text-sm font-mono text-fg-tertiary">{selectedStudent.usn}</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-surface-inset p-4 rounded-xl border border-border-subtle">
                      <p className="text-[10px] text-fg-tertiary uppercase tracking-widest font-bold mb-1">Branch</p>
                      <p className="text-sm font-bold text-fg-primary">{selectedStudent.branch_code}</p>
                   </div>
                   <div className="bg-surface-inset p-4 rounded-xl border border-border-subtle">
                      <p className="text-[10px] text-fg-tertiary uppercase tracking-widest font-bold mb-1">Batch</p>
                      <p className="text-sm font-bold text-fg-primary">{selectedStudent.batch || 'Class of 2024'}</p>
                   </div>
                </div>

                <div className="space-y-2">
                   <div className="flex justify-between items-baseline">
                      <p className="text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">Attendance Rate</p>
                      <span className={`text-xl font-black ${selectedStudent.pct >= 75 ? 'text-success' : 'text-danger'}`}>{selectedStudent.pct}%</span>
                   </div>
                   <div className="h-2 w-full bg-surface-inset rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${selectedStudent.pct >= 75 ? 'bg-success' : 'bg-danger'}`}
                        style={{ width: `${selectedStudent.pct}%` }}
                      />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div className="p-4 rounded-xl border border-border-subtle bg-surface-raised flex flex-col items-center">
                      <Flame size={18} className="text-warning mb-1" />
                      <span className="text-lg font-black text-fg-primary">{streaks.current}</span>
                      <span className="text-[10px] text-fg-tertiary uppercase font-bold">Streak</span>
                   </div>
                   <div className="p-4 rounded-xl border border-border-subtle bg-surface-raised flex flex-col items-center">
                      <Award size={18} className="text-accent-glow mb-1" />
                      <span className="text-lg font-black text-fg-primary">{streaks.longest}</span>
                      <span className="text-[10px] text-fg-tertiary uppercase font-bold">Best</span>
                   </div>
                </div>
             </div>

             {/* Right: Heatmap Grid */}
             <div className="card lg:col-span-2 border border-border-subtle rounded-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-sm font-bold text-fg-primary uppercase tracking-widest flex items-center gap-2">
                      <Activity size={16} className="text-accent-glow" /> Attendance Heatmap
                   </h3>
                   <div className="flex items-center gap-4 text-[10px] text-fg-tertiary font-bold uppercase">
                      <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-success rounded-sm" /> Present</div>
                      <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-danger rounded-sm" /> Absent</div>
                      <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-surface-inset border border-border-subtle rounded-sm" /> No Record</div>
                   </div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                   {sessions.slice(0, 35).map((session) => {
                      const record = studentHistory.find(r => r.session_id === session.id);
                      const status = record ? (record.present ? 'present' : 'absent') : 'none';
                      
                      return (
                         <div 
                           key={session.id}
                           className={`aspect-square rounded-md border transition-all ${
                              status === 'present' ? 'bg-success border-success-border shadow-[0_0_10px_rgba(16,185,129,0.2)]' :
                              status === 'absent'  ? 'bg-danger border-danger-border' :
                              'bg-surface-inset border-border-subtle'
                           } group relative`}
                         >
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-surface border border-border-default rounded-lg text-[10px] font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-10 shadow-xl">
                               <p className="text-fg-primary mb-0.5">{session.topic}</p>
                               <p className="text-fg-tertiary">{new Date(session.date).toLocaleDateString()}</p>
                            </div>
                         </div>
                      );
                   })}
                </div>
                <p className="mt-4 text-[10px] text-fg-tertiary italic text-center font-bold uppercase tracking-widest opacity-50">Visual Cohort Heatmap</p>
             </div>
          </div>

          {/* History Table */}
          <div className="card border border-border-subtle rounded-2xl overflow-hidden">
             <div className="px-8 py-4 border-b border-border-subtle bg-surface-raised/30">
                <h3 className="text-sm font-bold text-fg-primary uppercase tracking-widest">Detailed Session History</h3>
             </div>
             {historyLoading ? (
               <div className="p-20 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="animate-spin text-accent-glow" size={32} />
                  <p className="text-sm text-fg-tertiary font-bold uppercase tracking-widest">Loading History...</p>
               </div>
             ) : (
               <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-inset">
                      <th className="pl-8 py-3 text-left text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">Date</th>
                      <th className="px-6 py-3 text-left text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">Topic</th>
                      <th className="px-6 py-3 text-left text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">Status</th>
                      <th className="pr-8 py-3 text-right text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {studentHistory.map((rec) => (
                      <tr key={rec.id} className="hover:bg-surface-raised/40 transition-colors group">
                        <td className="pl-8 py-4 text-xs font-mono text-fg-tertiary">
                          {new Date(rec.sessions?.date || 0).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-fg-primary group-hover:text-accent-glow transition-colors">{rec.sessions?.topic || 'Deleted Session'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            rec.present ? 'bg-success-bg border-success-border text-success' : 'bg-danger-bg border-danger-border text-danger'
                          }`}>
                            {rec.present ? 'Present' : 'Absent'}
                          </span>
                        </td>
                        <td className="pr-8 py-4 text-right font-mono text-xs text-fg-tertiary">{rec.sessions?.duration_hours || 0}h</td>
                      </tr>
                    ))}
                    {studentHistory.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-12 text-center">
                          <AlertCircle size={24} className="mx-auto mb-2 text-fg-tertiary opacity-30" />
                          <p className="text-sm text-fg-tertiary font-bold uppercase tracking-widest">No records found for this student</p>
                        </td>
                      </tr>
                    )}
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
