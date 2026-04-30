import { useState } from 'react';
import { FileText, Link as LinkIcon, Video, Code, Plus, Search, ExternalLink, X } from 'lucide-react';

const TYPE_META = {
  pdf:   { label: 'PDF',    icon: FileText,  color: 'text-danger  bg-danger-bg  border-danger-border'  },
  link:  { label: 'Link',   icon: LinkIcon,  color: 'text-info    bg-info-bg    border-info-border'    },
  video: { label: 'Video',  icon: Video,     color: 'text-warning bg-warning-bg border-warning-border' },
  code:  { label: 'Code',   icon: Code,      color: 'text-success bg-success-bg border-success-border' },
};

const MATERIALS = [
  { id: 1,  title: 'ML Productionization Slides',    type: 'pdf',   session: 'Productionizing ML Models',  size: '4.2 MB', date: '2026-04-30', url: '#' },
  { id: 2,  title: 'LLM 101 Reference Notebook',     type: 'code',  session: 'Large Language Models 101',  size: '18 KB',  date: '2026-04-28', url: '#' },
  { id: 3,  title: 'ReAct Pattern Deep Dive',        type: 'link',  session: 'ReAct Agent Pattern',        size: '—',      date: '2026-04-26', url: '#' },
  { id: 4,  title: 'AI Safety Lecture Recording',    type: 'video', session: 'AI Safety and Ethics',       size: '1.1 GB', date: '2026-04-24', url: '#' },
  { id: 5,  title: 'RAG Architecture Diagram',       type: 'pdf',   session: 'RAG Fundamentals',           size: '820 KB', date: '2026-04-22', url: '#' },
  { id: 6,  title: 'Vector DB Cheatsheet',           type: 'pdf',   session: 'Vector Databases',           size: '1.5 MB', date: '2026-04-20', url: '#' },
  { id: 7,  title: 'Fine-tuning Colab Notebook',     type: 'code',  session: 'Fine-Tuning LLMs',           size: '42 KB',  date: '2026-04-18', url: '#' },
  { id: 8,  title: 'Eval Metrics Reference Sheet',   type: 'pdf',   session: 'Model Evaluation Metrics',   size: '680 KB', date: '2026-04-16', url: '#' },
];

const FILTERS = ['All', 'PDF', 'Code', 'Link', 'Video'];

export default function Materials() {
  const [query,       setQuery]       = useState('');
  const [activeType,  setActiveType]  = useState('All');
  const [showModal,   setShowModal]   = useState(false);
  const [newTitle,    setNewTitle]    = useState('');
  const [newUrl,      setNewUrl]      = useState('');

  const filtered = MATERIALS.filter((m) => {
    const matchType  = activeType === 'All' || m.type === activeType.toLowerCase();
    const matchQuery = m.title.toLowerCase().includes(query.toLowerCase()) ||
                       m.session.toLowerCase().includes(query.toLowerCase());
    return matchType && matchQuery;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] text-fg-tertiary uppercase tracking-[0.18em] font-bold mb-1">Library</p>
          <h1 className="text-display-md text-fg-primary tracking-tight">Materials</h1>
          <p className="text-fg-secondary mt-1">All bootcamp resources, slides, and recordings in one place.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold shadow-raised shrink-0"
        >
          <Plus size={16} /> Add Material
        </button>
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((m) => {
          const meta = TYPE_META[m.type];
          const Icon = meta.icon;
          return (
            <div
              key={m.id}
              className="card border border-border-subtle rounded-2xl p-6 flex flex-col gap-4 hover:bg-surface-raised transition-colors group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${meta.color} shrink-0`}>
                  <Icon size={18} />
                </div>
                <a
                  href={m.url}
                  className="w-8 h-8 rounded-lg border border-border-default flex items-center justify-center text-fg-tertiary hover:text-fg-primary hover:bg-surface-raised transition-colors ml-auto"
                  title="Open"
                >
                  <ExternalLink size={14} />
                </a>
              </div>

              <div className="flex-1">
                <p className="text-sm font-bold text-fg-primary group-hover:text-accent-glow transition-colors leading-snug">
                  {m.title}
                </p>
                <p className="text-[11px] text-fg-tertiary mt-1 line-clamp-1">{m.session}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${meta.color}`}>
                  {meta.label}
                </span>
                <div className="flex items-center gap-3 text-[11px] text-fg-tertiary font-mono">
                  <span>{m.size}</span>
                  <span>·</span>
                  <span>{new Date(m.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-fg-tertiary">
          <FileText size={40} className="mx-auto mb-4 opacity-30" />
          <p className="font-bold">No materials found</p>
          <p className="text-sm mt-1">Try a different search or filter.</p>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card border border-border-default rounded-2xl p-8 w-full max-w-md space-y-6 shadow-raised">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-fg-primary">Add Material</h2>
              <button onClick={() => setShowModal(false)} className="text-fg-tertiary hover:text-fg-primary transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">Title</label>
                <input
                  className="input w-full"
                  placeholder="e.g. Week 3 Slides"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-fg-tertiary uppercase tracking-widest font-bold">URL / Link</label>
                <input
                  className="input w-full"
                  placeholder="https://..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 rounded-xl text-sm font-bold py-3">
                Cancel
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="btn-primary flex-1 rounded-xl text-sm font-bold py-3 shadow-raised"
              >
                Add Material
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
