/**
 * MapboxWrapper - Safe wrapper for @rnmapbox/maps
 *
 * This component handles the conditional loading of Mapbox to prevent
 * crashes when the native module is not available (e.g., in Expo Go).
 */
import React, { useEffect, useState, forwardRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

// KapKurtar colors
const COLORS = {
  primary: '#00A690',
  background: '#F7F2E7',
  text: '#1A1A1A',
  textLight: '#666666',
};

// Type definitions for Mapbox components
type MapboxModule = typeof import('@rnmapbox/maps').default;

// Global state for Mapbox availability
let MapboxGL: MapboxModule | null = null;
let mapboxError: string | null = null;
let isMapboxInitialized = false;

// Try to load Mapbox module
const initializeMapbox = async (): Promise<boolean> => {
  if (isMapboxInitialized) {
    return MapboxGL !== null;
  }

  isMapboxInitialized = true;

  try {
    // Dynamic import to prevent crash at module load time
    const mapbox = await import('@rnmapbox/maps');
    MapboxGL = mapbox.default;

    // Set access token
    const accessToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
    if (accessToken && MapboxGL) {
      MapboxGL.setAccessToken(accessToken);
    }

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    mapboxError = errorMessage;
    console.warn('Mapbox initialization failed:', errorMessage);
    return false;
  }
};

// Hook to check Mapbox availability
export function useMapbox() {
  const [isReady, setIsReady] = useState(MapboxGL !== null);
  const [isLoading, setIsLoading] = useState(!isMapboxInitialized);
  const [error, setError] = useState<string | null>(mapboxError);

  useEffect(() => {
    if (!isMapboxInitialized) {
      initializeMapbox().then((success) => {
        setIsReady(success);
        setIsLoading(false);
        if (!success) {
          setError(mapboxError);
        }
      });
    }
  }, []);

  return {
    MapboxGL,
    isReady,
    isLoading,
    error
  };
}

// Fallback component when Mapbox is not available
export function MapboxFallback({ error }: { error?: string | null }) {
  return (
    <View style={styles.fallbackContainer}>
      <View style={styles.fallbackContent}>
        <Text style={styles.fallbackTitle}>Carte non disponible</Text>
        <Text style={styles.fallbackText}>
          La carte nécessite un build EAS pour fonctionner.
        </Text>
        <Text style={styles.fallbackHint}>
          Utilisez `eas build` pour créer un build de développement.
        </Text>
        {error && (
          <Text style={styles.errorText}>
            Erreur: {error}
          </Text>
        )}
      </View>
    </View>
  );
}

// Loading component while Mapbox initializes
export function MapboxLoading() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Chargement de la carte...</Text>
    </View>
  );
}

// Safe MapView wrapper
interface SafeMapViewProps {
  style?: any;
  children?: React.ReactNode;
  styleURL?: string;
  logoEnabled?: boolean;
  attributionEnabled?: boolean;
  onMapReady?: () => void;
}

export const SafeMapView = forwardRef<any, SafeMapViewProps>(
  ({ style, children, ...props }, ref) => {
    const { MapboxGL, isReady, isLoading, error } = useMapbox();

    if (isLoading) {
      return <MapboxLoading />;
    }

    if (!isReady || !MapboxGL) {
      return <MapboxFallback error={error} />;
    }

    return (
      <MapboxGL.MapView ref={ref} style={style} {...props}>
        {children}
      </MapboxGL.MapView>
    );
  }
);

// Export getMapboxGL for components that need direct access
export function getMapboxGL(): MapboxModule | null {
  return MapboxGL;
}

// Pre-initialize on module load (non-blocking)
initializeMapbox().catch(() => {
  // Silently handle initialization errors
});

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fallbackContent: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: 300,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  fallbackText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 8,
  },
  fallbackHint: {
    fontSize: 12,
    color: COLORS.primary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 10,
    color: '#E53935',
    textAlign: 'center',
    marginTop: 12,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textLight,
  },
});
