import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Bell, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { sessionService } from '../services/session.service';

export default function UpcomingSessions() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    async function fetchSessions() {
      try {
        setLoading(true);
        const all = await sessionService.getAll();
        // Filter for future sessions
        const today = new Date();
        today.setHours(0,0,0,0);
        const upcoming = all.filter(s => new Date(s.date) >= today)
                          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setSessions(upcoming);
      } catch (err) {
        console.error('[Upcoming] Error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, []);

  if (loading) {
    return (
      <div className="space-y-10 animate-fade-in">
        <div className="h-4 bg-surface-raised rounded w-32" />
        <div className="h-10 bg-surface-raised rounded-xl w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-surface-raised rounded-3xl animate-glass-shimmer" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16 animate-slide-up">
      <header>
        <p className="text-[11px] text-fg-tertiary uppercase tracking-[0.18em] font-bold mb-1">Schedule</p>
        <h1 className="text-display-md text-fg-primary tracking-tight">Upcoming Sessions</h1>
        <p className="text-fg-secondary mt-1">Plan your week. Don't miss these critical bootcamp sessions.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map((s, i) => {
          const date = new Date(s.date);
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <div 
              key={s.id} 
              className={`card p-8 rounded-[2rem] border transition-all hover:scale-[1.02] duration-300 relative overflow-hidden group ${
                isToday ? 'border-accent-glow bg-accent-glow/5 shadow-[0_20px_50px_rgba(var(--accent-rgb),0.1)]' : 'border-border-subtle hover:border-border-default'
              }`}
            >
              {isToday && (
                <div className="absolute top-4 right-6 flex items-center gap-1.5 px-3 py-1 bg-accent-glow rounded-full text-[10px] font-black uppercase text-black tracking-widest animate-pulse">
                  <Sparkles size={10} /> Today
                </div>
              )}

              <div className="space-y-6">
                {/* Date Header */}
                <div className="flex items-center gap-4">
                   <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border ${isToday ? 'bg-accent-glow border-accent-glow text-black' : 'bg-surface-inset border-border-subtle text-fg-primary'}`}>
                      <span className="text-[10px] uppercase font-black leading-none mb-1">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="text-xl font-black leading-none">{date.getDate()}</span>
                   </div>
                   <div>
                      <p className="text-[10px] text-fg-tertiary uppercase tracking-widest font-black">{date.toLocaleDateString('en-US', { weekday: 'long' })}</p>
                      <p className="text-sm font-bold text-fg-secondary">{s.duration_hours} Hour Session</p>
                   </div>
                </div>

                {/* Topic */}
                <div className="space-y-2">
                   <h3 className="text-xl font-bold text-fg-primary leading-tight group-hover:text-accent-glow transition-colors">{s.topic}</h3>
                   <div className="flex items-center gap-4 pt-2">
                      <div className="flex items-center gap-1.5 text-xs text-fg-tertiary font-medium">
                         <Clock size={14} className="text-accent-glow" /> Scheduled
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-fg-tertiary font-medium">
                         <MapPin size={14} className="text-accent-glow" /> The Forge
                      </div>
                   </div>
                </div>

                {/* Footer Action */}
                <div className="pt-6 border-t border-border-subtle flex items-center justify-between">
                   <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-fg-tertiary hover:text-accent-glow transition-colors">
                      <Bell size={14} /> Remind Me
                   </button>
                   <ChevronRight size={18} className="text-fg-tertiary group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}

        {sessions.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-border-default rounded-[2rem]">
             <Calendar size={48} className="mx-auto mb-4 opacity-10 text-fg-tertiary" />
             <h3 className="text-lg font-bold text-fg-primary">No upcoming sessions</h3>
             <p className="text-sm text-fg-secondary mt-1">Check back later for the next schedule update.</p>
          </div>
        )}
      </div>

      {/* Quick Tips */}
      <div className="card p-8 rounded-3xl border border-border-subtle bg-surface-raised/20 flex flex-col md:flex-row items-center gap-8">
         <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center text-success shrink-0">
            <CheckCircle2 size={32} />
         </div>
         <div className="flex-1 text-center md:text-left">
            <h4 className="text-lg font-bold text-fg-primary">Keep your streak alive!</h4>
            <p className="text-sm text-fg-secondary mt-1">Attending consecutive sessions builds momentum. Students with a 5+ session streak are 3x more likely to finish their capstone projects early.</p>
         </div>
         <button className="btn-primary px-8 py-3 rounded-xl text-sm font-bold shadow-raised whitespace-nowrap">View Curriculum</button>
      </div>
    </div>
  );
}
