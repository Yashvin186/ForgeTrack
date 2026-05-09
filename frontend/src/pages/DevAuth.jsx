import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ShieldCheck, UserCheck, Loader2, AlertCircle } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

const DevAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { setUser, setInitializing } = useUser();
  const navigate = useNavigate();

  const handleDevLogin = async (role) => {
    try {
      setLoading(true);
      setError(null);
      
      // 1. For dev bypass, we check if there's a real user we can 'impersonate' 
      // or we just mock the context if Supabase is down.
      // But let's try a real login if possible.
      
      const email = role === 'mentor' ? 'mentor@forge.com' : 'student@forge.com';
      const password = 'password123'; // Default dev password

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        console.warn('[DevAuth] Real login failed, using mock session for UI testing');
        // Mock session for UI testing when DB is unstable
        const mockUser = {
          id: 'dev-mock-id',
          email: email,
          name: `Dev ${role.charAt(0).toUpperCase() + role.slice(1)}`,
          role: role,
          avatar: role.charAt(0).toUpperCase()
        };
        setUser(mockUser);
        setInitializing(false);
        navigate(role === 'mentor' ? '/dashboard' : '/me/attendance');
        return;
      }

      // If successful, UserContext onAuthStateChange will handle the rest
      // but we force a redirect to be sure
      navigate(role === 'mentor' ? '/dashboard' : '/me/attendance');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-void flex items-center justify-center p-6">
      <div className="card max-w-md w-full p-8 space-y-8 border border-accent-glow/20 shadow-[0_0_50px_rgba(99,102,241,0.1)]">
        <header className="text-center space-y-2">
          <div className="w-16 h-16 bg-accent-glow/10 rounded-2xl flex items-center justify-center text-accent-glow mx-auto mb-4 border border-accent-glow/20">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-black text-fg-primary tracking-tight">Emergency Auth Bypass</h1>
          <p className="text-sm text-fg-secondary">Use these tools to bypass authentication when Supabase or the Auth service is unstable.</p>
        </header>

        {error && (
          <div className="p-4 rounded-xl bg-danger-bg border border-danger-border text-danger text-xs flex items-center gap-3">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => handleDevLogin('mentor')}
            disabled={loading}
            className="flex items-center justify-between p-4 rounded-xl bg-surface-raised border border-border-default hover:border-accent-glow transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-accent-glow/10 text-accent-glow">
                <ShieldCheck size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold text-fg-primary">Mentor Access</p>
                <p className="text-[10px] text-fg-tertiary uppercase tracking-widest">Full Admin Rights</p>
              </div>
            </div>
            {loading ? <Loader2 className="animate-spin text-fg-tertiary" size={16} /> : <UserCheck className="text-fg-tertiary group-hover:text-accent-glow transition-colors" size={16} />}
          </button>

          <button
            onClick={() => handleDevLogin('student')}
            disabled={loading}
            className="flex items-center justify-between p-4 rounded-xl bg-surface-raised border border-border-default hover:border-success/50 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-success/10 text-success">
                <UserCheck size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold text-fg-primary">Student Access</p>
                <p className="text-[10px] text-fg-tertiary uppercase tracking-widest">View Attendance Only</p>
              </div>
            </div>
            {loading ? <Loader2 className="animate-spin text-fg-tertiary" size={16} /> : <UserCheck className="text-fg-tertiary group-hover:text-success transition-colors" size={16} />}
          </button>
        </div>

        <footer className="text-center">
          <button 
            onClick={() => navigate('/login')}
            className="text-xs text-fg-tertiary hover:text-fg-primary transition-colors underline underline-offset-4"
          >
            Back to Regular Login
          </button>
        </footer>
      </div>
    </div>
  );
};

export default DevAuth;
