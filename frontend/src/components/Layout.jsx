/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { Menu, X } from 'lucide-react';

export default function Layout({ role }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-void text-fg-primary overflow-hidden relative">
      
      {/* ── Desktop Sidebar ───────────────────────────────────── */}
      <div className="hidden lg:flex h-full">
        <Sidebar role={role} />
      </div>

      {/* ── Mobile Sidebar Drawer ─────────────────────────────── */}
      <div 
        className={`fixed inset-0 z-[100] lg:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-void/80 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Drawer Content */}
        <div 
          className={`absolute inset-y-0 left-0 w-[280px] bg-canvas border-r border-border-strong transform transition-transform duration-300 ease-out ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col">
            <div className="p-6 flex items-center justify-between border-b border-border-subtle">
              <span className="font-display font-black text-xl tracking-tight">ForgeTrack</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg bg-surface-raised border border-border-default text-fg-tertiary"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar role={role} isMobile />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content Area ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-void relative z-0">
        
        {/* Mobile Header (Sticky) */}
        <header className="lg:hidden h-[70px] border-b border-border-subtle bg-canvas/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 sticky top-0 z-50">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2.5 rounded-xl bg-surface-raised border border-border-default text-fg-tertiary active:scale-95 transition-all"
          >
            <Menu size={22} />
          </button>
          <span className="font-display font-black text-lg tracking-tight">ForgeTrack</span>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        <div className="hidden lg:block">
           <TopBar role={role} />
        </div>
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden app-main dot-grid relative" id="main-scroll-area">
          <div className="max-w-[1440px] mx-auto pt-6 lg:pt-8 px-5 md:px-8 lg:px-12 pb-24 min-h-full flex flex-col">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
