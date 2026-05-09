import { supabase } from '../lib/supabaseClient';

export const studentService = {
  async getAll() {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) return [];
    return data || [];
  },

  async getCount() {
    const { count, error } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });
    
    if (error) return 0;
    return count || 0;
  },

  async getByUSN(usn) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('usn', usn.toUpperCase())
      .maybeSingle();
    
    if (error) return null;
    return data;
  },

  async create(payload) {
    const { data, error } = await supabase
      .from('students')
      .insert([payload])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
