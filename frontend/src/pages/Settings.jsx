import { useState } from 'react';
import { User, Bell, Shield, Save, CheckCircle2 } from 'lucide-react';

const TABS = [
  { id: 'profile',   label: 'Profile',        icon: User   },
  { id: 'notifs',    label: 'Notifications',  icon: Bell   },
  { id: 'security',  label: 'Security',       icon: Shield },
];

function ProfileTab() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name:    'Nischay Pandey',
    email:   'nischay@theforge.ai',
    role:    'Lead Mentor',
    phone:   '+91 98765 43210',
    bio:     'Building the next generation of AI-ML engineers at The Forge Bootcamp.',
  });

  const update = (k) => (e) => { setForm((p) => ({ ...p, [k]: e.target.value })); setSaved(false); };

  return (
    <div className="space-y-8">
      {/* Avatar */}
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-accent-glow/20 border border-accent-glow/30 flex items-center justify-center text-accent-glow text-3xl font-black">
          N
        </div>
        <div>
          <p className="text-sm font-bold text-fg-primary">{form.name}</p>
          <p className="text-[11px] text-fg-tertiary mt-0.5">{form.email}</p>
          <button className="text-[11px] text-accent-glow font-bold mt-2 hover:opacity-80 transition-opacity uppercase tracking-widest">
            Change Photo
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { key: 'name',  label: 'Full Name',    type: 'text'  },
          { key: 'email', label: 'Email',         type: 'email' },
          { key: 'role',  label: 'Role / Title',  type: 'text'  },
          { key: 'phone', label: 'Phone',         type: 'tel'   },
        ].map(({ key, label, type }) => (
          <div key={key} className="space-y-2">
            <label className="text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">{label}</label>
            <input type={type} value={form[key]} onChange={update(key)} className="input w-full" />
          </div>
        ))}

        <div className="space-y-2 md:col-span-2">
          <label className="text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">Bio</label>
          <textarea
            rows={3}
            value={form.bio}
            onChange={update('bio')}
            className="input w-full h-auto py-3 resize-none"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={() => setSaved(true)}
          className={`flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold transition-all ${
            saved ? 'bg-success-bg border border-success-border text-success' : 'btn-primary shadow-raised'
          }`}
        >
          {saved ? <><CheckCircle2 size={15} /> Saved!</> : <><Save size={15} /> Save Changes</>}
        </button>
      </div>
    </div>
  );
}

function NotifsTab() {
  const [prefs, setPrefs] = useState({
    attendance:   true,
    lowAlert:     true,
    newMaterial:  false,
    weeklyReport: true,
    digest:       false,
  });
  const toggle = (k) => setPrefs((p) => ({ ...p, [k]: !p[k] }));

  const items = [
    { key: 'attendance',   label: 'Attendance Marked',   desc: 'Notify when attendance is saved for a session.' },
    { key: 'lowAlert',     label: 'Low Attendance Alert', desc: 'Alert when a student drops below 75%.' },
    { key: 'newMaterial',  label: 'New Material Uploaded',desc: 'Notify when a new resource is added.' },
    { key: 'weeklyReport', label: 'Weekly Summary',       desc: 'Receive a weekly cohort performance email.' },
    { key: 'digest',       label: 'Daily Digest',         desc: 'Daily email with session and attendance summary.' },
  ];

  return (
    <div className="space-y-4">
      {items.map(({ key, label, desc }) => (
        <div
          key={key}
          className="flex items-center justify-between p-5 rounded-xl border border-border-subtle bg-surface-inset hover:bg-surface-raised transition-colors cursor-pointer group"
          onClick={() => toggle(key)}
        >
          <div>
            <p className="text-sm font-semibold text-fg-primary group-hover:text-accent-glow transition-colors">{label}</p>
            <p className="text-[11px] text-fg-tertiary mt-0.5">{desc}</p>
          </div>
          <div className={`w-11 h-6 rounded-full transition-colors duration-300 relative shrink-0 ml-6 ${prefs[key] ? 'bg-accent-glow' : 'bg-surface-raised border border-border-default'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${prefs[key] ? 'left-6' : 'left-1'}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SecurityTab() {
  const [saved, setSaved] = useState(false);
  return (
    <div className="space-y-8">
      <div className="space-y-6">
        {[
          { label: 'Current Password',  type: 'password', placeholder: '••••••••' },
          { label: 'New Password',      type: 'password', placeholder: '••••••••' },
          { label: 'Confirm Password',  type: 'password', placeholder: '••••••••' },
        ].map(({ label, type, placeholder }) => (
          <div key={label} className="space-y-2">
            <label className="text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">{label}</label>
            <input type={type} placeholder={placeholder} className="input w-full max-w-md" onChange={() => setSaved(false)} />
          </div>
        ))}
      </div>

      <div className="p-5 rounded-xl bg-warning-bg border border-warning-border">
        <p className="text-sm font-bold text-warning">Password Requirements</p>
        <ul className="text-[11px] text-fg-secondary mt-2 space-y-1 list-disc list-inside">
          <li>At least 8 characters long</li>
          <li>Contains uppercase and lowercase letters</li>
          <li>Contains at least one number or symbol</li>
        </ul>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setSaved(true)}
          className={`flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold transition-all ${
            saved ? 'bg-success-bg border border-success-border text-success' : 'btn-primary shadow-raised'
          }`}
        >
          {saved ? <><CheckCircle2 size={15} /> Updated!</> : <><Shield size={15} /> Update Password</>}
        </button>
      </div>
    </div>
  );
}

export default function Settings() {
  const [tab, setTab] = useState('profile');

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <header>
        <p className="text-[11px] text-fg-tertiary uppercase tracking-[0.18em] font-bold mb-1">Account</p>
        <h1 className="text-display-md text-fg-primary tracking-tight">Settings</h1>
        <p className="text-fg-secondary mt-1">Manage your profile, notifications, and security preferences.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Tab Sidebar */}
        <div className="card border border-border-subtle rounded-2xl overflow-hidden">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-5 py-4 text-sm font-semibold border-b border-border-subtle last:border-0 transition-colors text-left ${
                tab === id
                  ? 'bg-accent-glow/10 text-accent-glow'
                  : 'text-fg-secondary hover:bg-surface-raised hover:text-fg-primary'
              }`}
            >
              <Icon size={16} className="shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="card border border-border-subtle rounded-2xl p-8 lg:col-span-3">
          {tab === 'profile'  && <ProfileTab />}
          {tab === 'notifs'   && <NotifsTab />}
          {tab === 'security' && <SecurityTab />}
        </div>
      </div>
    </div>
  );
}
