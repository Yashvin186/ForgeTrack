import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';

const TOAST_TYPES = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-success-bg',
    border: 'border-success-border',
    text: 'text-success',
    accent: 'bg-success'
  },
  error: {
    icon: XCircle,
    bg: 'bg-danger-bg',
    border: 'border-danger-border',
    text: 'text-danger',
    accent: 'bg-danger'
  },
  warning: {
    icon: AlertCircle,
    bg: 'bg-warning-bg',
    border: 'border-warning-border',
    text: 'text-warning',
    accent: 'bg-warning'
  }
};

export default function Toast({ message, type = 'success', duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);
  const { icon: Icon, bg, border, text, accent } = TOAST_TYPES[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`fixed bottom-8 right-8 z-[100] transition-all duration-300 transform ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'
      }`}
    >
      <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl border ${bg} ${border} shadow-2xl min-w-[320px]`}>
        <div className={`w-10 h-10 rounded-xl ${accent} flex items-center justify-center shrink-0 shadow-lg shadow-${type}/20`}>
          <Icon className="text-white" size={20} />
        </div>
        
        <div className="flex-1">
          <p className={`text-sm font-bold ${text}`}>{message}</p>
        </div>

        <button 
          onClick={() => setIsVisible(false)}
          className={`p-1.5 rounded-lg hover:bg-black/5 transition-colors ${text}`}
        >
          <X size={16} />
        </button>

        {/* Progress timer bar */}
        <div className="absolute bottom-0 left-0 h-1 rounded-full overflow-hidden w-full px-5 pb-4">
          <div 
            className={`h-full ${accent} opacity-20`}
            style={{ 
              animation: `shrink ${duration}ms linear forwards`,
              width: '100%'
            }}
          />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}} />
    </div>
  );
}
