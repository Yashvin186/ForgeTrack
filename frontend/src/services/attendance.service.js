import { supabase } from '../lib/supabaseClient';

// Simple in-memory cache
const cache = {
  detailedRecords: null,
  recentActivity: new Map(),
  lastFetch: 0,
  TTL: 15000 // 15 second TTL
};

export const attendanceService = {
  async getBySession(sessionId) {
    const { data, error } = await supabase
      .from('attendance')
      .select('*, students(name, usn, branch_code)')
      .eq('session_id', sessionId);
    
    if (error) return [];
    return data ?? [];
  },

  async getByStudent(studentId) {
    const { data, error } = await supabase
      .from('attendance')
      .select('session_id, present, sessions(*)')
      .eq('student_id', studentId);
    
    if (error) return [];
    return data ?? [];
  },

  async getAllRecords() {
    const { data, error } = await supabase
      .from('attendance')
      .select('present');
    
    if (error) return [];
    return data ?? [];
  },

  async getAllRecordsDetailed(force = false) {
    if (!force && cache.detailedRecords && (Date.now() - cache.lastFetch < cache.TTL)) {
      return cache.detailedRecords;
    }

    const { data, error } = await supabase
      .from('attendance')
      .select('id, present, student_id, session_id, students(name)');
    
    if (error) return cache.detailedRecords || [];

    cache.detailedRecords = data ?? [];
    cache.lastFetch = Date.now();
    return cache.detailedRecords;
  },

  async getRecentActivity(limit = 5, force = false) {
    if (!force && cache.recentActivity.has(limit)) {
       return cache.recentActivity.get(limit);
    }
    const { data, error } = await supabase
      .from('attendance')
      .select('marked_at, marked_by, sessions(topic)')
      .order('marked_at', { ascending: false })
      .limit(limit);
    
    if (error) return [];
    cache.recentActivity.set(limit, data ?? []);
    return data ?? [];
  },

  async upsertBatch(records) {
    const { data, error } = await supabase
      .from('attendance')
      .upsert(records, { onConflict: 'student_id,session_id' });
    
    if (error) throw error;
    return data ?? [];
  }
};
