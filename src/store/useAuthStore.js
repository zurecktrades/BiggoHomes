import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabaseClient';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      session: null,
      loading: true,
      theme: 'light', // Light mode by default

      applyTheme: (themeName) => {
        const root = document.documentElement;
        if (themeName === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      },

      toggleTheme: () => {
        const nextTheme = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: nextTheme });
        get().applyTheme(nextTheme);
      },

      initAuth: async () => {
        set({ loading: true });
        
        // Apply saved theme on boot
        get().applyTheme(get().theme);
        
        // 1. Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await get().fetchProfile(session.user.id);
          set({ user: session.user, session });
        } else {
          set({ user: null, session: null, profile: null });
        }

        // 2. Set up auth state change listener
        supabase.auth.onAuthStateChange(async (_event, newSession) => {
          if (newSession?.user) {
            await get().fetchProfile(newSession.user.id);
            set({ user: newSession.user, session: newSession });
          } else {
            set({ user: null, session: null, profile: null });
          }
        });

        set({ loading: false });
      },

      fetchProfile: async (userId) => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (!error && data) {
          set({ profile: data });
        }
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, profile: null, session: null });
      }
    }),
    {
      name: 'biggohomes-storage',
      partialize: (state) => ({ theme: state.theme })
    }
  )
);