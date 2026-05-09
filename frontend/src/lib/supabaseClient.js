import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing credentials in .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('[Supabase] Supabase connected successfully');

// Debug helper
export const testConnection = async () => {
  console.log('[Supabase] Testing connection to "students" table...');
  const { data, error, status } = await supabase.from('students').select('*').limit(1);
  console.log('[Supabase] Response Status:', status);
  if (error) {
    console.error('[Supabase] Connection error:', error.message);
    return false;
  }
  console.log('[Supabase] Connection success! Data:', data);
  return true;
};
