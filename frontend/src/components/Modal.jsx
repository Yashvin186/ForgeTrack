import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, footer }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-void/80 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-surface-raised border border-border-default rounded-2xl shadow-raised w-full max-w-[560px] flex flex-col max-h-[90vh]">
        <div className="p-8 pb-4 flex items-center justify-between">
          <h2 className="text-h2 text-fg-primary">{title}</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-surface flex items-center justify-center text-fg-tertiary hover:text-fg-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-8 pt-4 overflow-y-auto flex-1">
          {children}
        </div>

        {footer && (
          <div className="p-8 pt-4 border-t border-border-subtle flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
