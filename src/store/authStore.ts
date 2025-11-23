import { create } from 'zustand';
import { supabase } from '../config/supabase';
import * as authApi from '../api/auth';
import type { User, UserProfile, UserRole } from '../types';

interface AuthStore {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole;
  isLoading: boolean;
  isAuthenticated: boolean;
  initialized: boolean;
  error: string | null;

  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGoogleForRole: (role: 'client' | 'merchant') => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateLocation: (longitude: number, latitude: number) => Promise<{ success: boolean; error?: string }>;
  setRole: (role: UserRole) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  profile: null,
  role: 'none',
  isLoading: true,
  isAuthenticated: false,
  initialized: false,
  error: null,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await authApi.signIn(email, password);

      if (user) {
        const userData: User = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name,
          avatar_url: user.user_metadata?.avatar_url,
          created_at: user.created_at,
        };

        // Load profile and role
        const profile = await authApi.ensureProfileExists(user.id);
        const role = await authApi.getUserRole(user.id);

        set({
          user: userData,
          profile,
          role,
          isAuthenticated: true,
          isLoading: false,
          initialized: true,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de connexion';
      set({ error: message, isLoading: false, initialized: true });
      throw error;
    }
  },

  signUp: async (email: string, password: string, fullName: string) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await authApi.signUp(email, password, fullName);

      if (user) {
        const userData: User = {
          id: user.id,
          email: user.email || '',
          full_name: fullName,
          created_at: user.created_at,
        };

        // Create profile
        const profile = await authApi.ensureProfileExists(user.id);

        set({
          user: userData,
          profile,
          role: 'client', // Default role for new users
          isAuthenticated: true,
          isLoading: false,
          initialized: true,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur d'inscription";
      set({ error: message, isLoading: false, initialized: true });
      throw error;
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await authApi.signInWithGoogle();

      if (result?.user) {
        const userData: User = {
          id: result.user.id,
          email: result.user.email || '',
          full_name: result.user.user_metadata?.full_name || result.user.user_metadata?.name,
          avatar_url: result.user.user_metadata?.avatar_url || result.user.user_metadata?.picture,
          created_at: result.user.created_at,
        };

        const profile = await authApi.ensureProfileExists(result.user.id);
        const role = await authApi.getUserRole(result.user.id);

        set({
          user: userData,
          profile,
          role: role || 'client',
          isAuthenticated: true,
          isLoading: false,
          initialized: true,
        });
      } else {
        set({ isLoading: false, initialized: true });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de connexion Google';
      set({ error: message, isLoading: false, initialized: true });
      throw error;
    }
  },

  signInWithGoogleForRole: async (role: 'client' | 'merchant') => {
    set({ isLoading: true, error: null });
    try {
      const result = await authApi.signInWithGoogleForRole(role);

      if (result?.session?.user) {
        const user = result.session.user;
        const userData: User = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.user_metadata?.name,
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
          created_at: user.created_at,
          role: role,
        };

        const profile = await authApi.ensureProfileExists(user.id);

        set({
          user: userData,
          profile,
          role,
          isAuthenticated: true,
          isLoading: false,
          initialized: true,
        });
      } else {
        set({ isLoading: false, initialized: true });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de connexion Google';
      set({ error: message, isLoading: false, initialized: true });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await authApi.signOut();
      set({
        user: null,
        profile: null,
        role: 'none',
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de déconnexion';
      set({ error: message, isLoading: false });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
          created_at: session.user.created_at,
        };

        const profile = await authApi.ensureProfileExists(session.user.id);
        const role = await authApi.getUserRole(session.user.id);

        set({
          user: userData,
          profile,
          role: role || 'client',
          isAuthenticated: true,
          isLoading: false,
          initialized: true,
        });
      } else {
        set({
          user: null,
          profile: null,
          role: 'none',
          isAuthenticated: false,
          isLoading: false,
          initialized: true,
        });
      }
    } catch {
      set({
        user: null,
        profile: null,
        role: 'none',
        isAuthenticated: false,
        isLoading: false,
        initialized: true,
      });
    }
  },

  updateLocation: async (longitude: number, latitude: number) => {
    const { user, profile } = get();

    if (!user) {
      return { success: false, error: 'Non authentifié' };
    }

    const result = await authApi.updateUserLocation(user.id, longitude, latitude);

    if (result.success && profile) {
      set({
        profile: { ...profile, has_location: true },
      });
    }

    return result;
  },

  setRole: (role: UserRole) => {
    set({ role });
  },

  clearError: () => set({ error: null }),
}));
