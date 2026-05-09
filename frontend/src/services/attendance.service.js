import { supabase } from '../lib/supabaseClient';

export const attendanceService = {
  async getBySession(sessionId) {
    console.log(`[Attendance] Fetching by session: ${sessionId}`);
    const { data, error, status } = await supabase
      .from('attendance')
      .select('*, students(name, usn, branch_code)')
      .eq('session_id', sessionId);
    
    console.log(`[Attendance] Status: ${status}`, { data, error });
    if (error) {
      console.error('[Attendance] Error:', error.message);
      return [];
    }
    return data ?? [];
  },

  async getByStudent(studentId) {
    console.log(`[Attendance] Fetching by student: ${studentId}`);
    const { data, error, status } = await supabase
      .from('attendance')
      .select('session_id, present, sessions(*)')
      .eq('student_id', studentId);
    
    console.log(`[Attendance] Status: ${status}`, { data, error });
    if (error) {
      console.error('[Attendance] Error:', error.message);
      return [];
    }
    return data ?? [];
  },

  async getAllRecords() {
    console.log('[Attendance] Fetching all records (present field)');
    const { data, error, status } = await supabase
      .from('attendance')
      .select('present');
    
    console.log(`[Attendance] Status: ${status}`, { data, error });
    if (error) {
      console.error('[Attendance] Error:', error.message);
      return [];
    }
    return data ?? [];
  },

  async getRecentActivity(limit = 5) {
    console.log(`[Attendance] Fetching recent activity, limit: ${limit}`);
    const { data, error, status } = await supabase
      .from('attendance')
      .select('marked_at, marked_by, sessions(topic)')
      .order('marked_at', { ascending: false })
      .limit(limit);
    
    console.log(`[Attendance] Status: ${status}`, { data, error });
    if (error) {
      console.error('[Attendance] Error:', error.message);
      return [];
    }
    return data ?? [];
  },

  async upsertBatch(records) {
    console.log(`[Attendance] Upserting batch of ${records.length} records`);
    const { data, error, status } = await supabase
      .from('attendance')
      .upsert(records, { onConflict: 'student_id,session_id' });
    
    console.log(`[Attendance] Status: ${status}`, { data, error });
    if (error) {
      console.error('[Attendance] Error:', error.message);
      throw error;
    }
    return data ?? [];
  }
};
