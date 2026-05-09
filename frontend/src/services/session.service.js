import { supabase } from '../lib/supabaseClient';

export const sessionService = {
  async getAll() {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) return [];
    return data || [];
  },

  async getLatest() {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) return null;
    return data;
  },

  async getToday() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('date', today)
      .maybeSingle();
    
    if (error) return null;
    return data;
  },

  async getCount() {
    const { count, error } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true });
    
    if (error) return 0;
    return count || 0;
  },

  async create(payload) {
    const { data, error } = await supabase
      .from('sessions')
      .insert([payload])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
