import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { authService } from '../services/auth.service';
import {
  LayoutDashboard,
  CheckSquare,
  History,
  BookOpen,
  Upload,
  UserCheck,
  Calendar,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react';

const MENTOR_NAV = [
  {
    group: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    group: 'Activity',
    items: [
      { to: '/attendance',  label: 'Mark Attendance', icon: CheckSquare },
      { to: '/history',     label: 'Student History', icon: History },
      { to: '/materials',   label: 'Materials',       icon: BookOpen },
      { to: '/assignments', label: 'Assignments',     icon: FileText },
    ],
  },
  {
    group: 'Data',
    items: [{ to: '/upload', label: 'Upload CSV', icon: Upload }],
  },
];

const STUDENT_NAV = [
  {
    group: 'My Learning',
    items: [
      { to: '/me/attendance', label: 'My Attendance', icon: UserCheck },
      { to: '/me/upcoming',   label: 'Upcoming',      icon: Calendar },
      { to: '/me/materials',  label: 'Materials',     icon: BookOpen },
    ],
  },
];

export default function Sidebar({ role }) {
  const { user } = useUser();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authService.signOut();
    navigate('/login');
  };

  const navGroups = role === 'mentor' ? MENTOR_NAV : role === 'student' ? STUDENT_NAV : [];

  return (
    <aside
      className={`bg-canvas border-r border-border-subtle flex flex-col transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* Logo & Collapse */}
      <div className="p-5 flex items-center justify-between border-b border-border-subtle shrink-0">
        {!collapsed && (
          <span className="font-display font-bold text-lg text-fg-primary tracking-tight">
            ForgeTrack
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-8 h-8 rounded-lg bg-surface-raised border border-border-default flex items-center justify-center text-fg-tertiary hover:text-fg-primary transition-colors ml-auto"
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* User Pill */}
      {!collapsed && user && (
        <div className="mx-4 mt-5 p-3 rounded-xl bg-surface-raised border border-border-subtle flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-full bg-accent-glow/20 flex items-center justify-center text-accent-glow font-bold text-sm shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-fg-primary truncate">{user.name}</p>
            <p className="text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">
              {role}
            </p>
          </div>
        </div>
      )}

      {/* Nav Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        <nav className="space-y-6">
          {navGroups.map(({ group, items }) => (
            <div key={group} className="space-y-1">
              {!collapsed && (
                <p className="text-[10px] text-fg-tertiary uppercase tracking-[0.15em] font-bold px-3 mb-2">
                  {group}
                </p>
              )}
              {items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium overflow-hidden ${
                      isActive
                        ? 'bg-surface-raised text-fg-primary shadow-sm'
                        : 'text-fg-secondary hover:bg-surface-raised hover:text-fg-primary'
                    } ${collapsed ? 'justify-center' : ''}`
                  }
                  title={collapsed ? label : undefined}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-accent-glow shadow-[0_0_8px_rgba(99,102,241,0.5)]" />}
                      <Icon size={20} strokeWidth={1.75} className="shrink-0" />
                      {!collapsed && <span>{label}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border-subtle space-y-1 shrink-0">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors overflow-hidden ${
              collapsed ? 'justify-center' : ''
            } ${isActive ? 'text-fg-primary bg-surface-raised shadow-sm' : 'text-fg-secondary hover:text-fg-primary hover:bg-surface-raised'}`
          }
          title={collapsed ? 'Settings' : undefined}
        >
          {({ isActive }) => (
            <>
              {isActive && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-accent-glow shadow-[0_0_8px_rgba(99,102,241,0.5)]" />}
              <Settings size={20} strokeWidth={1.75} className="shrink-0" />
              {!collapsed && <span>Settings</span>}
            </>
          )}
        </NavLink>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-fg-secondary hover:text-danger hover:bg-danger-bg hover:border-danger/10 border border-transparent transition-all ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={20} strokeWidth={1.75} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
