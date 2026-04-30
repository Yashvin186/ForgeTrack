import { Navigate, Outlet } from 'react-router-dom';

export default function RoleGuard({ role, allowedRoles }) {
  if (role === null) {
    // If role is null here, it means we don't have it yet, 
    // but App.jsx handles loading state. If it reaches here as null,
    // they might not be fully logged in or we don't know the role.
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    // Redirect properly to their respective dashboard
    if (role === 'mentor') return <Navigate to="/dashboard" replace />;
    if (role === 'student') return <Navigate to="/me/attendance" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
