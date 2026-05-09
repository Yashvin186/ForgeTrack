import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-void flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-danger-bg border border-danger-border flex items-center justify-center text-danger mb-6 shadow-2xl">
            <AlertTriangle size={40} />
          </div>
          <h1 className="text-3xl font-black text-fg-primary tracking-tight mb-3">Something went wrong</h1>
          <p className="text-fg-secondary max-w-md mb-8 leading-relaxed">
            The application encountered an unexpected error. Don't worry, your data is safe. 
            Try refreshing the page or going back.
          </p>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-raised border border-border-default text-fg-primary font-bold hover:bg-surface transition-all"
            >
              <RefreshCcw size={18} />
              Reload Application
            </button>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="px-6 py-3 rounded-xl bg-accent-glow text-white font-bold hover:opacity-90 transition-all shadow-raised"
            >
              Try Again
            </button>
          </div>
          {import.meta.env.DEV && (
            <div className="mt-12 p-6 rounded-2xl bg-surface-inset border border-border-subtle text-left max-w-2xl w-full overflow-auto">
              <p className="text-[10px] text-fg-tertiary uppercase tracking-widest font-bold mb-2">Error Details (Dev Only)</p>
              <code className="text-xs text-danger font-mono block">
                {this.state.error?.toString()}
              </code>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
