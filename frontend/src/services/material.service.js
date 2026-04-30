import { supabase } from '../lib/supabase';

export const materialService = {
  async getAllWithSessions() {
    const { data, error } = await supabase
      .from('materials')
      .select('*, sessions(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(materialData) {
    const { data, error } = await supabase
      .from('materials')
      .insert(materialData)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
