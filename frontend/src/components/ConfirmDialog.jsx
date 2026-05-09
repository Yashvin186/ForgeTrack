import { X, AlertTriangle } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Are you sure?', 
  message = 'This action cannot be undone.', 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger' // danger, warning, info
}) {
  const accentColor = 
    type === 'danger' ? 'bg-danger text-white' : 
    type === 'warning' ? 'bg-warning text-white' : 
    'bg-accent-glow text-white';

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title}
      footer={(
        <>
          <button 
            onClick={onClose}
            className="px-6 py-2 text-sm font-bold text-fg-tertiary hover:text-fg-primary transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }}
            className={`px-8 py-2 rounded-xl text-sm font-bold shadow-lg transition-all hover:scale-105 active:scale-95 ${accentColor}`}
          >
            {confirmText}
          </button>
        </>
      )}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center ${type === 'danger' ? 'bg-danger-bg text-danger' : type === 'warning' ? 'bg-warning-bg text-warning' : 'bg-accent-glow/10 text-accent-glow'}`}>
          <AlertTriangle size={24} />
        </div>
        <div>
          <p className="text-fg-secondary leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
}
