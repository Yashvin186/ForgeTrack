import { useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { studentService } from '../services/student.service';
import { UserPlus, GraduationCap, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Signup() {
  const [isStudent, setIsStudent] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    usn: '' // For students to link to students table
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent double submission
    
    setLoading(true);
    setError(null);

    try {
      let student_id = null;
      if (isStudent && formData.usn) {
        console.log(`[Signup] Attempting to link student record for USN: ${formData.usn}`);
        // Find student record to link
        const students = await studentService.getAll();
        const student = students.find(s => s.usn.toLowerCase() === formData.usn.toLowerCase());
        
        if (student) {
          student_id = student.id;
          console.log(`[Signup] Student record linked: ${student.name} (${student.id})`);
        } else {
          console.warn(`[Signup] No student record found for USN: ${formData.usn}. Proceeding with null student_id.`);
        }
      }

      console.log(`[Signup] Creating auth account for: ${formData.email}`);
      const { data, error: signUpError } = await authService.signUp(formData.email, formData.password, {
        role: isStudent ? 'student' : 'mentor',
        display_name: formData.name,
        student_id
      });

      if (signUpError) {
        console.error('[Signup] Auth service error:', signUpError.message);
        const friendlyMsg = signUpError.friendlyMessage || signUpError.message;
        
        if (friendlyMsg.includes('already exists')) {
          setError(<>This email is already registered. <Link to="/login" className="underline font-black">Sign in instead?</Link></>);
        } else {
          setError(friendlyMsg);
        }
        return;
      }

      console.log('[Signup] Signup successful, navigating to login...');
      // Navigate to login
      navigate('/login');
    } catch (err) {
      console.error('[Signup] Error:', err);
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-main flex items-center justify-center p-6 min-h-screen dot-grid">
      <div className="card max-w-[480px] w-full p-10 flex flex-col items-center rounded-2xl relative z-10 border border-border-default shadow-raised">
        <div className="w-14 h-14 bg-surface-raised border border-border-default rounded-2xl flex items-center justify-center mb-8 shadow-card">
          <UserPlus className="text-accent-glow" size={28} />
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-display-sm text-fg-primary mb-2">Join ForgeTrack</h1>
          <p className="text-label text-fg-tertiary uppercase tracking-[0.2em]">Create your account</p>
        </div>

        <div className="bg-surface-inset p-1.5 rounded-xl w-full flex mb-8 border border-border-subtle">
          <button
            onClick={() => setIsStudent(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
              isStudent ? 'bg-surface-raised text-fg-primary shadow-raised border border-border-default' : 'text-fg-tertiary hover:text-fg-secondary'
            }`}
          >
            <GraduationCap size={18} /> Student
          </button>
          <button
            onClick={() => setIsStudent(false)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
              !isStudent ? 'bg-surface-raised text-fg-primary shadow-raised border border-border-default' : 'text-fg-tertiary hover:text-fg-secondary'
            }`}
          >
            <ShieldCheck size={18} /> Mentor
          </button>
        </div>

        <form className="w-full space-y-5" onSubmit={handleSignup}>
          <div className="space-y-2">
            <label className="text-micro text-fg-secondary uppercase tracking-widest font-bold ml-1">Full Name</label>
            <input
              className="input w-full"
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-micro text-fg-secondary uppercase tracking-widest font-bold ml-1">Email Address</label>
            <input
              type="email"
              className="input w-full"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          {isStudent && (
            <div className="space-y-2">
              <label className="text-micro text-fg-secondary uppercase tracking-widest font-bold ml-1">USN (To link records)</label>
              <input
                className="input w-full"
                placeholder="4SH22CS000"
                value={formData.usn}
                onChange={(e) => setFormData({ ...formData, usn: e.target.value })}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-micro text-fg-secondary uppercase tracking-widest font-bold ml-1">Password</label>
            <input
              type="password"
              className="input w-full"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          {error && (
            <div className="p-4 bg-danger-bg border border-danger-border rounded-xl text-danger text-xs font-bold flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-danger shrink-0" />
               {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-sm font-black shadow-raised"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
            {loading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
          </button>
        </form>

        <p className="mt-8 text-sm text-fg-secondary font-medium">
          Already have an account? <Link to="/login" className="text-accent-glow hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
