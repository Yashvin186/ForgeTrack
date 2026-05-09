import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let isLoadingUser = false;

    async function loadUser() {
      if (isLoadingUser) return;
      isLoadingUser = true;

      try {
        setLoading(true);
        const data = await authService.getCurrentUser();
        
        if (!isMounted) return;

        if (data) {
          console.log('[UserContext] User profile loaded:', data.email);
          setUser({
            id: data.id,
            email: data.email,
            name: data.profile?.display_name || data.user_metadata?.display_name || 'User',
            role: data.profile?.role || data.user_metadata?.role || 'student',
            student_id: data.profile?.student_id || data.user_metadata?.student_id,
            avatar: (data.profile?.display_name || data.user_metadata?.display_name || 'U').charAt(0).toUpperCase(),
            bio: 'Building the next generation of AI-ML engineers at The Forge Bootcamp.',
          });
        } else {
          console.log('[UserContext] No active profile found');
          setUser(null);
        }
      } catch (err) {
        console.error('[UserContext] Profile load error:', err);
        if (isMounted) setUser(null);
      } finally {
        isLoadingUser = false;
        if (isMounted) setLoading(false);
      }
    }

    loadUser();

    const subscription = authService.onAuthStateChange((event, session) => {
      console.log(`[UserContext] Auth Event: ${event}`);
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        loadUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      if (subscription?.unsubscribe) subscription.unsubscribe();
    };
  }, []);

  const updateUser = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  return (
    <UserContext.Provider value={{ user, setUser, updateUser, loading }}>
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
