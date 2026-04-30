import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import Layout from './components/Layout';
import RoleGuard from './components/RoleGuard';
import DevTokens from './pages/DevTokens';
import Dashboard from './pages/Dashboard';
import MyAttendance    from './pages/MyAttendance';
import MarkAttendance  from './pages/MarkAttendance';
import StudentHistory  from './pages/StudentHistory';
import Materials       from './pages/Materials';
import Settings        from './pages/Settings';

// Remaining placeholders
const Upload   = () => <div className="p-8 text-fg-secondary">Upload CSV — coming soon</div>;
const Upcoming = () => <div className="p-8 text-fg-secondary">Upcoming Sessions — coming soon</div>;


function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSessionAndRole = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const mockRole = localStorage.getItem('forge_mock_role');
      
      if (mockRole) {
        setSession({ user: JSON.parse(localStorage.getItem('forge_mock_user') || '{}'), isMock: true });
        setRole(mockRole);
        setLoading(false);
        return;
      }

      if (currentSession) {
        setSession(currentSession);
        // Fetch role
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', currentSession.user.id)
          .single();
        setRole(data?.role || null);
      }
      setLoading(false);
    };

    checkSessionAndRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'SIGNED_IN' && newSession) {
        // Only clear mock data on an actual Supabase sign-in event
        localStorage.removeItem('forge_mock_role');
        localStorage.removeItem('forge_mock_user');
        setSession(newSession);

        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', newSession.user.id)
          .single();
        setRole(data?.role || null);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="app-main flex items-center justify-center min-h-screen">
        <div className="text-fg-secondary text-display-sm animate-pulse font-display">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" replace />} />
        <Route path="/dev-tokens" element={<DevTokens />} />
        
        {/* Protected Layout */}
        <Route path="/" element={session ? <Layout role={role} /> : <Navigate to="/login" replace />}>
          <Route index element={<HomeRedirect role={role} />} />
          
          {/* Mentor Only Routes */}
          <Route element={<RoleGuard role={role} allowedRoles={['mentor']} />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="attendance" element={<MarkAttendance />} />
            <Route path="history" element={<StudentHistory />} />
            <Route path="upload" element={<Upload />} />
            <Route path="materials" element={<Materials />} />
          </Route>
          
          {/* Student Only Routes */}
          <Route element={<RoleGuard role={role} allowedRoles={['student']} />}>
            <Route path="me/attendance" element={<MyAttendance />} />
            <Route path="me/upcoming" element={<Upcoming />} />
            <Route path="me/materials" element={<Materials />} />
          </Route>

          {/* Shared Protected Routes */}
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="/403" element={<Unauthorized />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

// Logic to redirect user to their specific home page based on role
function HomeRedirect({ role }) {
  // role can be null while App.jsx is still fetching — show nothing and wait
  if (role === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-fg-tertiary animate-pulse text-sm tracking-widest uppercase">Loading...</div>
      </div>
    );
  }
  if (role === 'mentor') return <Navigate to="/dashboard" replace />;
  if (role === 'student') return <Navigate to="/me/attendance" replace />;
  return <Navigate to="/login" replace />;
}

export default App;
