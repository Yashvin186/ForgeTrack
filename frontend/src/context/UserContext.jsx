/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState(null);

  const isFetching = useRef(false);
  const [lastFetchedUserId, setLastFetchedUserId] = useState(null);

  const loadUserProfile = async (authUser) => {
    if (!authUser) {
      setUser(null);
      setInitializing(false);
      isFetching.current = false;
      return;
    }

    // ⚡ INSTANT OPTIMISTIC UI UPDATE
    // Set user instantly from JWT metadata to unblock UI
    if (!user || user.id !== authUser.id) {
      setUser({
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.display_name || 'User',
        // Determine role: prefer metadata, otherwise infer from email domain
        role: authUser.user_metadata?.role || (authUser.email?.endsWith('@forgebootcamp.com') ? 'mentor' : 'student'),
        avatar: (authUser.user_metadata?.display_name || 'U').charAt(0).toUpperCase(),
        bio: 'ForgeTrack Participant.',
      });
      setInitializing(false); 
    }

    if (isFetching.current) return;
    if (lastFetchedUserId === authUser.id) return;

    try {
      isFetching.current = true;
      setLastFetchedUserId(authUser.id);
      
      // Background DB sync
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profile) {
        setUser(prev => ({
          ...prev,
          name: profile.display_name || prev.name,
          role: profile.role || prev.role,
          student_id: profile.student_id,
          avatar: (profile.display_name || prev.name).charAt(0).toUpperCase(),
          bio: 'Building the next generation of engineers at The Forge Bootcamp.',
        }));
      }
    } catch {
      // Silent fail for background sync
    } finally {
      isFetching.current = false;
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        // ⚡ FAST LOCAL SESSION LOAD (No network block)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          if (mounted) {
            setUser(null);
            setInitializing(false);
          }
          return;
        }

        if (session.user && mounted) {
          await loadUserProfile(session.user);
        }
      } catch {
        if (mounted) setInitializing(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        if (session?.user && mounted) {
          await loadUserProfile(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          setUser(null);
          setLastFetchedUserId(null);
          setInitializing(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setLastFetchedUserId(null);
  };

  const value = {
    user,
    setUser,
    initializing,
    authError,
    logout,
    isAuthenticated: !!user,
    role: user?.role || 'student',
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
