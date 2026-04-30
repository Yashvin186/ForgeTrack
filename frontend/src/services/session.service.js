import { supabase } from '../lib/supabase';

export const sessionService = {
  /** Get all sessions newest first */
  async getAll() {
    const { data, error } = await supabase
      .from('sessions')
      .select('id, date, topic, duration_hours, session_type')
      .order('date', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  /** Get today's session (or null) */
  async getToday() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('date', today)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  },

  /** Get total session count */
  async getCount() {
    const { count, error } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count ?? 0;
  },

  /** Get the most recent session */
  async getLatest() {
    const { data, error } = await supabase
      .from('sessions')
      .select('id, date, topic')
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  },

  /** Create a new session */
  async create(payload) {
    const { data, error } = await supabase
      .from('sessions')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
