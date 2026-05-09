import { supabase } from '../lib/supabaseClient';

export const materialService = {
  async getAllWithSessions() {
    console.log('[Material] Fetching all materials with sessions');
    const { data, error, status } = await supabase
      .from('materials')
      .select('*, sessions(*)')
      .order('created_at', { ascending: false });
    
    console.log(`[Material] Status: ${status}`, { data, error });
    if (error) {
      console.error('[Material] Error:', error.message);
      return [];
    }
    return data ?? [];
  },

  async create(materialData) {
    console.log('[Material] Creating new material', materialData);
    const { data, error, status } = await supabase
      .from('materials')
      .insert(materialData)
      .select()
      .single();
    
    console.log(`[Material] Status: ${status}`, { data, error });
    if (error) {
      console.error('[Material] Error:', error.message);
      throw error;
    }
    return data;
  },

  async delete(id) {
    console.log(`[Material] Deleting material: ${id}`);
    const { error, status } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);
    
    console.log(`[Material] Status: ${status}`, { error });
    if (error) {
      console.error('[Material] Error:', error.message);
      throw error;
    }
  }
};
