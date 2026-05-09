import { useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Search, Bell, ChevronRight } from 'lucide-react';

export default function TopBar() {
  const { user } = useUser();
  const location = useLocation();

  const getBreadcrumb = () => {
    const path = location.pathname.split('/').filter(Boolean);
    if (path.length === 0) return [{ label: 'Overview', active: true }];
    return [
      { label: 'Overview', active: false },
      ...path.map((p, i) => ({
        label: p.charAt(0).toUpperCase() + p.slice(1).replace('-', ' '),
        active: i === path.length - 1
      }))
    ];
  };

  const breadcrumbs = getBreadcrumb();

  return (
    <header className="h-20 border-b border-border-subtle bg-void/50 backdrop-blur-xl flex items-center justify-between px-8 lg:px-12 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        {breadcrumbs.map((bc, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {idx > 0 && <ChevronRight size={14} className="text-fg-tertiary" />}
            <span className={`text-[11px] font-bold uppercase tracking-widest ${
              bc.active ? 'text-fg-primary' : 'text-fg-tertiary'
            }`}>
              {bc.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="relative hidden md:block group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-tertiary group-focus-within:text-accent-glow transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search resources..." 
            className="input pl-10 w-64 h-10 text-sm bg-surface-raised border-border-subtle hover:border-border-default transition-all shadow-inner rounded-xl"
          />
        </div>

        <button className="relative w-10 h-10 rounded-xl flex items-center justify-center text-fg-tertiary hover:bg-surface-raised hover:text-fg-primary transition-all border border-transparent hover:border-border-subtle">
          <Bell size={20} strokeWidth={1.75} />
          <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-danger border-2 border-void" />
        </button>

        <div className="flex items-center gap-3 pl-6 border-l border-border-subtle cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-fg-primary group-hover:text-accent-glow transition-colors">{user?.name || 'User'}</p>
            <p className="text-[10px] text-fg-tertiary uppercase tracking-widest font-bold mt-0.5">Active</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-surface-raised border border-border-default shadow-sm flex items-center justify-center text-accent-glow font-bold text-sm group-hover:border-accent-glow/50 transition-all">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
