import { supabase } from '../lib/supabaseClient';

export const studentService = {
  /** Get all active students ordered by name */
  async getAll() {
    console.log('[Student] Fetching all active students');
    const { data, error, status } = await supabase
      .from('students')
      .select('id, usn, name, email, branch_code')
      .eq('is_active', true)
      .order('name');
    
    console.log(`[Student] Status: ${status}`, { data, error });
    if (error) {
      console.error('[Student] Error:', error.message);
      return [];
    }
    return data ?? [];
  },

  /** Count of active students */
  async getCount() {
    console.log('[Student] Fetching count of active students');
    const { count, error, status } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    console.log(`[Student] Status: ${status}`, { count, error });
    if (error) {
      console.error('[Student] Error:', error.message);
      return 0;
    }
    return count ?? 0;
  },

  /** Fetch one student by id */
  async getById(id) {
    console.log(`[Student] Fetching student by ID: ${id}`);
    const { data, error, status } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();
    
    console.log(`[Student] Status: ${status}`, { data, error });
    if (error) {
      console.error('[Student] Error:', error.message);
      return null;
    }
    return data;
  },

  /** Search by name or USN */
  async search(query) {
    console.log(`[Student] Searching for: ${query}`);
    const { data, error, status } = await supabase
      .from('students')
      .select('id, usn, name, email, branch_code')
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,usn.ilike.%${query}%`)
      .order('name');
    
    console.log(`[Student] Status: ${status}`, { data, error });
    if (error) {
      console.error('[Student] Error:', error.message);
      return [];
    }
    return data ?? [];
  },
};
