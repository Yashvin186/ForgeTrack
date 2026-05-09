
import { CheckCircle2, AlertCircle, LayoutDashboard } from 'lucide-react';

const DevTokens = () => {
  return (
    <div className="app-main p-8 md:p-12 lg:p-16">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <header className="space-y-4">
          <div className="text-label text-fg-tertiary flex items-center gap-2">
            <LayoutDashboard size={14} />
            Development Tools
          </div>
          <h1 className="text-display-lg">Design Tokens</h1>
          <p className="text-body-lg text-fg-secondary max-w-2xl">
            This page verifies that the ForgeTrack design system tokens, typography, 
            and core components are correctly implemented in the Tailwind configuration.
          </p>
        </header>

        {/* Typography Section */}
        <section className="space-y-6">
          <h2 className="text-h2 border-b border-border-subtle pb-2">Typography</h2>
          <div className="space-y-8">
            <div className="space-y-1">
              <span className="text-label text-fg-tertiary">text-display-hero</span>
              <p className="text-display-hero">98.5%</p>
            </div>
            <div className="space-y-1">
              <span className="text-label text-fg-tertiary">text-display-lg</span>
              <p className="text-display-lg">The Forge Bootcamp</p>
            </div>
            <div className="space-y-1">
              <span className="text-label text-fg-tertiary">text-display-md</span>
              <p className="text-display-md">Attendance Tracking</p>
            </div>
            <div className="space-y-1">
              <span className="text-label text-fg-tertiary">text-display-sm</span>
              <p className="text-display-sm">Card Value $1,234.56</p>
            </div>
          </div>
        </section>

        {/* Components Section */}
        <section className="space-y-6">
          <h2 className="text-h2 border-b border-border-subtle pb-2">Components</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card & Buttons */}
            <div className="card p-8 space-y-6">
              <div className="space-y-2">
                <span className="text-label text-fg-tertiary">Glass Card & Buttons</span>
                <h3 className="text-h3">Primary Actions</h3>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <button className="btn-primary">Primary Button</button>
                <button className="btn-secondary">Secondary Button</button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-label text-fg-secondary">Input Field</label>
                  <input 
                    type="text" 
                    className="input w-full" 
                    placeholder="Enter USN (e.g. 4SH24CS001)" 
                  />
                </div>
              </div>
            </div>

            {/* Status & Indicators */}
            <div className="card p-8 space-y-6">
              <div className="space-y-2">
                <span className="text-label text-fg-tertiary">Status & Badges</span>
                <h3 className="text-h3">Semantic Colors</h3>
              </div>
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <span className="pill pill-success">
                    <CheckCircle2 size={12} />
                    Present
                  </span>
                  <span className="pill pill-danger">
                    <AlertCircle size={12} />
                    Absent
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-body text-fg-secondary">Present Indicator</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-danger" />
                    <span className="text-body text-fg-secondary">Absent Indicator</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-fg-tertiary/40" />
                    <span className="text-body text-fg-secondary">No Record</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Layout Verification */}
        <section className="space-y-6">
          <h2 className="text-h2 border-b border-border-subtle pb-2">Glow & Grid</h2>
          <div className="card card-hero dot-grid min-h-[200px] flex items-center justify-center">
            <div className="text-center space-y-2">
              <p className="text-display-sm">Cosmic Canvas</p>
              <p className="text-body text-fg-tertiary">Verifying the radial glow and dot grid overlay</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DevTokens;
