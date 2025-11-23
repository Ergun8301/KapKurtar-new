import { create } from 'zustand';
import * as Location from 'expo-location';

interface LocationState {
  latitude: number;
  longitude: number;
  hasPermission: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  requestPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<void>;
  setLocation: (latitude: number, longitude: number) => void;
}

// Default location: Istanbul center (Taksim)
const ISTANBUL_CENTER = {
  latitude: 41.0082,
  longitude: 28.9784,
};

export const useLocationStore = create<LocationState>((set, get) => ({
  latitude: ISTANBUL_CENTER.latitude,
  longitude: ISTANBUL_CENTER.longitude,
  hasPermission: false,
  isLoading: false,
  error: null,

  requestPermission: async () => {
    set({ isLoading: true, error: null });
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const hasPermission = status === 'granted';
      set({ hasPermission, isLoading: false });
      return hasPermission;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de permission';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  getCurrentLocation: async () => {
    const { hasPermission } = get();

    if (!hasPermission) {
      const granted = await get().requestPermission();
      if (!granted) {
        set({ error: 'Permission de localisation refusée' });
        return;
      }
    }

    set({ isLoading: true, error: null });
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      set({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de localisation';
      set({ error: message, isLoading: false });
    }
  },

  setLocation: (latitude, longitude) => {
    set({ latitude, longitude });
  },
}));
