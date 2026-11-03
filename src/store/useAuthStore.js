import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient.js';

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  isPasswordRecovery: false, // Tracks if user landed via a reset password email link
  theme: localStorage.getItem('theme') || 'light',

  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    set({ theme: newTheme });
  },

  initAuth: async () => {
    try {
      set({ loading: true });
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const isBanned = await get().fetchProfile(session.user.id);
        if (isBanned) {
          await supabase.auth.signOut();
          set({ user: null, profile: null });
        } else {
          set({ user: session.user });
        }
      }

      // Listen for authentication changes including PASSWORD_RECOVERY
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          // Flags that the user is actively resetting their password
          set({ isPasswordRecovery: true, user: session?.user ?? null });
          return;
        }

        const currentUser = session?.user ?? null;
        if (currentUser) {
          const isBanned = await get().fetchProfile(currentUser.id);
          if (isBanned) {
            await supabase.auth.signOut();
            set({ user: null, profile: null });
          } else {
            set({ user: currentUser });
          }
        } else {
          set({ user: null, profile: null });
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return false;
      } else {
        if (data?.status === 'banned') {
          return true; // Flag as banned
        }
        set({ profile: data });
        return false;
      }
    } catch (err) {
      console.error('Profile fetch exception:', err);
      return false;
    }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error };
    
    if (data?.user) {
      const isBanned = await get().fetchProfile(data.user.id);
      if (isBanned) {
        await supabase.auth.signOut();
        set({ user: null, profile: null });
        return { error: { message: 'Your account has been suspended. Please contact support.' } };
      }

      set({ user: data.user });
    }
    return { data };
  },

  signUp: async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    if (error) return { error };
    
    if (data?.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: metadata.full_name || '',
        role: 'investor',
        status: 'active',
        updated_at: new Date(),
      });
      
      const isBanned = await get().fetchProfile(data.user.id);
      if (isBanned) {
        await supabase.auth.signOut();
        set({ user: null, profile: null });
        return { error: { message: 'Your account has been suspended.' } };
      }

      set({ user: data.user });
    }
    return { data };
  },

  // NEW: Update password method for resetting passwords
  updatePassword: async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) return { error };
    
    // Clear password recovery mode once successfully updated
    set({ isPasswordRecovery: false });
    return { data };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, isPasswordRecovery: false });
  },
}));