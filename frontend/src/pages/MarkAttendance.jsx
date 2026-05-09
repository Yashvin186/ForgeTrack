import { useState, useMemo, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, Save, Users, ChevronDown, 
  Search, Plus, Filter, Trash2, History,
  Calendar, BookOpen, UserPlus, Loader2
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
  const [statusFilter, setStatusFilter] = useState('all'); // all, present, absent
  
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
    async function init() {
      try {
        setLoading(true);
        const [sessionList, studentList] = await Promise.all([
          sessionService.getAll(),
          studentService.getAll()
        ]);
        
        setSessions(sessionList);
        setStudents(studentList);
        
        if (sessionList.length > 0) {
          setSelectedSessionId(sessionList[0].id);
        }
      } catch (err) {
        console.error(err);
        setToast({ message: 'Failed to load data', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Fetch attendance for selected session
  useEffect(() => {
    if (!selectedSessionId) return;
    
    async function fetchAttendance() {
      try {
        const records = await attendanceService.getBySession(selectedSessionId);
        // Map records to { studentId: present }
        const attendanceMap = {};
        // Initialize all students to false first
        students.forEach(s => { attendanceMap[s.id] = false; });
        // Override with real records
        records.forEach(r => {
          attendanceMap[r.student_id] = r.present;
        });
        setAttendance(attendanceMap);
        setHasUnsavedChanges(false);
      } catch (err) {
        console.error(err);
      }
    }
    fetchAttendance();
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
      const { data: { user } } = await supabase.auth.getUser();
      
      const records = Object.entries(attendance).map(([studentId, present]) => ({
        student_id: studentId,
        session_id: selectedSessionId,
        present,
        marked_by: user?.name || user?.email || 'Mentor',
        marked_at: new Date().toISOString()
      }));

      await attendanceService.upsertBatch(records);
      setHasUnsavedChanges(false);
      setToast({ message: 'Attendance saved successfully!', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to save attendance', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSession = async () => {
    if (!newSession.topic) {
      setToast({ message: 'Session topic is required', type: 'error' });
      return;
    }
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
      setToast({ message: 'New session created!', type: 'success' });
    } catch (err) {
      console.error('[Create Session Error]', err);
      setToast({ message: err.message || 'Failed to create session', type: 'error' });
    }
  };

  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.usn) {
      setToast({ message: 'Name and USN are required', type: 'error' });
      return;
    }
    try {
      // Check for duplicates
      const { data: existing } = await supabase
        .from('students')
        .select('id')
        .eq('usn', newStudent.usn.toUpperCase())
        .maybeSingle();
        
      if (existing) {
        setToast({ message: 'A student with this USN already exists', type: 'error' });
        return;
      }

      const { data, error } = await supabase
        .from('students')
        .insert([{
          name: newStudent.name,
          usn: newStudent.usn.toUpperCase(),
          branch_code: 'CS',
          is_active: true,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;

      setStudents([...students, data]);
      setAttendance(prev => ({ ...prev, [data.id]: true }));
      setIsAddStudentModalOpen(false);
      setNewStudent({ name: '', usn: '' });
      setHasUnsavedChanges(true);
      setToast({ message: `${newStudent.name} added to list`, type: 'success' });
    } catch (err) {
      console.error('[Add Student Error]', err);
      setToast({ message: err.message || 'Failed to add student', type: 'error' });
    }
  };

  const handleRemoveStudent = async (id, name) => {
    if (confirm(`Remove ${name} from this session's list?`)) {
      try {
        // We don't delete the student, we just delete their attendance record for this session
        const { error } = await supabase
          .from('attendance')
          .delete()
          .eq('student_id', id)
          .eq('session_id', selectedSessionId);
        
        if (error) throw error;

        const newAttendance = { ...attendance };
        delete newAttendance[id];
        setAttendance(newAttendance);
        setHasUnsavedChanges(false); // Since we already deleted it
        setToast({ message: 'Student removed from this session', type: 'warning' });
      } catch (err) {
        console.error(err);
        setToast({ message: 'Failed to remove student', type: 'error' });
      }
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
            const records = await attendanceService.getBySession(s.id);
            const present = records.filter(r => r.present).length;
            const total = students.length || records.length;
            statsMap[s.id] = {
              present,
              total,
              pct: total > 0 ? Math.round((present / total) * 100) : 0
            };
          }));
          
          setSessionStats(statsMap);
        } catch (err) {
          console.error('[MarkAttendance] History stats error:', err);
        } finally {
          setLoadingStats(false);
        }
      }
      fetchAllStats();
    }
  }, [isHistoryModalOpen, sessions, students.length]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-24 bg-surface-raised rounded-2xl w-2/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-32 bg-surface-raised rounded-2xl lg:col-span-2" />
          <div className="h-32 bg-surface-raised rounded-2xl" />
        </div>
        <div className="h-96 bg-surface-raised rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <header>
          <p className="text-[11px] text-fg-tertiary uppercase tracking-[0.18em] font-bold mb-1">Attendance</p>
          <h1 className="text-display-md text-fg-primary tracking-tight">Mark Attendance</h1>
          <p className="text-fg-secondary mt-1">Select a session and mark each student's presence.</p>
        </header>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsHistoryModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border-default bg-surface hover:bg-surface-raised transition-colors text-sm font-semibold text-fg-secondary"
          >
            <History size={16} />
            View History
          </button>
          <button 
            onClick={() => setIsNewSessionModalOpen(true)}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl shadow-raised text-sm font-bold"
          >
            <Plus size={16} />
            Create Session
          </button>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="card p-12 flex flex-col items-center text-center border border-border-default border-dashed rounded-[2rem] bg-surface-raised/20">
          <Calendar size={48} className="text-fg-tertiary mb-4 opacity-30" />
          <h2 className="text-xl font-bold text-fg-primary">No Sessions Yet</h2>
          <p className="text-fg-secondary mt-2 mb-6 max-w-sm">Create your first session to start marking attendance and managing your classroom.</p>
          <button 
            onClick={() => setIsNewSessionModalOpen(true)}
            className="btn-primary flex items-center gap-2 px-8 py-3 rounded-xl shadow-raised text-sm font-bold"
          >
            <Plus size={18} />
            Create First Session
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Session Selection & Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session Picker */}
        <div className="card lg:col-span-2 p-8 border border-border-subtle rounded-2xl flex flex-col justify-center">
           <div className="flex items-center justify-between mb-4">
              <label className="text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">Active Session</label>
              {hasUnsavedChanges && (
                <span className="text-[10px] text-warning bg-warning-bg px-2 py-0.5 rounded-full font-bold animate-pulse">
                  Unsaved Changes
                </span>
              )}
           </div>
           <div className="relative">
              <select
                value={selectedSessionId}
                onChange={(e) => {
                  if (hasUnsavedChanges && !confirm('You have unsaved changes. Change session anyway?')) return;
                  setSelectedSessionId(Number(e.target.value));
                  setHasUnsavedChanges(false);
                }}
                className="input w-full appearance-none pr-10 cursor-pointer h-14 text-lg font-bold"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.topic} — {new Date(s.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </option>
                ))}
              </select>
              <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-fg-tertiary pointer-events-none" />
           </div>
        </div>

        {/* Stats Card */}
        <div className="card p-8 border border-border-subtle rounded-2xl bg-surface-raised/30">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">Daily Stats</span>
            <span className={`text-xs font-bold ${stats.percentage > 75 ? 'text-success' : 'text-warning'}`}>
              {stats.percentage}%
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-display-sm font-black text-fg-primary">{stats.present}</span>
            <span className="text-fg-tertiary font-bold text-sm">/ {stats.total} Present</span>
          </div>
          <div className="h-2 w-full bg-surface-inset rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${stats.percentage > 80 ? 'bg-success' : stats.percentage > 50 ? 'bg-warning' : 'bg-danger'}`}
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main List Card */}
      <div className="card border border-border-subtle rounded-2xl overflow-hidden bg-canvas">
        {/* Actions Bar */}
        <div className="p-6 border-b border-border-subtle bg-surface-raised/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-tertiary" size={16} />
              <input 
                type="text" 
                placeholder="Search USN or Name..." 
                className="input pl-10 w-full h-10 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1 p-1 bg-surface-inset rounded-lg border border-border-subtle">
              {['all', 'present', 'absent'].map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-[10px] uppercase tracking-wider font-bold transition-all ${
                    statusFilter === f ? 'bg-surface-raised text-accent-glow shadow-sm' : 'text-fg-tertiary hover:text-fg-secondary'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border-r border-border-subtle pr-4">
              <button 
                onClick={() => markAll(true)}
                className="text-[11px] font-bold text-success uppercase tracking-widest hover:opacity-70 transition-opacity"
              >
                All Present
              </button>
              <span className="text-fg-tertiary">/</span>
              <button 
                onClick={() => markAll(false)}
                className="text-[11px] font-bold text-danger uppercase tracking-widest hover:opacity-70 transition-opacity"
              >
                All Absent
              </button>
            </div>
            <button 
              onClick={() => setIsAddStudentModalOpen(true)}
              className="flex items-center gap-2 text-accent-glow font-bold text-[11px] uppercase tracking-widest hover:opacity-70 transition-opacity"
            >
              <UserPlus size={14} />
              Add Student
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-inset">
                <th className="pl-8 py-3 text-left text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">#</th>
                <th className="px-6 py-3 text-left text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">USN</th>
                <th className="px-6 py-3 text-left text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">Student Name</th>
                <th className="px-6 py-3 text-left text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">Status</th>
                <th className="pr-8 py-3 text-right text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, idx) => {
                  const isPresent = attendance[student.id];
                  return (
                    <tr key={student.id} className="hover:bg-surface-raised/40 transition-colors group">
                      <td className="pl-8 py-4 text-xs font-mono text-fg-tertiary">{String(idx + 1).padStart(2, '0')}</td>
                      <td className="px-6 py-4 text-xs font-mono text-fg-secondary">{student.usn}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-fg-primary group-hover:text-accent-glow transition-colors">{student.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => toggleAttendance(student.id)}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                            isPresent 
                              ? 'bg-success-bg border-success-border text-success' 
                              : 'bg-danger-bg border-danger-border text-danger'
                          }`}
                        >
                          {isPresent ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {isPresent ? 'Present' : 'Absent'}
                        </button>
                      </td>
                      <td className="pr-8 py-4 text-right">
                        <button 
                          onClick={() => handleRemoveStudent(student.id, student.name)}
                          className="p-2 text-fg-tertiary hover:text-danger hover:bg-danger-bg rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Users size={40} className="mx-auto text-fg-tertiary mb-4 opacity-20" />
                    <p className="text-fg-secondary font-medium">No students found matching your search</p>
                    <button 
                      onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                      className="text-accent-glow text-xs font-bold mt-2 hover:underline"
                    >
                      Clear all filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Save Bar */}
        <div className="p-6 border-t border-border-subtle bg-surface-raised/30 flex items-center justify-between">
           <div className="flex items-center gap-6">
              <div className="text-xs">
                <span className="text-fg-tertiary uppercase tracking-widest font-bold">Total List:</span>
                <span className="ml-2 text-fg-primary font-bold">{students.length}</span>
              </div>
              <div className="text-xs">
                <span className="text-fg-tertiary uppercase tracking-widest font-bold">Marked Present:</span>
                <span className="ml-2 text-success font-bold">{stats.present}</span>
              </div>
           </div>

           <button 
            onClick={handleSave}
            disabled={!hasUnsavedChanges || saving}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-lg ${
              hasUnsavedChanges 
                ? 'btn-primary shadow-accent-glow/20' 
                : 'bg-surface-inset text-fg-tertiary cursor-not-allowed border border-border-subtle'
            } ${saving ? 'opacity-70 pointer-events-none' : ''}`}
           >
             {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
             {saving ? 'Saving...' : 'Save Attendance'}
           </button>
          </div>
      </div>
        </div>
      )}

      {/* Modals */}
      <Modal 
        isOpen={isNewSessionModalOpen} 
        onClose={() => setIsNewSessionModalOpen(false)}
        title="Create New Session"
        footer={(
          <>
            <button onClick={() => setIsNewSessionModalOpen(false)} className="px-6 py-2 text-sm font-bold text-fg-tertiary">Cancel</button>
            <button onClick={handleCreateSession} className="btn-primary px-8 py-2 rounded-xl text-sm font-bold">Create Session</button>
          </>
        )}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">Session Topic</label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-tertiary" size={18} />
              <input 
                type="text" 
                placeholder="e.g. Intro to Neural Networks" 
                className="input pl-10 w-full h-12"
                value={newSession.topic}
                onChange={e => setNewSession({...newSession, topic: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-tertiary" size={18} />
              <input 
                type="date" 
                className="input pl-10 w-full h-12"
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
        title="Add New Student"
        footer={(
          <>
            <button onClick={() => setIsAddStudentModalOpen(false)} className="px-6 py-2 text-sm font-bold text-fg-tertiary">Cancel</button>
            <button onClick={handleAddStudent} className="btn-primary px-8 py-2 rounded-xl text-sm font-bold">Add to List</button>
          </>
        )}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">Full Name</label>
            <input 
              type="text" 
              placeholder="e.g. John Doe" 
              className="input w-full h-12"
              value={newStudent.name}
              onChange={e => setNewStudent({...newStudent, name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">USN / ID</label>
            <input 
              type="text" 
              placeholder="e.g. 4SH24CS000" 
              className="input w-full h-12"
              value={newStudent.usn}
              onChange={e => setNewStudent({...newStudent, usn: e.target.value})}
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Session Attendance History"
      >
        <div className="space-y-4">
          {loadingStats ? (
            <div className="py-10 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-accent-glow" size={24} />
              <p className="text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">Loading Stats...</p>
            </div>
          ) : (
            sessions.map(s => {
              const stat = sessionStats[s.id] || { pct: 0, present: 0, total: 0 };
              return (
                <div 
                  key={s.id} 
                  onClick={() => {
                    if (hasUnsavedChanges && !confirm('Discard unsaved changes?')) return;
                    setSelectedSessionId(s.id);
                    setIsHistoryModalOpen(false);
                  }}
                  className="p-4 rounded-xl border border-border-subtle bg-surface-inset flex items-center justify-between hover:border-accent-glow transition-colors cursor-pointer group"
                >
                  <div>
                    <p className="text-sm font-bold text-fg-primary group-hover:text-accent-glow transition-colors">{s.topic}</p>
                    <p className="text-[10px] text-fg-tertiary uppercase tracking-widest font-bold mt-1">
                      {new Date(s.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold ${stat.pct >= 75 ? 'text-success' : 'text-warning'}`}>{stat.pct}% Present</p>
                    <p className="text-[10px] text-fg-tertiary mt-1">{stat.present}/{stat.total} Marked</p>
                  </div>
                </div>
              );
            })
          )}
          {sessions.length === 0 && !loadingStats && (
            <div className="py-10 text-center text-fg-tertiary text-sm">No sessions found.</div>
          )}
        </div>
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}
