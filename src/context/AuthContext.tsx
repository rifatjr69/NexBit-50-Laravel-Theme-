import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, Payment } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { fetchUserPayments } from '../services/dataService';

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  hasApprovedPayment: boolean;
  userPayments: Payment[];
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, pass: string, fullName: string, phone: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshPayments: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPayments, setUserPayments] = useState<Payment[]>([]);

  // Function to strictly fetch user profile and role from the profiles table
  const fetchProfileAndRole = async (userId: string, emailFallback?: string): Promise<Profile | null> => {
    if (isSupabaseConfigured) {
      try {
        // Query database directly for role and profile info
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone, role')
          .eq('id', userId)
          .single();

        if (!error && data) {
          return {
            id: data.id,
            full_name: data.full_name,
            email: data.email,
            phone: data.phone,
            role: data.role === 'admin' ? 'admin' : 'user'
          };
        }
      } catch (err) {
        console.error('Error fetching role from profiles table:', err);
      }
      return null;
    }

    // In local mode when Supabase is not configured yet
    const storedProfiles: Profile[] = JSON.parse(localStorage.getItem('nexbit_profiles') || '[]');
    const match = storedProfiles.find((p) => p.id === userId || (emailFallback && p.email.toLowerCase() === emailFallback.toLowerCase()));
    if (match) {
      return {
        ...match,
        role: match.role === 'admin' ? 'admin' : 'user'
      };
    }
    return null;
  };

  const refreshUserRole = async () => {
    if (!user) return;
    const refreshed = await fetchProfileAndRole(user.id, user.email);
    if (refreshed) {
      setUser(refreshed);
    }
  };

  // Load user payments and check approved status
  const refreshPayments = async () => {
    if (!user) {
      setUserPayments([]);
      return;
    }
    try {
      const payments = await fetchUserPayments(user.id);
      setUserPayments(payments);
    } catch (e) {
      console.error('Failed to load user payments', e);
    }
  };

  useEffect(() => {
    refreshPayments();
  }, [user?.id]);

  // Initial authentication check
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      setLoading(true);
      if (isSupabaseConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && isMounted) {
            const profile = await fetchProfileAndRole(session.user.id, session.user.email);
            if (profile && isMounted) {
              setUser(profile);
            }
          }
        } catch (e) {
          console.error('Supabase session initialization error:', e);
        } finally {
          if (isMounted) setLoading(false);
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            const profile = await fetchProfileAndRole(session.user.id, session.user.email);
            if (isMounted) setUser(profile);
          } else {
            if (isMounted) {
              setUser(null);
              setUserPayments([]);
            }
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } else {
        // Fallback session restoration from mock storage
        try {
          const stored = localStorage.getItem('nexbit_current_user_id');
          if (stored) {
            const profile = await fetchProfileAndRole(stored);
            if (profile && isMounted) {
              setUser(profile);
            }
          }
        } catch {
          // ignore
        } finally {
          if (isMounted) setLoading(false);
        }
      }
    }

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    setLoading(true);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: pass
        });

        if (error) {
          setLoading(false);
          return { success: false, error: 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।' };
        }

        if (data.user) {
          // Strictly fetch role from profiles table
          const profile = await fetchProfileAndRole(data.user.id, data.user.email);
          setUser(profile);
          setLoading(false);
          return { success: true };
        }
      } catch (err: any) {
        setLoading(false);
        return { success: false, error: err.message || 'লগইন ব্যর্থ হয়েছে।' };
      }
    }

    // Local / Mock login mode
    const storedProfiles: Profile[] = JSON.parse(localStorage.getItem('nexbit_profiles') || '[]');
    let found = storedProfiles.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!found) {
      // Create regular user with strictly role='user'
      found = {
        id: 'user-' + Date.now(),
        full_name: cleanEmail.split('@')[0],
        email: cleanEmail,
        phone: '01700000000',
        role: 'user' // strictly user
      };
      storedProfiles.push(found);
      localStorage.setItem('nexbit_profiles', JSON.stringify(storedProfiles));
    }

    localStorage.setItem('nexbit_current_user_id', found.id);
    setUser(found);
    setLoading(false);
    return { success: true };
  };

  const signUp = async (
    email: string,
    pass: string,
    fullName: string,
    phone: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    setLoading(true);

    if (isSupabaseConfigured) {
      try {
        // New user is always created with role: 'user'
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: pass,
          options: {
            data: { full_name: fullName, phone, role: 'user' }
          }
        });

        if (error) {
          setLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          // Check or insert profile with role strictly 'user'
          const newProfile: Profile = {
            id: data.user.id,
            full_name: fullName.trim() || cleanEmail.split('@')[0],
            email: cleanEmail,
            phone: phone.trim(),
            role: 'user' // Always 'user'
          };

          await supabase.from('profiles').upsert([newProfile]);
          const verifiedProfile = await fetchProfileAndRole(data.user.id, cleanEmail);
          setUser(verifiedProfile || newProfile);
          setLoading(false);
          return { success: true };
        }
      } catch (err: any) {
        setLoading(false);
        return { success: false, error: err.message || 'সাইন আপ ব্যর্থ হয়েছে।' };
      }
    }

    // Local registration - always role: 'user'
    const newProfile: Profile = {
      id: 'user-' + Date.now(),
      full_name: fullName.trim() || cleanEmail.split('@')[0],
      email: cleanEmail,
      phone: phone.trim(),
      role: 'user' // Always 'user'
    };

    const storedProfiles: Profile[] = JSON.parse(localStorage.getItem('nexbit_profiles') || '[]');
    storedProfiles.push(newProfile);
    localStorage.setItem('nexbit_profiles', JSON.stringify(storedProfiles));
    localStorage.setItem('nexbit_current_user_id', newProfile.id);

    setUser(newProfile);
    setLoading(false);
    return { success: true };
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('nexbit_current_user_id');
    setUserPayments([]);
  };

  // Admin access is EXCLUSIVELY based on role === 'admin'
  const isAdmin = Boolean(user && user.role === 'admin');

  // Approved payment gives ZIP download access only, never admin rights
  const hasApprovedPayment = Boolean(userPayments.some((p) => p.status === 'approved'));

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        hasApprovedPayment,
        userPayments,
        login,
        signUp,
        logout,
        refreshPayments,
        refreshUserRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
