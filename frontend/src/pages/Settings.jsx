import { useState } from 'react';
import { User, Bell, Shield, Save, CheckCircle2, ChevronRight, Zap, Mail, Phone, Info } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { authService } from '../services/auth.service';
import Toast from '../components/Toast';

const TABS = [
  { id: 'profile',   label: 'Identity Profile', icon: User   },
  { id: 'notifs',    label: 'Telemetry Alerts', icon: Bell   },
  { id: 'security',  label: 'Access Protocol',  icon: Shield },
];

function ProfileTab({ setToast }) {
  const { user, updateUser } = useUser();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name:    user.name || '',
    email:   user.email || '',
    role:    user.role || 'Mentor',
    phone:   user.phone || '+91 00000 00000',
    bio:     user.bio || 'Enterprise Attendance Analyst',
  });

  const update = (k) => (e) => { 
    setForm((p) => ({ ...p, [k]: e.target.value })); 
    setSaved(false); 
  };

  const handleSave = async () => {
    try {
      if (!user.id) throw new Error('System link failure');
      await authService.updateProfile(user.id, {
        name: form.name,
        role: form.role
      });
      updateUser(form);
      setSaved(true);
      setToast({ message: 'Identity parameters synchronized', type: 'success' });
    } catch {
      setToast({ message: 'Failed to update protocol', type: 'error' });
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row items-center gap-8 p-8 bg-surface-raised/20 border border-border-subtle rounded-[2rem] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-glow/5 rounded-full blur-3xl pointer-events-none" />
        <div className="w-24 h-24 rounded-[2rem] bg-surface-raised border border-border-strong flex items-center justify-center text-accent-glow text-4xl font-black shadow-raised group-hover:scale-105 transition-transform duration-500">
          {form.name.charAt(0) || 'U'}
        </div>
        <div className="text-center md:text-left space-y-2">
          <h3 className="text-2xl font-black text-fg-primary tracking-tighter">{form.name}</h3>
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-fg-tertiary">
               <Mail size={14} className="text-accent-glow" /> {form.email}
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-fg-tertiary">
               <Zap size={14} className="text-accent-glow" /> System {form.role}
            </div>
          </div>
          <button className="text-[10px] text-accent-glow font-black uppercase tracking-[0.25em] mt-2 px-4 py-1.5 bg-accent-glow/5 border border-accent-glow/20 rounded-full hover:bg-accent-glow/10 transition-colors">
            Update Avatar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          { key: 'name',  label: 'Display Name',    type: 'text',  icon: User },
          { key: 'email', label: 'Primary Contact',  type: 'email', icon: Mail },
          { key: 'role',  label: 'System Designation', type: 'text',  icon: Zap },
          { key: 'phone', label: 'Verified Phone',   type: 'tel',   icon: Phone },
        ].map(({ key, label, type, icon: Icon }) => (
          <div key={key} className="space-y-3">
            <label className="text-[10px] text-fg-tertiary uppercase tracking-[0.2em] font-black px-1">{label}</label>
            <div className="relative group">
               <Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-tertiary group-hover:text-accent-glow transition-colors" />
               <input 
                 type={type} 
                 value={form[key]} 
                 onChange={update(key)} 
                 className="input w-full pl-12 h-14 text-sm font-bold bg-surface-inset border-border-strong focus:border-accent-glow" 
                 disabled={key === 'email'}
               />
            </div>
          </div>
        ))}

        <div className="space-y-3 md:col-span-2">
          <label className="text-[10px] text-fg-tertiary uppercase tracking-[0.2em] font-black px-1">Identity Bio</label>
          <textarea
            rows={4}
            value={form.bio}
            onChange={update('bio')}
            className="input w-full h-auto py-4 px-5 text-sm font-medium bg-surface-inset border-border-strong focus:border-accent-glow resize-none leading-relaxed"
            placeholder="Describe your role within the ForgeTrack ecosystem..."
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          className={`flex items-center gap-3 px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-glow ${
            saved ? 'bg-success-bg border border-success-border text-success' : 'btn-primary shadow-accent-glow/20 active:scale-95'
          }`}
        >
          {saved ? <><CheckCircle2 size={18} strokeWidth={3} /> Protocol Synced</> : <><Save size={18} strokeWidth={3} /> Synchronize Profile</>}
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
    { key: 'attendance',   label: 'Real-time Sync Alerts',   desc: 'Notify when attendance packets are processed for active sessions.' },
    { key: 'lowAlert',     label: 'Critical Threshold Alert', desc: 'Trigger warning when engagement drops below system mean (75%).' },
    { key: 'newMaterial',  label: 'Resource Hub Updates',     desc: 'Notify when new technical documentation or files are uploaded.' },
    { key: 'weeklyReport', label: 'Strategic Weekly Digest',  desc: 'Receive a consolidated performance report every Monday.' },
    { key: 'digest',       label: 'Operational Pulse',        desc: 'Daily brief of session activity and platform health.' },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="p-6 bg-accent-glow/[0.03] border border-accent-glow/20 rounded-[2rem] mb-6 flex items-center gap-4">
         <Info size={20} className="text-accent-glow shrink-0" />
         <p className="text-[11px] text-fg-secondary font-medium leading-relaxed italic uppercase tracking-wider">
            Alert parameters are synchronized across mobile and desktop endpoints for unified monitoring.
         </p>
      </div>
      {items.map(({ key, label, desc }) => (
        <div
          key={key}
          className="flex items-center justify-between p-6 rounded-2xl border border-border-subtle bg-surface-inset hover:bg-surface-raised transition-all cursor-pointer group shadow-sm hover:shadow-md"
          onClick={() => toggle(key)}
        >
          <div className="space-y-1">
            <p className="text-sm font-black text-fg-primary group-hover:text-accent-glow transition-colors tracking-tight uppercase">{label}</p>
            <p className="text-[11px] text-fg-tertiary font-medium">{desc}</p>
          </div>
          <div className={`w-14 h-7 rounded-full transition-all duration-500 relative shrink-0 ml-8 p-1 ${prefs[key] ? 'bg-accent-glow shadow-glow' : 'bg-surface-raised border border-border-default'}`}>
            <div className={`w-5 h-5 bg-white rounded-lg shadow-raised transition-all duration-500 ease-out ${prefs[key] ? 'translate-x-7 rotate-90' : 'translate-x-0'}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SecurityTab({ setToast }) {
  const [saved, setSaved] = useState(false);
  const handleUpdate = () => {
    setSaved(true);
    setToast({ message: 'Security protocol updated', type: 'success' });
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="space-y-8">
        {[
          { label: 'Primary Auth Token',  type: 'password', placeholder: '••••••••', icon: Shield },
          { label: 'New Access Key',      type: 'password', placeholder: '••••••••', icon: Zap },
          { label: 'Confirm Key',         type: 'password', placeholder: '••••••••', icon: CheckCircle2 },
        ].map(({ label, type, placeholder, icon: Icon }) => (
          <div key={label} className="space-y-3">
            <label className="text-[10px] text-fg-tertiary uppercase tracking-[0.2em] font-black px-1">{label}</label>
            <div className="relative">
               <Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-tertiary" />
               <input type={type} placeholder={placeholder} className="input w-full max-w-md pl-12 h-14 text-sm font-bold bg-surface-inset border-border-strong" onChange={() => setSaved(false)} />
            </div>
          </div>
        ))}
      </div>

      <div className="p-8 rounded-[2.5rem] bg-warning-bg/10 border border-warning-border relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
           <Shield size={64} className="text-warning" />
        </div>
        <p className="text-sm font-black text-warning uppercase tracking-widest flex items-center gap-2">
           <Info size={16} /> Encryption Standard
        </p>
        <ul className="text-[11px] text-fg-secondary mt-4 space-y-2 font-bold uppercase tracking-wider opacity-80">
          <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-warning" /> Minimum 12 Entropy Characters</li>
          <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-warning" /> Alphanumeric Vector Required</li>
          <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-warning" /> Special Character Payload</li>
        </ul>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleUpdate}
          className={`flex items-center gap-3 px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-glow ${
            saved ? 'bg-success-bg border border-success-border text-success' : 'btn-primary shadow-accent-glow/20 active:scale-95'
          }`}
        >
          {saved ? <><CheckCircle2 size={18} strokeWidth={3} /> Protocol Secured</> : <><Shield size={18} strokeWidth={3} /> Update Access Protocol</>}
        </button>
      </div>
    </div>
  );
}

export default function Settings() {
  const [tab, setTab] = useState('profile');
  const [toast, setToast] = useState(null);

  return (
    <div className="space-y-10 pb-20 animate-slide-up">
      <header className="space-y-2">
        <p className="text-[10px] text-fg-tertiary uppercase tracking-[0.25em] font-black mb-1">Configuration</p>
        <h1 className="text-display-md text-fg-primary tracking-tighter">System Settings</h1>
        <p className="text-lg text-fg-secondary tracking-tight font-medium">Calibrate your identity profile and operational parameters.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">
        <div className="card border border-border-subtle rounded-[2.5rem] overflow-hidden bg-surface-raised/20 shadow-raised">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center gap-4 px-8 py-5 text-xs font-black uppercase tracking-widest border-b border-border-subtle last:border-0 transition-all text-left relative group ${
                tab === id
                  ? 'bg-accent-glow/10 text-accent-glow'
                  : 'text-fg-tertiary hover:bg-surface-raised hover:text-fg-primary'
              }`}
            >
              {tab === id && <div className="absolute left-0 top-0 w-1 h-full bg-accent-glow shadow-glow" />}
              <Icon size={18} className={`shrink-0 transition-colors ${tab === id ? 'text-accent-glow' : 'group-hover:text-accent-glow'}`} />
              {label}
              <ChevronRight size={14} className={`ml-auto transition-transform ${tab === id ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
            </button>
          ))}
        </div>

        <div className="card border border-border-subtle rounded-[3rem] p-12 lg:col-span-3 bg-canvas/40 shadow-raised relative overflow-hidden min-h-[600px]">
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-accent-glow/[0.01] to-transparent pointer-events-none" />
          <div className="relative z-10">
             {tab === 'profile'  && <ProfileTab setToast={setToast} />}
             {tab === 'notifs'   && <NotifsTab />}
             {tab === 'security' && <SecurityTab setToast={setToast} />}
          </div>
        </div>
      </div>

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
