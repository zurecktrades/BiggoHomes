import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient.js';

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
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
        set({ user: session.user });
        await get().fetchProfile(session.user.id);
      }

      supabase.auth.onAuthStateChange(async (_event, session) => {
        const currentUser = session?.user ?? null;
        set({ user: currentUser });
        if (currentUser) {
          await get().fetchProfile(currentUser.id);
        } else {
          set({ profile: null });
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
      } else {
        set({ profile: data });
      }
    } catch (err) {
      console.error('Profile fetch exception:', err);
    }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error };
    if (data?.user) {
      set({ user: data.user });
      await get().fetchProfile(data.user.id);
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
    
    // If sign up creates a session immediately (email confirmation disabled in Supabase)
    if (data?.user) {
      set({ user: data.user });
      // Insert profile record manually if trigger isn't set up
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: metadata.full_name || '',
        role: 'investor',
        updated_at: new Date(),
      });
      await get().fetchProfile(data.user.id);
    }
    return { data };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },
}));