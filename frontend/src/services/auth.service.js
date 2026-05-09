import { supabase } from '../lib/supabaseClient';

const mapAuthError = (error) => {
  if (!error) return null;
  const msg = error.message.toLowerCase();
  
  if (msg.includes('rate limit')) return 'Too many attempts. Please wait a minute and try again.';
  if (msg.includes('invalid login credentials')) return 'Invalid email or password.';
  if (msg.includes('user already exists')) return 'An account with this email already exists.';
  if (msg.includes('email not confirmed')) return 'Please confirm your email address first.';
  if (msg.includes('network error')) return 'Network issue. Please check your connection.';
  
  return error.message;
};

export const authService = {
  async signIn(email, password) {
    console.log(`[Auth] Attempting sign in for: ${email}`);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      console.error('[Auth] Sign in error:', error.message);
      return { data: null, error: { ...error, friendlyMessage: mapAuthError(error) } };
    }

    console.log('[Auth] Sign in successful:', data.user.email);
    return { data, error: null };
  },

  async signUp(email, password, metadata) {
    console.log(`[Auth] Attempting sign up for: ${email}`, metadata);
    
    // Check if user exists in public.users first to avoid redundant auth calls if possible
    // (Note: This is a partial check, the real check is in Supabase Auth)
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        // Disable email confirmation for dev if needed, 
        // but it's mainly a server-side setting.
      }
    });
    
    if (error) {
      console.error('[Auth] Sign up error:', error.message);
      return { data: null, error: { ...error, friendlyMessage: mapAuthError(error) } };
    }

    console.log('[Auth] Sign up success:', data);
    
    // If user is already created but not confirmed, data.user might still exist
    if (data.user) {
      // User requested manual insertion into public.users
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          role: metadata.role || 'student',
          display_name: metadata.display_name || metadata.name || data.user.email,
          student_id: metadata.student_id || null
        });

      if (profileError) {
        console.error('[Auth] Profile creation error:', profileError.message);
        // We don't return error here because the Auth account is already created
      }
    }

    return { data, error: null };
  },

  async signOut() {
    console.log('[Auth] Signing out');
    const response = await supabase.auth.signOut();
    return response;
  },

  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) console.error('[Auth] Get session error:', error.message);
    return session;
  },

  async getCurrentUser() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return null;

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    if (profileError) console.error('[Auth] Profile fetch error:', profileError.message);
    
    return { ...user, profile };
  },

  onAuthStateChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[Auth] State Change Event: ${event}`);
      callback(event, session);
    });
    return subscription;
  },

  async isUsersTableEmpty() {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    if (error) return false;
    return count === 0;
  },

  async getEmailByUSN(usn) {
    const { data, error } = await supabase
      .from('students')
      .select('email')
      .eq('usn', usn.toUpperCase())
      .maybeSingle();
    
    if (error || !data) return null;
    return data.email;
  },

  async updateProfile(userId, updates) {
    // We only update display_name or role in public.users
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.display_name = updates.name;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    
    if (Object.keys(dbUpdates).length === 0) return null;

    const { data, error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('[Auth] Profile update error:', error.message);
      throw error;
    }
    return data;
  }
};
