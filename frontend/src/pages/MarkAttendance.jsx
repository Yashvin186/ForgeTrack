import { useState } from 'react';
import { CheckCircle2, XCircle, Save, Users, ChevronDown } from 'lucide-react';

const SESSIONS = [
  { id: 1, topic: 'Productionizing ML Models', date: '2026-04-30' },
  { id: 2, topic: 'Large Language Models 101',  date: '2026-04-28' },
  { id: 3, topic: 'ReAct Agent Pattern',         date: '2026-04-26' },
];

const STUDENTS = [
  { id: 1,  usn: '4SH24CS001', name: 'Akash Jain'      },
  { id: 2,  usn: '4SH24CS002', name: 'Bhavna Rao'      },
  { id: 3,  usn: '4SH24CS003', name: 'Chetan Kumar'    },
  { id: 4,  usn: '4SH24CS004', name: 'Divya Nair'      },
  { id: 5,  usn: '4SH24CS005', name: 'Esha Mehta'      },
  { id: 6,  usn: '4SH24CS006', name: 'Farhan Shaikh'   },
  { id: 7,  usn: '4SH24CS007', name: 'Gaurav Pillai'   },
  { id: 8,  usn: '4SH24CS008', name: 'Harini Sriram'   },
  { id: 9,  usn: '4SH24CS009', name: 'Ishan Verma'     },
  { id: 10, usn: '4SH24CS010', name: 'Jyoti Patel'     },
  { id: 11, usn: '4SH24CS011', name: 'Kiran Reddy'     },
  { id: 12, usn: '4SH24CS012', name: 'Lavanya Mohan'   },
  { id: 13, usn: '4SH24CS013', name: 'Manish Tiwari'   },
  { id: 14, usn: '4SH24CS014', name: 'Nidhi Singh'     },
  { id: 15, usn: '4SH24CS015', name: 'Om Prakash'      },
];

export default function MarkAttendance() {
  const [selectedSession, setSelectedSession] = useState(SESSIONS[0].id);
  const [attendance, setAttendance] = useState(
    Object.fromEntries(STUDENTS.map((s) => [s.id, true]))
  );
  const [saved, setSaved] = useState(false);

  const toggle = (id) => {
    setAttendance((prev) => ({ ...prev, [id]: !prev[id] }));
    setSaved(false);
  };

  const markAll = (val) => {
    setAttendance(Object.fromEntries(STUDENTS.map((s) => [s.id, val])));
    setSaved(false);
  };

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const session = SESSIONS.find((s) => s.id === selectedSession);

  const handleSave = () => setSaved(true);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <header>
        <p className="text-[11px] text-fg-tertiary uppercase tracking-[0.18em] font-bold mb-1">Attendance</p>
        <h1 className="text-display-md text-fg-primary tracking-tight">Mark Attendance</h1>
        <p className="text-fg-secondary mt-1">Select a session and mark each student's presence.</p>
      </header>

      {/* Session Selector + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session picker */}
        <div className="card border border-border-subtle rounded-2xl p-6 space-y-3 lg:col-span-2">
          <label className="text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">Select Session</label>
          <div className="relative">
            <select
              value={selectedSession}
              onChange={(e) => { setSelectedSession(Number(e.target.value)); setSaved(false); }}
              className="input w-full appearance-none pr-10 cursor-pointer"
            >
              {SESSIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.topic} — {new Date(s.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-tertiary pointer-events-none" />
          </div>
        </div>

        {/* Live counter */}
        <div className="card border border-border-subtle rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-fg-tertiary">
            <Users size={16} />
            <span className="text-[10px] uppercase tracking-widest font-bold">Present Today</span>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-display-sm font-black text-success tabular-nums">{presentCount}</span>
            <span className="text-fg-tertiary font-bold">/ {STUDENTS.length}</span>
          </div>
          <div className="h-1.5 w-full bg-surface-inset rounded-full mt-3">
            <div
              className="h-full bg-success rounded-full transition-all duration-300"
              style={{ width: `${(presentCount / STUDENTS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Student Checklist */}
      <div className="card border border-border-subtle rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="px-8 py-4 border-b border-border-subtle bg-surface-raised/40 flex items-center justify-between gap-4">
          <h3 className="font-bold text-fg-primary text-sm">{session?.topic}</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => markAll(true)}
              className="text-[11px] text-success font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
            >
              All Present
            </button>
            <span className="text-fg-tertiary">·</span>
            <button
              onClick={() => markAll(false)}
              className="text-[11px] text-danger font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
            >
              All Absent
            </button>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-surface-inset">
              {['#', 'USN', 'Student Name', 'Status', 'Toggle'].map((h, i) => (
                <th
                  key={h}
                  className={`px-6 py-3 text-[10px] text-fg-tertiary uppercase tracking-[0.15em] font-bold ${i === 0 ? 'pl-8 w-12' : ''} ${i === 4 ? 'pr-8 text-right' : 'text-left'}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STUDENTS.map((student, idx) => {
              const present = attendance[student.id];
              return (
                <tr
                  key={student.id}
                  onClick={() => toggle(student.id)}
                  className="border-b border-border-subtle hover:bg-surface-raised/40 transition-colors cursor-pointer group"
                >
                  <td className="pl-8 py-3.5 text-fg-tertiary font-mono text-xs">{String(idx + 1).padStart(2, '0')}</td>
                  <td className="px-6 py-3.5 font-mono text-xs text-fg-tertiary">{student.usn}</td>
                  <td className="px-6 py-3.5 text-sm text-fg-primary font-medium group-hover:text-accent-glow transition-colors">
                    {student.name}
                  </td>
                  <td className="px-6 py-3.5">
                    {present ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-success-bg border border-success-border text-success">
                        <CheckCircle2 size={11} /> Present
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-danger-bg border border-danger-border text-danger">
                        <XCircle size={11} /> Absent
                      </span>
                    )}
                  </td>
                  <td className="pr-8 py-3.5 text-right">
                    <div
                      className={`ml-auto w-11 h-6 rounded-full transition-colors duration-300 relative ${present ? 'bg-success' : 'bg-surface-raised border border-border-default'}`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${present ? 'left-6' : 'left-1'}`}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Save bar */}
        <div className="px-8 py-5 border-t border-border-subtle bg-surface-raised/30 flex items-center justify-between">
          <p className="text-sm text-fg-secondary">
            {presentCount} of {STUDENTS.length} students marked present
          </p>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              saved
                ? 'bg-success-bg border border-success-border text-success'
                : 'btn-primary shadow-raised'
            }`}
          >
            <Save size={15} />
            {saved ? 'Saved!' : 'Save Attendance'}
          </button>
        </div>
      </div>
    </div>
  );
}
