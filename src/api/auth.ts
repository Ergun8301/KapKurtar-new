import { supabase } from '../config/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import type { UserRole, EnsureProfileExistsResponse } from '../types';

// Sign up with email and password
export const signUp = async (email: string, password: string, fullName?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) throw error;
  return data;
};

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const redirectUrl = makeRedirectUri({
      scheme: 'kapkurtar',
      path: 'auth/callback',
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;

    if (data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const accessToken = url.searchParams.get('access_token');
        const refreshToken = url.searchParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) throw sessionError;
          return sessionData;
        }
      }
    }

    return null;
  } catch (err) {
    console.error('Google sign in error:', err);
    throw err;
  }
};

// Sign in with Google for specific role
export const signInWithGoogleForRole = async (role: 'client' | 'merchant') => {
  try {
    const redirectUrl = makeRedirectUri({
      scheme: 'kapkurtar',
      path: `auth/callback/${role}`,
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;

    if (data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const accessToken = url.searchParams.get('access_token');
        const refreshToken = url.searchParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) throw sessionError;
          return { session: sessionData, role };
        }
      }
    }

    return null;
  } catch (err) {
    console.error('Google sign in for role error:', err);
    throw err;
  }
};

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Get current session
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

// Get user role from Supabase
export const getUserRole = async (authId: string): Promise<UserRole> => {
  try {
    const { data, error } = await supabase.rpc('get_user_role', {
      p_auth_id: authId,
    });

    if (error) {
      console.error('Error getting user role:', error);
      return 'none';
    }

    return (data as UserRole) || 'none';
  } catch (err) {
    console.error('Error in getUserRole:', err);
    return 'none';
  }
};

// Ensure profile exists (creates if not)
export const ensureProfileExists = async (
  authId: string
): Promise<EnsureProfileExistsResponse | null> => {
  try {
    const { data, error } = await supabase.rpc('ensure_profile_exists', {
      p_auth_id: authId,
    });

    if (error) {
      console.error('Error ensuring profile exists:', error);
      return null;
    }

    return data?.[0] as EnsureProfileExistsResponse || null;
  } catch (err) {
    console.error('Error in ensureProfileExists:', err);
    return null;
  }
};

// Update user location (for clients)
export const updateUserLocation = async (
  authId: string,
  longitude: number,
  latitude: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.rpc('profiles_update_location', {
      p_auth_id: authId,
      p_lon: longitude,
      p_lat: latitude,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
};

// Reset password
export const resetPassword = async (email: string) => {
  const redirectUrl = makeRedirectUri({
    scheme: 'kapkurtar',
    path: 'auth/reset-password',
  });

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });

  if (error) throw error;
};

// Update password
export const updatePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
};
