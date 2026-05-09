import { useState, useMemo, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, Save, Users, ChevronDown, 
  Search, Plus, Trash2, History,
  Calendar, BookOpen, UserPlus, Loader2,
  ArrowRight, Activity,
  CheckSquare, Square
} from 'lucide-react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { sessionService } from '../services/session.service';
import { studentService } from '../services/student.service';
import { attendanceService } from '../services/attendance.service';
import { supabase } from '../lib/supabaseClient';

export default function MarkAttendance() {
  // State
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); 
  
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const [newSession, setNewSession] = useState({ topic: '', date: new Date().toISOString().split('T')[0] });
  const [newStudent, setNewStudent] = useState({ name: '', usn: '' });
  
  const [toast, setToast] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // History Modal Stats State
  const [sessionStats, setSessionStats] = useState({});
  const [loadingStats, setLoadingStats] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        setLoading(true);
        const [sessionList, studentList] = await Promise.all([
          sessionService.getAll().catch(() => []),
          studentService.getAll().catch(() => [])
        ]);
        
        if (!isMounted) return;
        setSessions(sessionList);
        setStudents(studentList);
        
        if (sessionList.length > 0) {
          setSelectedSessionId(sessionList[0].id);
        }
      } catch {
        setToast({ message: 'Failed to synchronize system data', type: 'error' });
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => { isMounted = false; };
  }, []);

  // Fetch attendance for selected session
  useEffect(() => {
    if (!selectedSessionId || students.length === 0) return;
    
    let isMounted = true;
    async function fetchAttendance() {
      try {
        const records = await attendanceService.getBySession(selectedSessionId).catch(() => []);
        if (!isMounted) return;
        
        const attendanceMap = {};
        students.forEach(s => { attendanceMap[s.id] = false; });
        records.forEach(r => {
          attendanceMap[r.student_id] = r.present;
        });
        setAttendance(attendanceMap);
        setHasUnsavedChanges(false);
      } catch { /* Silent fail */ }
    }
    fetchAttendance();
    return () => { isMounted = false; };
  }, [selectedSessionId, students]);

  // Derived state
  const selectedSession = sessions.find(s => s.id === selectedSessionId);
  
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           student.usn.toLowerCase().includes(searchQuery.toLowerCase());
      
      const isPresent = attendance[student.id];
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'present' && isPresent) || 
                           (statusFilter === 'absent' && !isPresent);
      
      return matchesSearch && matchesStatus;
    });
  }, [students, searchQuery, statusFilter, attendance]);

  const stats = useMemo(() => {
    const total = students.length;
    const present = Object.values(attendance).filter(Boolean).length;
    const absent = total - present;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, percentage };
  }, [students, attendance]);

  // Handlers
  const toggleAttendance = (id) => {
    setAttendance(prev => ({ ...prev, [id]: !prev[id] }));
    setHasUnsavedChanges(true);
  };

  const markAll = (val) => {
    const newAttendance = { ...attendance };
    students.forEach(s => { newAttendance[s.id] = val; });
    setAttendance(newAttendance);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      const records = Object.entries(attendance).map(([studentId, present]) => ({
        student_id: studentId,
        session_id: selectedSessionId,
        present,
        marked_by: authUser?.email || 'System',
        marked_at: new Date().toISOString()
      }));

      await attendanceService.upsertBatch(records);
      setHasUnsavedChanges(false);
      setToast({ message: 'Attendance records synchronized', type: 'success' });
    } catch {
      setToast({ message: 'Synchronization protocol failed', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSession = async () => {
    if (!newSession.topic) return;
    try {
      const payload = {
        topic: newSession.topic,
        date: newSession.date,
        month_number: new Date(newSession.date).getMonth() + 1,
        duration_hours: 2,
        session_type: 'offline'
      };
      const created = await sessionService.create(payload);
      setSessions([created, ...sessions]);
      setSelectedSessionId(created.id);
      setIsNewSessionModalOpen(false);
      setNewSession({ topic: '', date: new Date().toISOString().split('T')[0] });
      setToast({ message: 'Operational session initialized', type: 'success' });
    } catch {
      setToast({ message: 'Failed to initialize session', type: 'error' });
    }
  };

  // Warning for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Fetch real stats for the History modal
  useEffect(() => {
    if (isHistoryModalOpen && sessions.length > 0) {
      async function fetchAllStats() {
        try {
          setLoadingStats(true);
          const statsMap = {};
          await Promise.all(sessions.map(async (s) => {
            const records = await attendanceService.getBySession(s.id).catch(() => []);
            const present = records.filter(r => r.present).length;
            const total = students.length || records.length;
            statsMap[s.id] = {
              present,
              total,
              pct: total > 0 ? Math.round((present / total) * 100) : 0
            };
          }));
          setSessionStats(statsMap);
        } catch { /* Silent fail */ }
        finally { setLoadingStats(false); }
      }
      fetchAllStats();
    }
  }, [isHistoryModalOpen, sessions, students.length]);

  if (loading && sessions.length === 0) {
    return (
      <div className="space-y-12 pb-16 animate-fade-in">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="space-y-3">
              <div className="h-4 w-32 bg-surface-raised rounded animate-pulse" />
              <div className="h-14 w-96 bg-surface-raised rounded-2xl animate-pulse" />
           </div>
           <div className="flex gap-4">
              <div className="h-12 w-40 bg-surface-raised rounded-2xl animate-pulse" />
              <div className="h-12 w-40 bg-surface-raised rounded-2xl animate-pulse" />
           </div>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="h-48 bg-surface-raised/40 rounded-[2.5rem] lg:col-span-2 border border-border-subtle animate-glass-shimmer" />
           <div className="h-48 bg-surface-raised/40 rounded-[2.5rem] border border-border-subtle animate-glass-shimmer" />
        </div>
        <div className="card h-[500px] bg-surface-raised/40 border border-border-subtle animate-glass-shimmer rounded-[3rem]" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 animate-slide-up">

      {/* ── Header Area ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <header className="space-y-2">
          <p className="text-[10px] text-accent-glow font-black uppercase tracking-[0.25em] mb-1">Session Management</p>
          <h1 className="text-display-md text-fg-primary tracking-tighter">Mark Attendance</h1>
          <p className="text-lg text-fg-secondary tracking-tight font-medium">Record cohort participation for your active tracks.</p>
        </header>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsHistoryModalOpen(true)}
            className="flex items-center gap-3 px-6 py-3.5 rounded-2xl border border-border-strong bg-surface hover:bg-surface-raised transition-all text-sm font-black text-fg-secondary hover:text-fg-primary"
          >
            <History size={18} /> History
          </button>
          <button 
            onClick={() => setIsNewSessionModalOpen(true)}
            className="btn-primary flex items-center gap-3 px-8 py-3.5 rounded-2xl shadow-glow text-sm font-black"
          >
            <Plus size={20} strokeWidth={3} /> Create Session
          </button>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="card p-24 flex flex-col items-center text-center border border-border-strong border-dashed rounded-[3rem] bg-surface-raised/10 group hover:bg-accent-glow/[0.02] transition-colors">
          <div className="w-24 h-24 rounded-[2.5rem] bg-surface-raised border border-border-default flex items-center justify-center text-fg-tertiary mb-8 group-hover:scale-110 transition-transform shadow-raised">
             <Calendar size={48} strokeWidth={1} />
          </div>
          <h2 className="text-3xl font-black text-fg-primary tracking-tight">No Active Sessions</h2>
          <p className="text-fg-secondary mt-3 mb-10 max-w-sm text-lg font-medium">Initialize a session to begin capturing cohort attendance telemetry.</p>
          <button 
            onClick={() => setIsNewSessionModalOpen(true)}
            className="btn-primary flex items-center gap-3 px-10 py-4 rounded-2xl shadow-glow text-sm font-black tracking-widest uppercase"
          >
            Launch First Session <ArrowRight size={18} />
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* ── Active Session Insights ───────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="card lg:col-span-2 p-8 border border-border-subtle rounded-[2.5rem] bg-surface-raised/20 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-accent-glow/5 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none" />
               <div className="flex items-center justify-between mb-6 relative z-10">
                  <label className="text-[10px] text-fg-tertiary uppercase tracking-[0.2em] font-black">Active Stream</label>
                  {hasUnsavedChanges && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-warning-bg border border-warning-border rounded-full text-[10px] font-black uppercase text-warning animate-pulse">
                      <div className="w-1.5 h-1.5 rounded-full bg-warning" /> Pending Sync
                    </div>
                  )}
               </div>
               <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-center">
                  <div className="relative flex-1">
                     <select
                       value={selectedSessionId}
                       onChange={(e) => {
                         if (hasUnsavedChanges && !confirm('Discard unsaved participation data?')) return;
                         setSelectedSessionId(Number(e.target.value));
                         setHasUnsavedChanges(false);
                       }}
                       className="input w-full appearance-none pr-12 cursor-pointer h-16 text-2xl font-black tracking-tighter bg-surface-inset border-border-strong focus:border-accent-glow transition-all"
                     >
                       {sessions.map((s) => (
                         <option key={s.id} value={s.id}>
                           {s.topic}
                         </option>
                       ))}
                     </select>
                     <ChevronDown size={24} className="absolute right-5 top-1/2 -translate-y-1/2 text-fg-tertiary pointer-events-none" />
                  </div>
                  <div className="px-6 py-4 bg-surface-raised border border-border-subtle rounded-2xl text-center shrink-0">
                     <p className="text-[10px] text-fg-tertiary font-black uppercase tracking-widest mb-1">Session Date</p>
                     <p className="text-lg font-black text-fg-primary tracking-tight">
                        {selectedSession ? new Date(selectedSession.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                     </p>
                  </div>
               </div>
            </div>

            <div className="card p-8 border border-border-subtle rounded-[2.5rem] bg-surface-raised/20 flex flex-col justify-between group">
               <div className="flex items-center justify-between">
                 <span className="text-[10px] text-fg-tertiary uppercase tracking-[0.2em] font-black">Cohort Presence</span>
                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black border ${stats.percentage >= 75 ? 'bg-success-bg text-success border-success-border' : 'bg-warning-bg text-warning border-warning-border'}`}>
                    {stats.percentage}%
                 </div>
               </div>
               <div className="mt-6 space-y-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-display-sm font-black text-fg-primary tracking-tighter">{stats.present}</span>
                    <span className="text-fg-tertiary font-black text-xs uppercase tracking-widest">/ {stats.total} Synchronized</span>
                  </div>
                  <div className="h-3 w-full bg-surface-inset rounded-full overflow-hidden p-0.5 border border-border-subtle shadow-inner">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ease-out shadow-glow ${stats.percentage >= 75 ? 'bg-success' : stats.percentage >= 50 ? 'bg-warning' : 'bg-danger'}`}
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>
               </div>
            </div>
          </div>

          {/* ── Main Data Ledger ──────────────────────────────────── */}
          <div className="card border border-border-subtle rounded-[3rem] bg-canvas shadow-raised relative overflow-hidden">
            
            {/* Context Actions */}
            <div className="px-8 py-6 border-b border-border-subtle bg-surface-raised/40 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-6 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-tertiary" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search USN or Identity..." 
                    className="input pl-12 w-full h-12 text-sm font-bold bg-surface-inset border-border-strong focus:border-accent-glow"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-1.5 p-1.5 bg-surface-inset rounded-2xl border border-border-subtle shadow-inner">
                  {['all', 'present', 'absent'].map(f => (
                    <button
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      className={`px-5 py-2 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all ${
                        statusFilter === f ? 'bg-surface-raised text-accent-glow shadow-md' : 'text-fg-tertiary hover:text-fg-secondary'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4 pr-6 border-r border-border-subtle">
                  <button 
                    onClick={() => markAll(true)}
                    className="text-[10px] font-black text-success uppercase tracking-[0.2em] hover:text-success/80 transition-colors flex items-center gap-2"
                  >
                    <CheckSquare size={14} /> Global Present
                  </button>
                  <button 
                    onClick={() => markAll(false)}
                    className="text-[10px] font-black text-danger uppercase tracking-[0.2em] hover:text-danger/80 transition-colors flex items-center gap-2"
                  >
                    <Square size={14} /> Global Absent
                  </button>
                </div>
                <button 
                  onClick={() => setIsAddStudentModalOpen(true)}
                  className="flex items-center gap-2 text-accent-glow font-black text-[10px] uppercase tracking-[0.2em] hover:opacity-80 transition-opacity"
                >
                  <UserPlus size={16} /> Register Student
                </button>
              </div>
            </div>

            {/* List Engine */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-inset">
                    <th className="pl-10 py-4 text-left text-[10px] text-fg-tertiary uppercase tracking-widest font-black">#</th>
                    <th className="px-8 py-4 text-left text-[10px] text-fg-tertiary uppercase tracking-widest font-black">Identity (USN)</th>
                    <th className="px-8 py-4 text-left text-[10px] text-fg-tertiary uppercase tracking-widest font-black">Entity Name</th>
                    <th className="px-8 py-4 text-left text-[10px] text-fg-tertiary uppercase tracking-widest font-black">Presence Status</th>
                    <th className="pr-10 py-4 text-right text-[10px] text-fg-tertiary uppercase tracking-widest font-black">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/50">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student, idx) => {
                      const isPresent = attendance[student.id];
                      return (
                        <tr key={student.id} className="hover:bg-accent-glow/[0.02] transition-colors group">
                          <td className="pl-10 py-5 text-xs font-mono text-fg-tertiary opacity-40">{String(idx + 1).padStart(2, '0')}</td>
                          <td className="px-8 py-5 text-xs font-mono text-fg-secondary group-hover:text-fg-primary transition-colors">{student.usn}</td>
                          <td className="px-8 py-5">
                            <p className="text-sm font-black text-fg-primary tracking-tight group-hover:text-accent-glow transition-colors">{student.name}</p>
                            <p className="text-[10px] text-fg-tertiary font-bold uppercase tracking-widest mt-0.5">{student.branch_code} / {student.batch || '2024'}</p>
                          </td>
                          <td className="px-8 py-5">
                            <button 
                              onClick={() => toggleAttendance(student.id)}
                              className={`inline-flex items-center gap-3 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all border shadow-sm ${
                                isPresent 
                                  ? 'bg-success-bg border-success-border text-success shadow-success/10' 
                                  : 'bg-danger-bg border-danger-border text-danger shadow-danger/10'
                              }`}
                            >
                              {isPresent ? <CheckCircle2 size={12} strokeWidth={3} /> : <XCircle size={12} strokeWidth={3} />}
                              {isPresent ? 'Present' : 'Absent'}
                            </button>
                          </td>
                          <td className="pr-10 py-5 text-right">
                             <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2.5 text-fg-tertiary hover:text-fg-primary hover:bg-surface-raised rounded-xl transition-all">
                                   <Activity size={16} />
                                </button>
                                <button className="p-2.5 text-fg-tertiary hover:text-danger hover:bg-danger-bg/50 rounded-xl transition-all">
                                   <Trash2 size={16} />
                                </button>
                             </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-24 text-center">
                        <div className="w-20 h-20 rounded-[2rem] bg-surface-raised border border-border-default flex items-center justify-center text-fg-tertiary mb-6 mx-auto opacity-20">
                           <Users size={40} />
                        </div>
                        <p className="text-lg font-black text-fg-primary tracking-tight">No entities found in this scope</p>
                        <p className="text-sm text-fg-tertiary mt-2 font-medium">Refine your filters or search criteria.</p>
                        <button 
                          onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                          className="mt-6 text-accent-glow text-[10px] font-black uppercase tracking-widest hover:underline"
                        >
                          Reset Scope Parameters
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Commit Bar */}
            <div className="px-10 py-8 border-t border-border-subtle bg-surface-raised/40 flex flex-col sm:flex-row items-center justify-between gap-8">
               <div className="flex items-center gap-10">
                  <div className="space-y-1">
                    <p className="text-[10px] text-fg-tertiary uppercase tracking-widest font-black">Cohort Magnitude</p>
                    <p className="text-2xl font-black text-fg-primary tracking-tighter">{students.length} <span className="text-sm font-bold text-fg-tertiary uppercase ml-1">Registered</span></p>
                  </div>
                  <div className="w-px h-10 bg-border-subtle" />
                  <div className="space-y-1">
                    <p className="text-[10px] text-fg-tertiary uppercase tracking-widest font-black">Present Count</p>
                    <p className="text-2xl font-black text-success tracking-tighter">{stats.present} <span className="text-sm font-bold text-fg-tertiary uppercase ml-1">Verified</span></p>
                  </div>
               </div>

               <button 
                onClick={handleSave}
                disabled={!hasUnsavedChanges || saving}
                className={`flex items-center gap-3 px-12 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-glow min-w-[240px] justify-center ${
                  hasUnsavedChanges 
                    ? 'btn-primary shadow-accent-glow/20 active:scale-95' 
                    : 'bg-surface-inset text-fg-tertiary cursor-not-allowed border border-border-strong opacity-50'
                } ${saving ? 'opacity-70 pointer-events-none' : ''}`}
               >
                 {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} strokeWidth={3} />}
                 {saving ? 'Syncing...' : 'Synchronize Ledger'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────── */}
      <Modal 
        isOpen={isNewSessionModalOpen} 
        onClose={() => setIsNewSessionModalOpen(false)}
        title="Initialize New Track"
        footer={(
          <div className="flex items-center justify-end gap-4 w-full">
            <button onClick={() => setIsNewSessionModalOpen(false)} className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-fg-tertiary hover:text-fg-primary transition-colors">Discard</button>
            <button onClick={handleCreateSession} className="btn-primary px-10 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-glow">Start Session</button>
          </div>
        )}
      >
        <div className="space-y-8 py-4">
          <div className="space-y-3">
            <label className="text-[10px] text-fg-tertiary uppercase tracking-widest font-black">Session Objective</label>
            <div className="relative">
              <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-tertiary" size={20} />
              <input 
                type="text" 
                placeholder="e.g. Advanced System Architecture" 
                className="input pl-12 w-full h-14 text-lg font-black tracking-tight"
                value={newSession.topic}
                onChange={e => setNewSession({...newSession, topic: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] text-fg-tertiary uppercase tracking-widest font-black">Execution Date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-tertiary" size={20} />
              <input 
                type="date" 
                className="input pl-12 w-full h-14 text-lg font-black tracking-tight"
                value={newSession.date}
                onChange={e => setNewSession({...newSession, date: e.target.value})}
              />
            </div>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isAddStudentModalOpen} 
        onClose={() => setIsAddStudentModalOpen(false)}
        title="Register New Entity"
        footer={(
          <div className="flex items-center justify-end gap-4 w-full">
            <button onClick={() => setIsAddStudentModalOpen(false)} className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-fg-tertiary hover:text-fg-primary">Cancel</button>
            <button onClick={() => {/* handleAddStudent placeholder */}} className="btn-primary px-10 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-glow">Register</button>
          </div>
        )}
      >
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <label className="text-[10px] text-fg-tertiary uppercase tracking-widest font-black">Entity Full Name</label>
            <input 
              placeholder="e.g. Alexander Pierce" 
              className="input w-full h-14 text-lg font-black tracking-tight"
              value={newStudent.name}
              onChange={e => setNewStudent({...newStudent, name: e.target.value})}
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] text-fg-tertiary uppercase tracking-widest font-black">Identifier (USN/ID)</label>
            <input 
              placeholder="e.g. 4SH24CS001" 
              className="input w-full h-14 font-mono text-lg font-black tracking-tight"
              value={newStudent.usn}
              onChange={e => setNewStudent({...newStudent, usn: e.target.value})}
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Temporal Record History"
      >
        <div className="space-y-4 py-2 custom-scrollbar max-h-[500px] overflow-y-auto pr-2">
          {loadingStats ? (
            <div className="py-20 flex flex-col items-center justify-center gap-6">
              <div className="w-12 h-12 rounded-full border-2 border-accent-glow/20 border-t-accent-glow animate-spin" />
              <p className="text-[10px] text-fg-tertiary uppercase tracking-[0.25em] font-black animate-pulse">Retrieving Logs...</p>
            </div>
          ) : (
            sessions.map(s => {
              const stat = sessionStats[s.id] || { pct: 0, present: 0, total: 0 };
              return (
                <div 
                  key={s.id} 
                  onClick={() => {
                    if (hasUnsavedChanges && !confirm('Discard unsaved records?')) return;
                    setSelectedSessionId(s.id);
                    setIsHistoryModalOpen(false);
                  }}
                  className="p-5 rounded-2xl border border-border-subtle bg-surface-inset flex items-center justify-between hover:border-accent-glow transition-all cursor-pointer group shadow-sm hover:shadow-glow relative overflow-hidden"
                >
                  <div className="relative z-10">
                    <p className="text-sm font-black text-fg-primary group-hover:text-accent-glow transition-colors tracking-tight">{s.topic}</p>
                    <p className="text-[10px] text-fg-tertiary uppercase tracking-widest font-black mt-1.5 opacity-60">
                       {new Date(s.date).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right relative z-10">
                    <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black border uppercase tracking-widest mb-1.5 ${stat.pct >= 75 ? 'bg-success-bg text-success border-success-border' : 'bg-warning-bg text-warning border-warning-border'}`}>
                       {stat.pct}% Sync
                    </div>
                    <p className="text-[10px] text-fg-tertiary font-bold uppercase tracking-widest">{stat.present}/{stat.total} Entities</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
