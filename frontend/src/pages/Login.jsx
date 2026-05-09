import { useState } from 'react';
import { authService } from '../services/auth.service';
import { LogIn, GraduationCap, ShieldCheck, UserPlus, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const [isStudent, setIsStudent] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFirstUser, setIsFirstUser] = useState(false);
  const navigate = useNavigate();

  useState(() => {
    async function checkFirst() {
      const empty = await authService.isUsersTableEmpty();
      setIsFirstUser(empty);
    }
    checkFirst();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return; // Guard against double clicks
    
    setLoading(true);
    setError(null);
    
    try {
      let loginEmail = email;
      
      // USN detection
      if (!email.includes('@')) {
        console.log(`[Login] Detected USN: ${email}`);
        const mappedEmail = await authService.getEmailByUSN(email);
        if (!mappedEmail) {
          throw new Error('Student record not found for this USN. Please use your email or contact admin.');
        }
        loginEmail = mappedEmail;
        console.log(`[Login] USN mapped to: ${loginEmail}`);
      }

      console.log(`[Login] Attempting sign in with: ${loginEmail}`);
      const { data, error: loginError } = await authService.signIn(loginEmail, password);
      
      if (loginError) {
        console.error('[Login] Auth service error:', loginError.message);
        throw new Error(loginError.friendlyMessage || loginError.message);
      }

      console.log('[Login] Sign in successful, fetching profile...');
      const userWithProfile = await authService.getCurrentUser();
      
      if (!userWithProfile?.profile) {
         console.warn('[Login] No public.users profile found for this user');
      }
      
      const role = userWithProfile?.profile?.role || userWithProfile?.user_metadata?.role || (isStudent ? 'student' : 'mentor');
      console.log(`[Login] Authenticated as: ${role}`);
      
      if (role === 'mentor') {
        navigate('/dashboard');
      } else {
        navigate('/me/attendance');
      }
      
    } catch (err) {
      console.error('[Login] Error:', err);
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-main flex items-center justify-center p-6 min-h-screen dot-grid">
      <div className="card max-w-[440px] w-full p-12 flex flex-col items-center rounded-2xl relative z-10 border border-border-default shadow-raised">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-accent-glow/20 blur-3xl -z-10" />
        
        <div className="w-14 h-14 bg-surface-raised border border-border-default rounded-2xl flex items-center justify-center mb-8 shadow-card">
          <LogIn className="text-accent-glow" size={28} />
        </div>
        
        <div className="text-center mb-10">
          <h1 className="text-display-sm text-fg-primary mb-2">ForgeTrack</h1>
          <p className="text-label text-fg-tertiary uppercase tracking-[0.2em]">The Forge AI-ML Bootcamp</p>
        </div>

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
            <label className="text-micro text-fg-secondary uppercase tracking-widest font-bold ml-1">Email or USN</label>
            <input
              type="text"
              placeholder="e.g. 4SH22CS000 or email"
              className="input w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

          {isFirstUser && (
            <div className="p-4 bg-accent-glow/10 border border-accent-glow/20 rounded-xl text-accent-glow text-[13px] flex flex-col gap-1 animate-in fade-in slide-in-from-top-2">
              <p className="font-bold flex items-center gap-2">
                <Sparkles size={14} /> Welcome to ForgeTrack
              </p>
              <p className="opacity-80">The system is ready. Please sign up to create the first mentor account.</p>
            </div>
          )}

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

        <div className="mt-10 flex flex-col items-center gap-4">
          <p className="text-fg-tertiary text-[11px] font-bold uppercase tracking-widest">
            New to The Forge?
          </p>
          <Link 
            to="/signup" 
            className="flex items-center gap-2 text-accent-glow font-bold text-sm hover:underline"
          >
            <UserPlus size={16} /> Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
