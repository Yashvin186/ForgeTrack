import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, TrendingUp, Calendar } from 'lucide-react';

const MOCK = {
  totalSessions: 15,
  present: 13,
  history: [
    { id: 1,  date: '2026-04-30', topic: 'Productionizing ML Models',     status: 'present', hrs: 2   },
    { id: 2,  date: '2026-04-28', topic: 'Large Language Models 101',      status: 'present', hrs: 2   },
    { id: 3,  date: '2026-04-26', topic: 'ReAct Agent Pattern',            status: 'absent',  hrs: 1.5 },
    { id: 4,  date: '2026-04-24', topic: 'AI Safety and Ethics',           status: 'present', hrs: 2   },
    { id: 5,  date: '2026-04-22', topic: 'RAG Fundamentals',               status: 'present', hrs: 2   },
    { id: 6,  date: '2026-04-20', topic: 'Vector Databases',               status: 'present', hrs: 1.5 },
    { id: 7,  date: '2026-04-18', topic: 'Fine-Tuning LLMs',               status: 'present', hrs: 2   },
    { id: 8,  date: '2026-04-16', topic: 'Model Evaluation Metrics',       status: 'present', hrs: 2   },
    { id: 9,  date: '2026-04-14', topic: 'Prompt Engineering Masterclass', status: 'present', hrs: 2   },
    { id: 10, date: '2026-04-12', topic: 'Intro to Neural Networks',       status: 'present', hrs: 2   },
    { id: 11, date: '2026-04-10', topic: 'Python for ML',                  status: 'present', hrs: 2   },
    { id: 12, date: '2026-04-08', topic: 'Data Preprocessing',             status: 'present', hrs: 2   },
    { id: 13, date: '2026-04-06', topic: 'Git & Dev Environment Setup',    status: 'present', hrs: 1   },
    { id: 14, date: '2026-04-04', topic: 'Bootcamp Kickoff',               status: 'absent',  hrs: 1   },
    { id: 15, date: '2026-04-02', topic: 'Orientation Day',                status: 'present', hrs: 1   },
  ],
};

export default function MyAttendance() {
  const [userName, setUserName] = useState('Student');

  useEffect(() => {
    const mockUser = JSON.parse(localStorage.getItem('forge_mock_user') || 'null');
    if (mockUser?.display_name) setUserName(mockUser.display_name.split(' ')[0]);
  }, []);

  const pct = Math.round((MOCK.present / MOCK.totalSessions) * 100);
  const meetsThreshold = pct >= 75;

  const barColor = pct >= 75 ? 'bg-success' : pct >= 60 ? 'bg-warning' : 'bg-danger';
  const pctColor = pct >= 75 ? 'text-success' : pct >= 60 ? 'text-warning' : 'text-danger';

  return (
    <div className="space-y-10 pb-16">

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
                {pct}
              </span>
              <span className={`text-2xl font-bold ${pctColor}`}>%</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">
              <span>{MOCK.present} Present</span>
              <span>{MOCK.totalSessions} Total</span>
            </div>
            <div className="h-2 w-full bg-surface-inset rounded-full overflow-hidden">
              <div
                className={`h-full ${barColor} transition-all duration-1000 ease-out rounded-full`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Status badge */}
          <div className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-3 ${
            meetsThreshold
              ? 'bg-success-bg border border-success-border text-success'
              : 'bg-danger-bg border border-danger-border text-danger'
          }`}>
            {meetsThreshold
              ? <><CheckCircle2 size={16} /> Eligible for Capstone Project</>
              : <><XCircle size={16} /> Below 75% threshold</>
            }
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { label: 'Sessions',   value: MOCK.totalSessions, icon: Calendar },
              { label: 'Attended',   value: MOCK.present,       icon: CheckCircle2 },
              { label: 'Missed',     value: MOCK.totalSessions - MOCK.present, icon: XCircle },
              { label: 'Rate',       value: `${pct}%`,           icon: TrendingUp },
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
              {MOCK.totalSessions} sessions
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
                {MOCK.history.map(({ id, date, topic, status, hrs }) => (
                  <tr
                    key={id}
                    className="border-b border-border-subtle hover:bg-surface-raised/40 transition-colors group"
                  >
                    <td className="pl-8 py-4 font-mono text-[12px] text-fg-tertiary whitespace-nowrap">
                      {new Date(date).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-fg-primary font-medium group-hover:text-accent-glow transition-colors">
                      {topic}
                    </td>
                    <td className="px-6 py-4">
                      {status === 'present' ? (
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
                      {hrs}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
