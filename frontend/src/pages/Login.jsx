import { useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { LogIn, GraduationCap, ShieldCheck, UserPlus, Sparkles, Mail, Lock, Fingerprint } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const [isStudent, setIsStudent] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFirstUser, setIsFirstUser] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkFirst() {
      try {
        const empty = await authService.isUsersTableEmpty();
        setIsFirstUser(empty);
      } catch {
        // Silent fail for first user check
      }
    }
    checkFirst();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return; 
    
    setLoading(true);
    setError(null);
    
    try {
      let loginEmail = email;
      
      // USN detection (Legacy USN to Email mapping)
      if (!email.includes('@')) {
        const mappedEmail = await authService.getEmailByUSN(email);
        if (!mappedEmail) {
          throw new Error('Student record not found for this USN.');
        }
        loginEmail = mappedEmail;
      }

      const { error: loginError } = await authService.signIn(loginEmail, password);
      
      if (loginError) {
        throw new Error(loginError.friendlyMessage || loginError.message);
      }

      const session = await authService.getSession();
      const role = session?.user?.user_metadata?.role || (isStudent ? 'student' : 'mentor');
      
      if (role === 'mentor') {
        navigate('/dashboard');
      } else {
        navigate('/me/attendance');
      }
      
    } catch (err) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-main flex items-center justify-center p-6 min-h-screen relative overflow-hidden bg-void">
      {/* ── Background Effects ────────────────────────────────── */}
      <div className="absolute inset-0 dot-grid opacity-40" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-glow/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-info-bg/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-[420px] space-y-8 relative z-10 animate-fade-in">
        {/* Brand */}
        <div className="text-center space-y-3">
           <div className="w-16 h-16 bg-surface-raised border border-border-default rounded-2xl flex items-center justify-center mx-auto shadow-raised group hover:border-accent-glow/50 transition-all duration-500">
              <Fingerprint className="text-accent-glow group-hover:scale-110 transition-transform" size={32} />
           </div>
           <div>
              <h1 className="text-display-sm text-fg-primary tracking-tight font-black">ForgeTrack</h1>
              <p className="text-[10px] text-fg-tertiary uppercase tracking-[0.25em] font-black">Production Auth Gateway</p>
           </div>
        </div>

        {/* Card */}
        <div className="card p-10 border border-border-default rounded-[2.5rem] bg-canvas/40 backdrop-blur-3xl shadow-raised relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
           
           {/* Role Switcher */}
           <div className="bg-surface-inset p-1 rounded-2xl flex mb-10 border border-border-subtle">
              <button
                onClick={() => setIsStudent(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                  isStudent ? 'bg-surface-raised text-fg-primary shadow-sm border border-border-default' : 'text-fg-tertiary hover:text-fg-secondary'
                }`}
              >
                <GraduationCap size={16} /> Student
              </button>
              <button
                onClick={() => setIsStudent(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                  !isStudent ? 'bg-surface-raised text-fg-primary shadow-sm border border-border-default' : 'text-fg-tertiary hover:text-fg-secondary'
                }`}
              >
                <ShieldCheck size={16} /> Mentor
              </button>
           </div>

           <form className="space-y-6" onSubmit={handleLogin}>
              <div className="space-y-2">
                 <label className="text-[10px] text-fg-tertiary uppercase tracking-widest font-black ml-1">Access Credential</label>
                 <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-tertiary group-focus-within:text-accent-glow transition-colors" size={18} />
                    <input
                      type="text"
                      placeholder="Email or USN"
                      className="input w-full pl-12 h-12 bg-surface-inset/50 border-border-subtle"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] text-fg-tertiary uppercase tracking-widest font-black ml-1">Passkey</label>
                 <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-tertiary group-focus-within:text-accent-glow transition-colors" size={18} />
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="input w-full pl-12 h-12 bg-surface-inset/50 border-border-subtle"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                 </div>
              </div>

              {isFirstUser && (
                <div className="p-4 bg-accent-glow/5 border border-accent-glow/20 rounded-2xl text-[11px] text-accent-glow leading-relaxed flex gap-3">
                   <Sparkles size={16} className="shrink-0" />
                   <span>The system is in initial bootstrap mode. Create the first mentor account to begin.</span>
                </div>
              )}

              {error && (
                <div className="p-4 bg-danger-bg border border-danger-border rounded-2xl text-[11px] text-danger font-bold flex items-center gap-3 animate-fade-in">
                   <div className="w-1.5 h-1.5 rounded-full bg-danger" />
                   {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 text-sm font-black uppercase tracking-[0.15em] flex items-center justify-center gap-3 shadow-lg shadow-accent-glow/20 mt-4 disabled:opacity-50"
              >
                {loading ? <><div className="w-4 h-4 border-2 border-void/30 border-t-void rounded-full animate-spin" /> Verifying</> : <><LogIn size={18} /> Authenticate</>}
              </button>
           </form>
        </div>

        {/* Footer Link */}
        <div className="text-center">
           <p className="text-fg-tertiary text-xs font-bold uppercase tracking-widest">
              Unregistered User?
           </p>
           <Link 
             to="/signup" 
             className="inline-flex items-center gap-2 text-accent-glow font-black text-sm mt-3 hover:opacity-80 transition-opacity"
           >
             Initialize Secure Account <UserPlus size={16} />
           </Link>
        </div>
      </div>
    </div>
  );
}
