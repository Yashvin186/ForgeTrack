import { useState, useEffect } from 'react';
import { FileText, Link as LinkIcon, Video, Code, Plus, Search, ExternalLink, Trash2, Loader2 } from 'lucide-react';
import { useUser } from '../context/UserContext';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import { materialService } from '../services/material.service';
import { sessionService } from '../services/session.service';

const TYPE_META = {
  pdf:   { label: 'PDF',    icon: FileText,  color: 'text-danger  bg-danger-bg  border-danger-border'  },
  link:  { label: 'Link',   icon: LinkIcon,  color: 'text-info    bg-info-bg    border-info-border'    },
  video: { label: 'Video',  icon: Video,     color: 'text-warning bg-warning-bg border-warning-border' },
  code:  { label: 'Code',   icon: Code,      color: 'text-success bg-success-bg border-success-border' },
  slides: { label: 'Slides', icon: FileText,  color: 'text-accent-glow bg-accent-glow/10 border-accent-glow/20' },
  recording: { label: 'Recording', icon: Video, color: 'text-warning bg-warning-bg border-warning-border' },
  document: { label: 'Doc', icon: FileText, color: 'text-info bg-info-bg border-info-border' },
};

const FILTERS = ['All', 'Slides', 'Recording', 'Link', 'Document'];

export default function Materials() {
  const { role } = useUser();
  const [query,       setQuery]       = useState('');
  const [activeType,  setActiveType]  = useState('All');
  const [showModal,   setShowModal]   = useState(false);
  const [sessions,    setSessions]    = useState([]);
  const [materials,   setMaterials]   = useState([]);
  
  // ... rest of state
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    url: '',
    type: 'link',
    session_id: '',
    description: ''
  });
  
  const [loading,     setLoading]     = useState(true);
  const [toast,       setToast]       = useState(null);
  const [deleteId,    setDeleteId]    = useState(null);
  const [isAdding,    setIsAdding]    = useState(false);

  const isMentor = role === 'mentor';

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [matList, sessList] = await Promise.all([
          materialService.getAllWithSessions(),
          sessionService.getAll()
        ]);
        setMaterials(matList);
        setSessions(sessList);
        if (sessList.length > 0) {
          setNewMaterial(prev => ({ ...prev, session_id: sessList[0].id }));
        }
      } catch (err) {
        console.error('[Materials] Init error:', err);
        setToast({ message: 'Failed to load materials', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const filtered = materials.filter((m) => {
    const matchType  = activeType === 'All' || m.type.toLowerCase() === activeType.toLowerCase();
    const matchQuery = m.title.toLowerCase().includes(query.toLowerCase()) ||
                       m.sessions?.topic.toLowerCase().includes(query.toLowerCase());
    return matchType && matchQuery;
  });

  const handleAdd = async () => {
    if (!newMaterial.title || !newMaterial.url || !newMaterial.session_id) return;
    try {
      setIsAdding(true);
      await materialService.create(newMaterial);
      // Re-fetch to get the joined session data
      const updatedList = await materialService.getAllWithSessions();
      setMaterials(updatedList);
      setShowModal(false);
      setNewMaterial({
        title: '',
        url: '',
        type: 'link',
        session_id: sessions[0]?.id || '',
        description: ''
      });
      setToast({ message: 'Material added successfully!', type: 'success' });
    } catch (err) {
      console.error('[Materials] Add error:', err);
      setToast({ message: 'Failed to add material', type: 'error' });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await materialService.delete(deleteId);
      setMaterials(materials.filter(m => m.id !== deleteId));
      setDeleteId(null);
      setToast({ message: 'Material removed from library', type: 'warning' });
    } catch (err) {
      console.error('[Materials] Delete error:', err);
      setToast({ message: 'Failed to delete material', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <header className="flex justify-between items-end">
          <div className="space-y-3">
            <div className="h-4 bg-surface-raised rounded w-24" />
            <div className="h-10 bg-surface-raised rounded-xl w-64" />
          </div>
          <div className="h-12 bg-surface-raised rounded-xl w-40" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-surface-raised rounded-2xl animate-glass-shimmer" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 animate-slide-up">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] text-fg-tertiary uppercase tracking-[0.18em] font-bold mb-1">Library</p>
          <h1 className="text-display-md text-fg-primary tracking-tight">Materials</h1>
          <p className="text-fg-secondary mt-1">All bootcamp resources, slides, and recordings in one place.</p>
        </div>
        {isMentor && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold shadow-raised shrink-0"
          >
            <Plus size={16} /> Add Material
          </button>
        )}
      </header>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-tertiary" />
          <input
            type="text"
            placeholder="Search materials…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input pl-9 h-10 text-sm w-64"
          />
        </div>
        <div className="flex items-center gap-2 bg-surface-inset p-1 rounded-xl border border-border-subtle">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveType(f)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                activeType === f
                  ? 'bg-surface-raised text-fg-primary shadow-card border border-border-default'
                  : 'text-fg-tertiary hover:text-fg-secondary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-fg-tertiary font-bold uppercase tracking-widest ml-auto">
          {filtered.length} item{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full card p-20 flex flex-col items-center justify-center text-center space-y-6 border-dashed border-border-default bg-surface-raised/10 rounded-[3rem]">
             <div className="w-20 h-20 rounded-3xl bg-surface-raised border border-border-subtle flex items-center justify-center text-fg-tertiary">
                <FileText size={32} />
             </div>
             <div className="max-w-sm mx-auto">
                <h3 className="text-xl font-bold text-fg-primary">No Materials Found</h3>
                <p className="text-sm text-fg-secondary mt-2">
                  {query ? "No results match your search criteria. Try a different query." : "There are no learning materials uploaded yet for this bootcamp."}
                </p>
                {isMentor && !query && (
                  <button onClick={() => setShowModal(true)} className="btn-primary mt-8 px-10 py-3.5 rounded-xl text-sm font-black shadow-raised">
                    Upload First Material
                  </button>
                )}
             </div>
          </div>
        ) : filtered.map((m) => {
          const meta = TYPE_META[m.type.toLowerCase()] || TYPE_META.document;
          const Icon = meta.icon;
          return (
            <div
              key={m.id}
              className="card border border-border-subtle rounded-2xl p-5 flex flex-col gap-4 hover:bg-surface-raised/50 transition-all hover:-translate-y-1 duration-300 group shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${meta.color} shrink-0`}>
                  <Icon size={18} />
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg border border-border-default flex items-center justify-center text-fg-tertiary hover:text-fg-primary hover:bg-surface-raised transition-colors"
                    title="Open"
                  >
                    <ExternalLink size={14} />
                  </a>
                  {isMentor && (
                    <button
                      onClick={() => setDeleteId(m.id)}
                      className="w-8 h-8 rounded-lg border border-border-default flex items-center justify-center text-fg-tertiary hover:text-danger hover:bg-danger-bg hover:border-danger-border transition-all"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <p className="text-sm font-bold text-fg-primary group-hover:text-accent-glow transition-colors leading-snug">
                  {m.title}
                </p>
                <p className="text-[11px] text-fg-tertiary mt-1 line-clamp-1">{m.sessions?.topic || 'General Resource'}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${meta.color}`}>
                   {meta.label}
                </span>
                <div className="flex items-center gap-2 text-[10px] text-fg-tertiary font-bold uppercase tracking-wider">
                  <span>{new Date(m.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title="Add Material"
        footer={(
          <>
            <button onClick={() => setShowModal(false)} className="px-6 py-2 text-sm font-bold text-fg-tertiary">
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={isAdding}
              className="btn-primary flex items-center gap-2 px-8 py-2 rounded-xl text-sm font-bold shadow-raised"
            >
              {isAdding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {isAdding ? 'Adding...' : 'Add Material'}
            </button>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">Session</label>
            <select 
              className="input w-full h-12"
              value={newMaterial.session_id}
              onChange={(e) => setNewMaterial({ ...newMaterial, session_id: e.target.value })}
            >
              {sessions.map(s => (
                <option key={s.id} value={s.id}>{s.topic} ({new Date(s.date).toLocaleDateString()})</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">Title</label>
            <input
              className="input w-full h-12"
              placeholder="e.g. Week 3 Slides"
              value={newMaterial.title}
              onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">Type</label>
               <select 
                 className="input w-full h-12"
                 value={newMaterial.type}
                 onChange={(e) => setNewMaterial({ ...newMaterial, type: e.target.value })}
               >
                 <option value="slides">Slides</option>
                 <option value="recording">Recording</option>
                 <option value="link">Link</option>
                 <option value="document">Document</option>
                 <option value="code">Code</option>
               </select>
             </div>
             <div className="space-y-2">
               <label className="text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">Description / Size</label>
               <input
                 className="input w-full h-12"
                 placeholder="e.g. 4.2 MB or Github repo"
                 value={newMaterial.description}
                 onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
               />
             </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">URL / Link</label>
            <input
              className="input w-full h-12"
              placeholder="https://..."
              value={newMaterial.url}
              onChange={(e) => setNewMaterial({ ...newMaterial, url: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmDialog 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Material?"
        message="Are you sure you want to remove this material from the library? This action cannot be undone."
      />

      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}
