import { FileText, Construction } from 'lucide-react';

export default function Assignments() {
  return (
    <div className="space-y-8 animate-slide-up pb-16">
      <header>
        <p className="text-[11px] text-fg-tertiary uppercase tracking-[0.18em] font-bold mb-1">Activity</p>
        <h1 className="text-display-md text-fg-primary tracking-tight">Assignments</h1>
        <p className="text-fg-secondary mt-1">Manage and grade student assignments and capstone projects.</p>
      </header>

      <div className="card border-2 border-dashed border-border-default rounded-[2rem] p-16 flex flex-col items-center justify-center text-center bg-surface-raised/20 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-accent-glow/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="w-20 h-20 bg-surface-inset border border-border-subtle rounded-2xl flex items-center justify-center text-accent-glow mb-6 shadow-card relative z-10">
          <Construction size={40} />
        </div>
        
        <h2 className="text-2xl font-bold text-fg-primary mb-2 relative z-10">Under Construction</h2>
        <p className="text-fg-secondary max-w-md relative z-10">
          The assignments module is currently being built. Soon you will be able to distribute, collect, and grade assignments directly from the ForgeTrack platform.
        </p>
        
        <button className="btn-primary mt-8 px-8 py-3 rounded-xl text-sm font-bold shadow-raised relative z-10 flex items-center gap-2" disabled>
          <FileText size={16} />
          Coming Soon
        </button>
      </div>
    </div>
  );
}
