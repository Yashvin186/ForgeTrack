import { supabase } from '../lib/supabase';

export const studentService = {
  /** Get all active students ordered by name */
  async getAll() {
    const { data, error } = await supabase
      .from('students')
      .select('id, usn, name, email, branch_code')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return data ?? [];
  },

  /** Count of active students */
  async getCount() {
    const { count, error } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    if (error) throw error;
    return count ?? 0;
  },

  /** Fetch one student by id */
  async getById(id) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  /** Search by name or USN */
  async search(query) {
    const { data, error } = await supabase
      .from('students')
      .select('id, usn, name, email, branch_code')
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,usn.ilike.%${query}%`)
      .order('name');
    if (error) throw error;
    return data ?? [];
  },
};
