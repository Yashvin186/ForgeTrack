import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { UserProvider, useUser } from './context/UserContext';
import { supabase } from './lib/supabaseClient';
import Login from './pages/Login';
import Signup from './pages/Signup';
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
import CSVImport       from './pages/CSVImport';
import UpcomingSessions from './pages/UpcomingSessions';
import Assignments      from './pages/Assignments';

function AppContent() {
  const { user, loading: userLoading } = useUser();
  const [authLoading, setAuthLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setAuthLoading(false);
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (authLoading || userLoading) {
    return (
      <div className="app-main flex items-center justify-center min-h-screen">
        <div className="text-fg-secondary text-display-sm animate-pulse font-display">Loading...</div>
      </div>
    );
  }

  const role = user?.role || null;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" replace />} />
        <Route path="/signup" element={!session ? <Signup /> : <Navigate to="/" replace />} />
        <Route path="/dev-tokens" element={<DevTokens />} />
        
        {/* Protected Layout */}
        <Route path="/" element={session ? <Layout role={role} /> : <Navigate to="/login" replace />}>
          <Route index element={<HomeRedirect role={role} />} />
          
          {/* Mentor Only Routes */}
          <Route element={<RoleGuard role={role} allowedRoles={['mentor']} />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="attendance" element={<MarkAttendance />} />
            <Route path="history" element={<StudentHistory />} />
            <Route path="upload" element={<CSVImport />} />
            <Route path="materials" element={<Materials />} />
            <Route path="assignments" element={<Assignments />} />
          </Route>
          
          {/* Student Only Routes */}
          <Route element={<RoleGuard role={role} allowedRoles={['student']} />}>
            <Route path="me/attendance" element={<MyAttendance />} />
            <Route path="me/upcoming" element={<UpcomingSessions />} />
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

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

// Logic to redirect user to their specific home page based on role
function HomeRedirect({ role }) {
  if (role === null) {
    return <Navigate to="/login" replace />;
  }
  if (role === 'mentor') return <Navigate to="/dashboard" replace />;
  if (role === 'student') return <Navigate to="/me/attendance" replace />;
  return <Navigate to="/login" replace />;
}

export default App;
