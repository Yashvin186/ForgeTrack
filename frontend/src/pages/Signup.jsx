import { useState } from 'react';
import { authService } from '../services/auth.service';
import { studentService } from '../services/student.service';
import { UserPlus, GraduationCap, ShieldCheck, Mail, Lock, User, Hash, Sparkles, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Signup() {
  const [isStudent, setIsStudent] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    usn: '' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (loading) return; 
    
    setLoading(true);
    setError(null);

    try {
      let student_id = null;
      if (isStudent && formData.usn) {
        const students = await studentService.getAll();
        const student = students.find(s => s.usn.toLowerCase() === formData.usn.toLowerCase());
        if (student) student_id = student.id;
      }

      const { error: signUpError } = await authService.signUp(formData.email, formData.password, {
        role: isStudent ? 'student' : 'mentor',
        display_name: formData.name,
        student_id,
        usn: isStudent ? formData.usn : null
      });

      if (signUpError) {
        const friendlyMsg = signUpError.friendlyMessage || signUpError.message;
        if (friendlyMsg.includes('already exists')) {
          setError(<>Email already registered. <Link to="/login" className="underline font-black">Sign in instead?</Link></>);
        } else {
          setError(friendlyMsg);
        }
        return;
      }

      navigate('/login');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-main flex items-center justify-center p-6 min-h-screen relative overflow-hidden bg-void">
      <div className="absolute inset-0 dot-grid opacity-40" />
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-glow/10 blur-[120px] rounded-full" />
      
      <div className="w-full max-w-[460px] space-y-8 relative z-10 animate-fade-in">
        <div className="text-center space-y-3">
           <div className="w-16 h-16 bg-surface-raised border border-border-default rounded-2xl flex items-center justify-center mx-auto shadow-raised group hover:border-accent-glow/50 transition-all duration-500">
              <UserPlus className="text-accent-glow group-hover:scale-110 transition-transform" size={32} />
           </div>
           <div>
              <h1 className="text-display-sm text-fg-primary tracking-tight font-black">Initialize Identity</h1>
              <p className="text-[10px] text-fg-tertiary uppercase tracking-[0.25em] font-black">ForgeTrack Enrollment Protocol</p>
           </div>
        </div>

        <div className="card p-10 border border-border-default rounded-[2.5rem] bg-canvas/40 backdrop-blur-3xl shadow-raised relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
           
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

           <form className="space-y-5" onSubmit={handleSignup}>
              <div className="space-y-2">
                 <label className="text-[10px] text-fg-tertiary uppercase tracking-widest font-black ml-1">Full Name</label>
                 <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-tertiary group-focus-within:text-accent-glow transition-colors" size={18} />
                    <input
                      placeholder="e.g. John Doe"
                      className="input w-full pl-12 h-12 bg-surface-inset/50"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] text-fg-tertiary uppercase tracking-widest font-black ml-1">Work Email</label>
                 <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-tertiary group-focus-within:text-accent-glow transition-colors" size={18} />
                    <input
                      type="email"
                      placeholder="name@company.com"
                      className="input w-full pl-12 h-12 bg-surface-inset/50"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                 </div>
              </div>

              {isStudent && (
                <div className="space-y-2 animate-fade-in">
                   <label className="text-[10px] text-fg-tertiary uppercase tracking-widest font-black ml-1">Student Identifier (USN)</label>
                   <div className="relative group">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-tertiary group-focus-within:text-accent-glow transition-colors" size={18} />
                      <input
                        placeholder="e.g. 4SH22CS001"
                        className="input w-full pl-12 h-12 bg-surface-inset/50"
                        value={formData.usn}
                        onChange={(e) => setFormData({ ...formData, usn: e.target.value })}
                        required
                      />
                   </div>
                </div>
              )}

              <div className="space-y-2">
                 <label className="text-[10px] text-fg-tertiary uppercase tracking-widest font-black ml-1">Secure Passphrase</label>
                 <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-tertiary group-focus-within:text-accent-glow transition-colors" size={18} />
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="input w-full pl-12 h-12 bg-surface-inset/50"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                 </div>
              </div>

              {error && (
                <div className="p-4 bg-danger-bg border border-danger-border rounded-2xl text-[11px] text-danger font-bold flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-danger shrink-0" />
                   {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 text-sm font-black uppercase tracking-[0.15em] flex items-center justify-center gap-3 shadow-lg shadow-accent-glow/20 mt-4 disabled:opacity-50"
              >
                {loading ? <><div className="w-4 h-4 border-2 border-void/30 border-t-void rounded-full animate-spin" /> Provisioning</> : <><Sparkles size={18} /> Create Account</>}
              </button>
           </form>
        </div>

        <div className="text-center">
           <p className="text-fg-tertiary text-xs font-bold uppercase tracking-widest">
              Already enrolled?
           </p>
           <Link 
             to="/login" 
             className="inline-flex items-center gap-2 text-accent-glow font-black text-sm mt-3 hover:opacity-80 transition-opacity"
           >
             Return to Gate <ArrowRight size={16} />
           </Link>
        </div>
      </div>
    </div>
  );
}
