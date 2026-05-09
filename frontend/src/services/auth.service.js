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
    console.log(`[Auth] 🔑 Initiating login sequence for: ${email}`);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('[Auth] ❌ Supabase Auth error:', error.message);
        return { data: null, error: { ...error, friendlyMessage: mapAuthError(error) } };
      }

      if (!data.session || !data.user) {
        console.error('[Auth] ❌ Partial auth success: Session or User missing');
        return { data: null, error: { message: 'Incomplete session data received', friendlyMessage: 'Authentication failed: Incomplete session.' } };
      }

      console.log('[Auth] ✅ Login successful. User:', data.user.id, 'Role:', data.user.user_metadata?.role);
      return { data, error: null };
    } catch (err) {
      console.error('[Auth] 💥 Fatal Login Exception:', err.message);
      return { data: null, error: { message: err.message, friendlyMessage: 'The authentication server did not respond. Please try again.' } };
    }
  },

  async signUp(email, password, metadata) {
    console.log(`[Auth] Attempting sign up for: ${email}`, metadata);
    
    try {
      // 1. Create the Auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          // Redirect URL if needed, but using local confirmation for now
          emailRedirectTo: `${window.location.origin}/login`
        }
      });
      
      if (error) {
        console.error('[Auth] Supabase Auth sign up error:', error.message);
        return { data: null, error: { ...error, friendlyMessage: mapAuthError(error) } };
      }

      const user = data.user;
      if (!user) {
        console.warn('[Auth] Sign up success but no user returned (might need confirmation)');
        return { data, error: null };
      }

      console.log('[Auth] Auth account created. Syncing profile to public.users...', user.id);

      // 2. Insert into public.users
      // We do this to ensure RLS and application logic works with a unified users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          role: metadata.role || 'student',
          display_name: metadata.display_name || metadata.name || user.email,
          student_id: metadata.student_id || null,
          created_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('[Auth] Profile sync failed:', profileError.message);
        // Note: We don't fail the whole signup because Auth account exists, 
        // but UserContext will fallback to metadata.
      }

      // 3. Create student record if needed
      if (metadata.role === 'student' && !metadata.student_id) {
        console.log('[Auth] Student signup detected without existing record. Creating student entry...');
        const { data: newStudent, error: studentError } = await supabase
          .from('students')
          .insert({
            name: metadata.display_name || metadata.name,
            email: user.email,
            usn: (metadata.usn || '').toUpperCase(),
            branch_code: 'CS', // Default for new signups
            is_active: true,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (studentError) {
          console.error('[Auth] Student record creation failed:', studentError.message);
        } else if (newStudent) {
          console.log('[Auth] Student record created successfully:', newStudent.id);
          // Update the users table with the new student_id
          await supabase
            .from('users')
            .update({ student_id: newStudent.id })
            .eq('id', user.id);
        }
      }

      console.log('[Auth] Full Signup sequence completed for:', user.email);
      return { data, error: null };

    } catch (err) {
      console.error('[Auth] Critical Signup Exception:', err);
      return { data: null, error: { message: err.message, friendlyMessage: 'Account creation failed. Please try again.' } };
    }
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
    console.log('[Auth] Checking if users table is empty...');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    try {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      clearTimeout(timeout);
      if (error) {
        console.warn('[Auth] isUsersTableEmpty error:', error.message);
        return false;
      }
      return count === 0;
    } catch (err) {
      console.warn('[Auth] isUsersTableEmpty exception:', err.message);
      return false;
    }
  },

  async getEmailByUSN(usn) {
    console.log(`[Auth] Mapping USN ${usn} to email...`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const { data, error } = await supabase
        .from('students')
        .select('email')
        .eq('usn', usn.toUpperCase())
        .maybeSingle();
      
      clearTimeout(timeout);
      if (error || !data) {
        console.warn('[Auth] USN mapping failed or not found');
        return null;
      }
      return data.email;
    } catch (err) {
      console.error('[Auth] USN mapping exception:', err.message);
      return null;
    }
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
