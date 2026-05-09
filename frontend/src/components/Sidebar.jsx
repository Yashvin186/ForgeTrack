import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import {
  LayoutDashboard,
  CheckSquare,
  History,
  BookOpen,

  UserCheck,
  Calendar,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';

const MENTOR_NAV = [
  {
    group: 'Platform',
    items: [{ to: '/dashboard', label: 'Overview', icon: LayoutDashboard }],
  },
  {
    group: 'Operations',
    items: [
      { to: '/attendance',  label: 'Mark Attendance', icon: CheckSquare },
      { to: '/history',     label: 'Student Metrics', icon: History },
      { to: '/materials',   label: 'Learning Library', icon: BookOpen },
    ],
  },
  {
    group: 'Automation',
    items: [
      { to: '/upload', label: 'AI Import Studio', icon: Cpu },
    ],
  },
];

const STUDENT_NAV = [
  {
    group: 'Personal',
    items: [
      { to: '/me/attendance', label: 'My Progress',   icon: UserCheck },
      { to: '/me/upcoming',   label: 'Session Plan',  icon: Calendar },
      { to: '/me/materials',  label: 'Resources',     icon: BookOpen },
    ],
  },
];

export default function Sidebar({ role, isMobile = false }) {
  const { user, logout } = useUser();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navGroups = role === 'mentor' ? MENTOR_NAV : role === 'student' ? STUDENT_NAV : [];
  
  const navContentElement = (
    <div className="flex-1 overflow-y-auto px-3 py-6 space-y-8 custom-scrollbar">
      <nav className="space-y-8">
          {navGroups.map(({ group, items }) => (
            <div key={group} className="space-y-1.5">
              {(!collapsed || isMobile) && (
                <p className="text-[10px] text-fg-tertiary uppercase tracking-[0.2em] font-black px-4 mb-3">
                  {group}
                </p>
              )}
              {items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 text-sm font-semibold group ${
                      isActive
                        ? 'bg-accent-glow/10 text-accent-glow shadow-sm shadow-accent-glow/5 border border-accent-glow/20'
                        : 'text-fg-secondary hover:bg-surface-raised hover:text-fg-primary border border-transparent'
                    } ${collapsed && !isMobile ? 'justify-center px-0' : ''}`
                  }
                  title={collapsed && !isMobile ? label : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <Icon 
                        size={20} 
                        strokeWidth={isActive ? 2.5 : 1.75} 
                        className={`shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-accent-glow' : 'text-fg-tertiary'}`} 
                      />
                      {(!collapsed || isMobile) && <span className="tracking-tight">{label}</span>}
                      {isActive && !isMobile && !collapsed && (
                        <div className="ml-auto w-1 h-1 rounded-full bg-accent-glow shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </div>
  );

  if (isMobile) {
    return navContentElement;
  }

  return (
    <aside
      className={`bg-canvas border-r border-border-subtle flex flex-col transition-all duration-500 ease-in-out relative z-40 ${
        collapsed ? 'w-[84px]' : 'w-[280px]'
      }`}
    >
      {/* Brand Header */}
      <div className="h-[73px] px-6 flex items-center justify-between border-b border-border-subtle shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-3 animate-fade-in">
             <div className="w-8 h-8 rounded-xl bg-accent-glow flex items-center justify-center text-white shadow-glow">
                <ShieldCheck size={18} />
             </div>
             <span className="font-display font-black text-lg text-fg-primary tracking-tighter">
               ForgeTrack
             </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-9 h-9 rounded-xl bg-surface-raised border border-border-default flex items-center justify-center text-fg-tertiary hover:text-fg-primary hover:border-border-strong transition-all duration-300 shadow-sm ${collapsed ? 'mx-auto' : 'ml-auto'}`}
        >
          {collapsed ? <ChevronRight size={16} strokeWidth={3} /> : <ChevronLeft size={16} strokeWidth={3} />}
        </button>
      </div>

      {/* User Quick Info */}
      {!collapsed && user && (
        <div className="mx-4 mt-6 p-4 rounded-2xl bg-surface-raised/40 border border-border-subtle flex items-center gap-4 shrink-0 group hover:border-accent-glow/30 transition-all cursor-default">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-glow to-info flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg group-hover:scale-105 transition-transform">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-fg-primary truncate">{user.name}</p>
            <p className="text-[9px] text-accent-glow font-black uppercase tracking-[0.2em] opacity-80">
              Verified {role}
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      {navContentElement}

      {/* Platform Footer */}
      <div className="p-4 border-t border-border-subtle space-y-1.5 shrink-0 bg-canvas/50 backdrop-blur-sm">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
              collapsed ? 'justify-center' : ''
            } ${isActive ? 'text-accent-glow bg-accent-glow/5 border border-accent-glow/10' : 'text-fg-secondary hover:text-fg-primary hover:bg-surface-raised'}`
          }
        >
          <Settings size={20} strokeWidth={1.75} className="shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
        
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-fg-tertiary hover:text-danger hover:bg-danger-bg/50 hover:border-danger-border border border-transparent transition-all duration-300 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut size={20} strokeWidth={1.75} className="shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
