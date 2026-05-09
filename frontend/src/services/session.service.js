import { supabase } from '../lib/supabaseClient';

export const sessionService = {
  /** Get all sessions newest first */
  async getAll() {
    console.log('[Session] Fetching all sessions');
    const { data, error, status } = await supabase
      .from('sessions')
      .select('id, date, topic, duration_hours, session_type')
      .order('date', { ascending: false });
    
    console.log(`[Session] Status: ${status}`, { data, error });
    if (error) {
      console.error('[Session] Error:', error.message);
      return [];
    }
    return data ?? [];
  },

  /** Get today's session (or null) */
  async getToday() {
    const today = new Date().toISOString().split('T')[0];
    console.log(`[Session] Fetching session for today: ${today}`);
    const { data, error, status } = await supabase
      .from('sessions')
      .select('*')
      .eq('date', today)
      .maybeSingle();
    
    console.log(`[Session] Status: ${status}`, { data, error });
    if (error) {
      console.error('[Session] Error:', error.message);
      return null;
    }
    return data ?? null;
  },

  /** Get total session count */
  async getCount() {
    console.log('[Session] Fetching total count');
    const { count, error, status } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true });
    
    console.log(`[Session] Status: ${status}`, { count, error });
    if (error) {
      console.error('[Session] Error:', error.message);
      return 0;
    }
    return count ?? 0;
  },

  /** Get the most recent session */
  async getLatest() {
    console.log('[Session] Fetching latest session');
    const { data, error, status } = await supabase
      .from('sessions')
      .select('id, date, topic')
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    console.log(`[Session] Status: ${status}`, { data, error });
    if (error) {
      console.error('[Session] Error:', error.message);
      return null;
    }
    return data ?? null;
  },

  /** Create a new session */
  async create(payload) {
    console.log('[Session] Creating new session', payload);
    const { data, error, status } = await supabase
      .from('sessions')
      .insert(payload)
      .select()
      .single();
    
    console.log(`[Session] Status: ${status}`, { data, error });
    if (error) {
      console.error('[Session] Error:', error.message);
      throw error;
    }
    return data;
  },
};
