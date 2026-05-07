import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const initialized = useRef(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Fetch initial session
    const fetchSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        const session = data?.session;
        
        if (error) throw error;

        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user.id, session.user.email);
        } else {
          setUser(null);
          setProfile(null);
          setRole(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching session:', err);
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    };

    fetchSession();

    // Listen for auth changes
    const { data: authData } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user.id, session.user.email);
        } else {
          setUser(null);
          setProfile(null);
          setRole(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error in auth state change:', err);
        setLoading(false);
      }
    });

    const subscription = authData?.subscription;
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId, userEmail) => {
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), 10000)
    );

    try {
      // 1. Try to fetch existing profile
      const { data, error } = await Promise.race([
        supabase.from('users').select('*').eq('id', userId).single(),
        timeout
      ]);

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"

      if (data) {
        setProfile(data);
        setRole(data.role);
      } else {
        // 2. Profile missing - Check if it's a known mentor and auto-create
        let newRole = 'student';
        let displayName = userEmail.split('@')[0];

        if (userEmail === 'shreyas@gmail.com' || userEmail === 'nischay@theboringpeople.in') {
          newRole = 'mentor';
          displayName = userEmail === 'shreyas@gmail.com' ? 'Shreyas' : 'Nischay B K';
        }

        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: userEmail,
            display_name: displayName,
            role: newRole
          })
          .select()
          .single();
        
        if (createError) {
          console.error('Failed to auto-create user record:', createError);
          // Fallback state if insert fails
          setRole(newRole);
          setProfile({ display_name: displayName, role: newRole });
        } else {
          setProfile(newUser);
          setRole(newUser.role);
        }
      }
    } catch (err) {
      console.error('Error in fetchUserProfile:', err);
      // Hard fallback for development/emergency
      if (userEmail === 'shreyas@gmail.com' || userEmail === 'nischay@theboringpeople.in') {
        setRole('mentor');
        setProfile({ display_name: 'Nischay B K', role: 'mentor' });
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setProfile(null);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };
  
  const value = {
    user,
    profile,
    role: (user?.email === 'shreyas@gmail.com' || user?.email === 'nischay@theboringpeople.in') ? 'mentor' : role,
    loading,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
