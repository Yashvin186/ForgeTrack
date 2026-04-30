import { supabase } from '../lib/supabase';

export const attendanceService = {
  async getBySession(sessionId) {
    const { data, error } = await supabase
      .from('attendance')
      .select('*, students(name, usn, branch_code)')
      .eq('session_id', sessionId);
    if (error) throw error;
    return data;
  },

  async getByStudent(studentId) {
    const { data, error } = await supabase
      .from('attendance')
      .select('session_id, present, sessions(*)')
      .eq('student_id', studentId);
    if (error) throw error;
    return data;
  },

  async getAllRecords() {
    const { data, error } = await supabase
      .from('attendance')
      .select('present');
    if (error) throw error;
    return data;
  },

  async getRecentActivity(limit = 5) {
    const { data, error } = await supabase
      .from('attendance')
      .select('marked_at, marked_by, sessions(topic)')
      .order('marked_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },

  async upsertBatch(records) {
    const { data, error } = await supabase
      .from('attendance')
      .upsert(records, { onConflict: 'student_id,session_id' });
    if (error) throw error;
    return data;
  }
};
