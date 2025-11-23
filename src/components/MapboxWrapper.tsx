/**
 * MapboxWrapper - Placeholder component (Mapbox temporarily disabled)
 *
 * This component previously handled Mapbox map rendering.
 * Mapbox has been temporarily disabled due to 401 authentication issues.
 * The map functionality has been replaced with a list view in MapScreen.
 *
 * To re-enable Mapbox:
 * 1. Add @rnmapbox/maps to package.json
 * 2. Add the plugin to app.config.js
 * 3. Restore the original MapboxWrapper code
 * 4. Update HomeScreen.tsx to use the map
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// KapKurtar colors
const COLORS = {
  primary: '#00A690',
  background: '#F7F2E7',
  text: '#1A1A1A',
  textLight: '#666666',
  info: '#2196F3',
};

// Placeholder hook - Mapbox is disabled
export function useMapbox() {
  return {
    MapboxGL: null,
    isReady: false,
    isLoading: false,
    error: 'Mapbox is temporarily disabled'
  };
}

// Fallback component shown instead of the map
export function MapboxFallback({ error }: { error?: string | null }) {
  return (
    <View style={styles.fallbackContainer}>
      <View style={styles.fallbackContent}>
        <Text style={styles.fallbackTitle}>Harita geçici olarak devre dışı</Text>
        <Text style={styles.fallbackText}>
          Harita özelliği şu anda kullanılamıyor.
        </Text>
        <Text style={styles.fallbackHint}>
          Lütfen "Teklifler" sekmesini kullanarak teklifleri görüntüleyin.
        </Text>
      </View>
    </View>
  );
}

// Loading component placeholder
export function MapboxLoading() {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>Yükleniyor...</Text>
    </View>
  );
}

// Placeholder MapView - not functional
export const SafeMapView = ({ children, ...props }: any) => {
  return <MapboxFallback />;
};

// Placeholder function
export function getMapboxGL(): null {
  return null;
}

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
    textAlign: 'center',
  },
  fallbackText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 8,
  },
  fallbackHint: {
    fontSize: 12,
    color: COLORS.info,
    textAlign: 'center',
    fontStyle: 'italic',
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
