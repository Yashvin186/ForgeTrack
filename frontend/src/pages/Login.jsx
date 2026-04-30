import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, GraduationCap, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [isStudent, setIsStudent] = useState(true);
  const [identifier, setIdentifier] = useState(''); // USN or Email
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // TEMPORARY MOCK LOGIN LOGIC
    setTimeout(() => {
      const role = isStudent ? 'student' : 'mentor';
      localStorage.setItem('forge_mock_role', role);
      localStorage.setItem('forge_mock_user', JSON.stringify({
        email: identifier || (isStudent ? 'student@forge.local' : 'mentor@theforge.ai'),
        display_name: isStudent ? 'Student User' : 'Nischay'
      }));
      
      // Force reload or just navigate (App.jsx will handle the rest)
      window.location.href = isStudent ? '/me/attendance' : '/dashboard';
    }, 800);
  };

  return (
    <div className="app-main flex items-center justify-center p-6 min-h-screen dot-grid">
      {/* The background glow and dot grid are handled by global classes */}
      
      <div className="card max-w-[440px] w-full p-12 flex flex-col items-center rounded-2xl relative z-10 border border-border-default shadow-raised">
        {/* Glow behind the logo */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-accent-glow/20 blur-3xl -z-10" />
        
        <div className="w-14 h-14 bg-surface-raised border border-border-default rounded-2xl flex items-center justify-center mb-8 shadow-card">
          <LogIn className="text-accent-glow" size={28} />
        </div>
        
        <div className="text-center mb-10">
          <h1 className="text-display-sm text-fg-primary mb-2">ForgeTrack</h1>
          <p className="text-label text-fg-tertiary uppercase tracking-[0.2em]">The Forge AI-ML Bootcamp</p>
        </div>

        {/* Tab Toggle - Advanced Pill Style */}
        <div className="bg-surface-inset p-1.5 rounded-xl w-full flex mb-10 border border-border-subtle shadow-inner">
          <button
            onClick={() => setIsStudent(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all duration-300 ${
              isStudent 
                ? 'bg-surface-raised text-fg-primary shadow-raised border border-border-default' 
                : 'text-fg-tertiary hover:text-fg-secondary'
            }`}
          >
            <GraduationCap size={18} />
            Student
          </button>
          <button
            onClick={() => setIsStudent(false)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all duration-300 ${
              !isStudent 
                ? 'bg-surface-raised text-fg-primary shadow-raised border border-border-default' 
                : 'text-fg-tertiary hover:text-fg-secondary'
            }`}
          >
            <ShieldCheck size={18} />
            Mentor
          </button>
        </div>

        <form className="w-full space-y-7" onSubmit={handleLogin}>
          <div className="space-y-2.5">
            <label className="text-micro text-fg-secondary uppercase tracking-widest font-bold ml-1">
              {isStudent ? 'University Seat Number' : 'Email Address'}
            </label>
            <input
              type={isStudent ? 'text' : 'email'}
              placeholder={isStudent ? 'e.g. 4SH24CS001' : 'mentor@theforge.ai'}
              className="input w-full"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2.5">
            <label className="text-micro text-fg-secondary uppercase tracking-widest font-bold ml-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="input w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="p-4 bg-danger-bg border border-danger-border rounded-xl text-danger text-[13px] flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="w-1.5 h-1.5 rounded-full bg-danger" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-4 py-4 text-base font-black shadow-raised active:scale-[0.97] transition-all duration-200"
          >
            {loading ? 'AUTHENTICATING...' : 'SIGN IN TO TRACK'}
          </button>
        </form>

        <p className="mt-12 text-fg-tertiary text-[10px] text-center tracking-[0.15em] uppercase font-bold opacity-60">
          {isStudent 
            ? 'Default password is your USN' 
            : 'Access issues? Contact Bootcamp Admin'}
        </p>
      </div>
    </div>
  );
}
