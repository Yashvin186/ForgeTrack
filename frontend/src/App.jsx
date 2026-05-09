import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Unauthorized from './pages/Unauthorized';
import Layout from './components/Layout';
import RoleGuard from './components/RoleGuard';
import ErrorBoundary from './components/ErrorBoundary';
import DevTokens from './pages/DevTokens';
import DevAuth from './pages/DevAuth';
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
  const { user, role, initializing } = useUser();
  const isAuthenticated = !!user;

  if (initializing) {
    return (
      <div className="flex h-screen w-full bg-void items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-accent-glow/20 border-t-accent-glow rounded-full animate-spin" />
          <p className="text-[10px] font-black text-fg-tertiary uppercase tracking-widest animate-pulse">Initializing Protocol...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/signup" 
            element={!isAuthenticated ? <Signup /> : <Navigate to="/" replace />} 
          />
          
          <Route path="/dev-tokens" element={<DevTokens />} />
          <Route path="/dev-auth" element={<DevAuth />} />
          
          {/* Protected Routes */}
          <Route 
            path="/" 
            element={isAuthenticated ? <Layout role={role} /> : <Navigate to="/login" replace />}
          >
            <Route index element={<HomeRedirect role={role} />} />
            
            <Route element={<RoleGuard allowedRoles={['mentor']} />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="attendance" element={<MarkAttendance />} />
              <Route path="history" element={<StudentHistory />} />
              <Route path="upload" element={<CSVImport />} />
              <Route path="materials" element={<Materials />} />
              <Route path="assignments" element={<Assignments />} />
            </Route>
            
            <Route element={<RoleGuard allowedRoles={['student']} />}>
              <Route path="me/attendance" element={<MyAttendance />} />
              <Route path="me/upcoming" element={<UpcomingSessions />} />
              <Route path="me/materials" element={<Materials />} />
            </Route>

            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="/403" element={<Unauthorized />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
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

function HomeRedirect({ role }) {
  if (role === 'mentor') return <Navigate to="/dashboard" replace />;
  if (role === 'student') return <Navigate to="/me/attendance" replace />;

  return <Navigate to="/403" replace />;
}

export default App;
