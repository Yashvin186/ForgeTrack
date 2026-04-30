import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function Unauthorized() {
  return (
    <div className="app-main flex items-center justify-center p-6 text-center">
      <div className="flex flex-col items-center max-w-md">
        <div className="w-16 h-16 bg-danger-bg border border-danger-border rounded-2xl flex items-center justify-center mb-6">
          <ShieldAlert className="text-danger" size={32} />
        </div>
        
        <h1 className="text-display-sm mb-4">Access Denied</h1>
        <p className="text-fg-secondary text-body-lg mb-10">
          You don't have permission to view this page. If you think this is a mistake, please contact the Lead Mentor.
        </p>

        <Link to="/" className="btn-secondary flex items-center gap-2">
          <ArrowLeft size={18} />
          Return to Safety
        </Link>
      </div>
    </div>
  );
}
