import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function Layout({ role }) {
  return (
    <div className="flex h-screen bg-void text-fg-primary overflow-hidden">
      <Sidebar role={role} />
      
      <div className="flex-1 flex flex-col min-w-0 bg-void relative z-0">
        <TopBar role={role} />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden app-main dot-grid relative" id="main-scroll-area">
          <div className="max-w-[1440px] mx-auto pt-8 px-6 md:px-8 lg:px-12 pb-24 min-h-full flex flex-col">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
