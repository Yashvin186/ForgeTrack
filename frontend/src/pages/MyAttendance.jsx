import { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, XCircle, TrendingUp, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { attendanceService } from '../services/attendance.service';
import { sessionService } from '../services/session.service';

export default function MyAttendance() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [totalSessions, setTotalSessions] = useState(0);

  const userName = user?.name?.split(' ')[0] || 'Student';

  useEffect(() => {
    if (!user?.id) return;

    async function fetchMyData() {
      try {
        setLoading(true);
        const [records, count] = await Promise.all([
          attendanceService.getByStudent(user.id),
          sessionService.getCount()
        ]);
        setHistory(records);
        setTotalSessions(count);
      } catch (err) {
        console.error('[MyAttendance] Error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMyData();
  }, [user?.id]);

  const stats = useMemo(() => {
    const present = history.filter(r => r.present).length;
    const total = history.length;
    const pct = total > 0 ? Math.round((present / total) * 100) : 0;
    const meetsThreshold = pct >= 75;
    
    return { present, total, pct, meetsThreshold };
  }, [history]);

  const barColor = stats.pct >= 75 ? 'bg-success' : stats.pct >= 60 ? 'bg-warning' : 'bg-danger';
  const pctColor = stats.pct >= 75 ? 'text-success' : stats.pct >= 60 ? 'text-warning' : 'text-danger';

  if (loading) {
    return (
      <div className="space-y-10 pb-16 animate-fade-in">
        <header className="space-y-3">
          <div className="h-4 bg-surface-raised rounded w-32" />
          <div className="h-12 bg-surface-raised rounded-xl w-64" />
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="h-[400px] bg-surface-raised rounded-2xl animate-glass-shimmer" />
           <div className="lg:col-span-2 h-[400px] bg-surface-raised rounded-2xl animate-glass-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16 animate-slide-up">

      {/* ── Welcome Header ───────────────────────────────────── */}
      <header>
        <p className="text-[11px] text-fg-tertiary uppercase tracking-[0.18em] font-bold mb-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </p>
        <h1 className="text-display-md text-fg-primary tracking-tight">
          Hello, <span className="text-accent-glow">{userName}</span> 👋
        </h1>
        <p className="text-fg-secondary mt-1">Here's your learning progress and attendance record.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* ── Attendance Percentage Card ──────────────────────── */}
        <div className="card border border-border-subtle rounded-2xl p-8 space-y-8">

          {/* Big number */}
          <div>
            <p className="text-[10px] text-fg-tertiary uppercase tracking-[0.18em] font-bold mb-3">
              Overall Attendance
            </p>
            <div className="flex items-baseline gap-1">
              <span className={`text-[4rem] font-black tabular-nums leading-none ${pctColor}`}>
                {stats.pct}
              </span>
              <span className={`text-2xl font-bold ${pctColor}`}>%</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">
              <span>{stats.present} Present</span>
              <span>{stats.total} Total</span>
            </div>
            <div className="h-2 w-full bg-surface-inset rounded-full overflow-hidden">
              <div
                className={`h-full ${barColor} transition-all duration-1000 ease-out rounded-full`}
                style={{ width: `${stats.pct}%` }}
              />
            </div>
          </div>

          {/* Status badge */}
          <div className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-3 ${
            stats.meetsThreshold
              ? 'bg-success-bg border border-success-border text-success'
              : 'bg-danger-bg border border-danger-border text-danger'
          }`}>
            {stats.meetsThreshold
              ? <><CheckCircle2 size={16} /> Eligible for Capstone Project</>
              : <><XCircle size={16} /> Below 75% threshold</>
            }
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { label: 'Sessions',   value: stats.total, icon: Calendar },
              { label: 'Attended',   value: stats.present,       icon: CheckCircle2 },
              { label: 'Missed',     value: stats.total - stats.present, icon: XCircle },
              { label: 'Rate',       value: `${stats.pct}%`,           icon: TrendingUp },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-surface-inset rounded-xl p-3 text-center border border-border-subtle">
                <Icon size={14} className="text-fg-tertiary mx-auto mb-1" />
                <p className="text-fg-primary font-bold tabular-nums">{value}</p>
                <p className="text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Session History Table ───────────────────────────── */}
        <div className="card border border-border-subtle rounded-2xl overflow-hidden lg:col-span-2">
          <div className="px-8 py-5 border-b border-border-subtle bg-surface-raised/40 flex items-center justify-between">
            <h3 className="font-bold text-fg-primary">Session History</h3>
            <span className="text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">
              {stats.total} sessions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-inset">
                  {['Date', 'Topic', 'Status', 'Hours'].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-[10px] text-fg-tertiary uppercase tracking-[0.15em] font-bold first:pl-8 last:pr-8 last:text-right"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((rec) => (
                  <tr
                    key={rec.id}
                    className="border-b border-border-subtle hover:bg-surface-raised/40 transition-colors group"
                  >
                    <td className="pl-8 py-4 font-mono text-[12px] text-fg-tertiary whitespace-nowrap">
                      {new Date(rec.sessions?.date || 0).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-fg-primary font-medium group-hover:text-accent-glow transition-colors">
                      {rec.sessions?.topic || 'Deleted Session'}
                    </td>
                    <td className="px-6 py-4">
                      {rec.present ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-success-bg border border-success-border text-success">
                          <CheckCircle2 size={11} /> Present
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-danger-bg border border-danger-border text-danger">
                          <XCircle size={11} /> Absent
                        </span>
                      )}
                    </td>
                    <td className="pr-8 py-4 text-right font-mono text-[12px] text-fg-tertiary">
                      {rec.sessions?.duration_hours || 0}h
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-20 text-center">
                       <AlertCircle size={40} className="mx-auto mb-4 opacity-20 text-fg-tertiary" />
                       <p className="text-sm text-fg-tertiary font-bold uppercase tracking-widest">No history records found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
