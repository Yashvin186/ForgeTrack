import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Loader2 } from 'lucide-react';

export default function RoleGuard({ allowedRoles }) {
  const { user, role, initializing } = useUser();
  
  console.log('[RoleGuard] Checking access:', { role, allowedRoles, initializing });

  if (initializing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
        <Loader2 className="w-10 h-10 text-accent-glow animate-spin opacity-50" />
        <p className="text-xs font-bold text-fg-tertiary uppercase tracking-widest animate-pulse">Syncing Permissions...</p>
      </div>
    );
  }

  if (!user) {
    console.warn('[RoleGuard] No user authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    console.warn(`[RoleGuard] Access denied for role: ${role}. Required: ${allowedRoles}`);
    if (role === 'mentor') return <Navigate to="/dashboard" replace />;
    if (role === 'student') return <Navigate to="/me/attendance" replace />;
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
