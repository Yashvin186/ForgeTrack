import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Search, Bell } from 'lucide-react';

export default function TopBar() {
  const [userName, setUserName] = useState('');
  const location = useLocation();

  useEffect(() => {
    async function getUser() {
      const mockUser = JSON.parse(localStorage.getItem('forge_mock_user') || 'null');
      if (mockUser) {
        setUserName(mockUser.display_name);
        return;
      }

      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('display_name')
          .eq('id', user.id)
          .single();
        setUserName(profile?.display_name || user.email.split('@')[0]);
      }
    }
    getUser();
  }, []);

  const getBreadcrumb = () => {
    const path = location.pathname.split('/').filter(Boolean);
    if (path.length === 0) return 'Overview';
    return path.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' / ');
  };

  return (
    <header className="h-16 border-b border-border-subtle bg-canvas flex items-center justify-between px-8">
      <div className="flex items-center gap-4">
        <span className="text-label text-fg-tertiary">{getBreadcrumb()}</span>
      </div>

      <div className="flex items-center gap-6">
        {/* Placeholder Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-tertiary" size={16} />
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="input pl-10 w-64 h-9 text-xs"
          />
        </div>

        <button className="text-fg-tertiary hover:text-fg-primary transition-colors">
          <Bell size={20} />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-border-subtle">
          <div className="text-right">
            <p className="text-body-sm font-medium text-fg-primary leading-none mb-1">{userName}</p>
            <p className="text-[10px] text-fg-tertiary uppercase tracking-wider">Active Now</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-surface-raised border border-border-default flex items-center justify-center text-accent-glow font-display text-xs font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
