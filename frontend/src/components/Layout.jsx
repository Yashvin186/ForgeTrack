import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function Layout({ role }) {
  return (
    <div className="flex h-screen bg-void text-fg-primary overflow-hidden">
      <Sidebar role={role} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar role={role} />
        
        <main className="flex-1 overflow-y-auto app-main dot-grid relative">
          <div className="max-w-[1440px] mx-auto p-8 lg:p-12">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
