import { useState } from 'react';
import { Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const STUDENTS = [
  { id: 1,  name: 'Akash Jain',     usn: '4SH24CS001', branch: 'CS', present: 15, total: 15 },
  { id: 2,  name: 'Bhavna Rao',     usn: '4SH24CS002', branch: 'CS', present: 13, total: 15 },
  { id: 3,  name: 'Chetan Kumar',   usn: '4SH24CS003', branch: 'CS', present: 11, total: 15 },
  { id: 4,  name: 'Divya Nair',     usn: '4SH24CS004', branch: 'IS', present: 14, total: 15 },
  { id: 5,  name: 'Esha Mehta',     usn: '4SH24CS005', branch: 'IS', present: 10, total: 15 },
  { id: 6,  name: 'Farhan Shaikh',  usn: '4SH24CS006', branch: 'CS', present: 15, total: 15 },
  { id: 7,  name: 'Gaurav Pillai',  usn: '4SH24CS007', branch: 'CS', present:  9, total: 15 },
  { id: 8,  name: 'Harini Sriram',  usn: '4SH24CS008', branch: 'EC', present: 14, total: 15 },
  { id: 9,  name: 'Ishan Verma',    usn: '4SH24CS009', branch: 'CS', present: 12, total: 15 },
  { id: 10, name: 'Jyoti Patel',    usn: '4SH24CS010', branch: 'IS', present: 15, total: 15 },
  { id: 11, name: 'Kiran Reddy',    usn: '4SH24CS011', branch: 'CS', present:  8, total: 15 },
  { id: 12, name: 'Lavanya Mohan',  usn: '4SH24CS012', branch: 'EC', present: 13, total: 15 },
  { id: 13, name: 'Manish Tiwari',  usn: '4SH24CS013', branch: 'CS', present: 11, total: 15 },
  { id: 14, name: 'Nidhi Singh',    usn: '4SH24CS014', branch: 'IS', present: 10, total: 15 },
  { id: 15, name: 'Om Prakash',     usn: '4SH24CS015', branch: 'CS', present: 12, total: 15 },
];

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
  const [query, setQuery] = useState('');

  const filtered = STUDENTS
    .map((s) => ({ ...s, pct: Math.round((s.present / s.total) * 100) }))
    .filter((s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.usn.toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => b.pct - a.pct);

  const avgPct = Math.round(filtered.reduce((acc, s) => acc + s.pct, 0) / (filtered.length || 1));
  const atRisk = filtered.filter((s) => s.pct < 75).length;

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <header>
        <p className="text-[11px] text-fg-tertiary uppercase tracking-[0.18em] font-bold mb-1">Analytics</p>
        <h1 className="text-display-md text-fg-primary tracking-tight">Student History</h1>
        <p className="text-fg-secondary mt-1">Track individual attendance performance across all sessions.</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: STUDENTS.length, sub: 'enrolled' },
          { label: 'Avg Attendance',  value: `${avgPct}%`,   sub: 'across cohort' },
          { label: 'At Risk',         value: atRisk,          sub: '< 75%' },
          { label: 'Total Sessions',  value: 15,              sub: 'completed' },
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
              <tr key={s.id} className="border-b border-border-subtle hover:bg-surface-raised/40 transition-colors group">
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
                    {s.branch}
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
