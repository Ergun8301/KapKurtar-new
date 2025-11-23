import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapboxGL from '@rnmapbox/maps';
import { MapPin, Clock, Package, X, Navigation, AlertCircle } from 'lucide-react-native';
import { useOffersStore } from '../store/offersStore';
import { useLocationStore } from '../store/locationStore';
import { useAuthStore } from '../store/authStore';
import { createReservation } from '../api/reservations';
import type { Offer, OfferCategory } from '../types';

// KapKurtar colors
const COLORS = {
  primary: '#00A690',
  secondary: '#F75C00',
  background: '#F7F2E7',
  white: '#FFFFFF',
  text: '#1A1A1A',
  textLight: '#666666',
  error: '#E53935',
  border: '#E0E0E0',
  warning: '#FFA000',
};

// Category config
const CATEGORY_CONFIG: Record<OfferCategory, { label: string; color: string }> = {
  bakery: { label: 'Boulangerie', color: '#E8A830' },
  restaurant: { label: 'Restaurant', color: '#E53935' },
  grocery: { label: 'Épicerie', color: '#4CAF50' },
  cafe: { label: 'Café', color: '#795548' },
  supermarket: { label: 'Supermarché', color: '#2196F3' },
  other: { label: 'Autre', color: '#9E9E9E' },
};

// Istanbul center coordinates
const ISTANBUL_CENTER: [number, number] = [28.9784, 41.0082];

// Configure Mapbox - Replace with your access token
MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN');

export default function HomeScreen() {
  const mapRef = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<OfferCategory | null>(null);
  const [reserving, setReserving] = useState(false);

  const { offers, fetchOffers, isLoading, useMockData } = useOffersStore();
  const { latitude, longitude, getCurrentLocation, hasPermission, requestPermission } =
    useLocationStore();
  const { user, profile, updateLocation } = useAuthStore();

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    await requestPermission();

    // Fetch offers with user ID if available for nearby offers
    if (user?.id && profile?.has_location) {
      fetchOffers(user.id);
    } else {
      fetchOffers();
    }
  };

  // Update location in Supabase when we get GPS coordinates
  useEffect(() => {
    if (hasPermission && latitude && longitude && user?.id) {
      updateLocation(longitude, latitude);
    }
  }, [latitude, longitude, hasPermission, user?.id]);

  const filteredOffers = selectedCategory
    ? offers.filter((o) => o.category === selectedCategory)
    : offers;

  const handleMarkerPress = (offer: Offer) => {
    setSelectedOffer(offer);
  };

  const handleLocateMe = async () => {
    await getCurrentLocation();
    if (cameraRef.current && latitude && longitude) {
      cameraRef.current.setCamera({
        centerCoordinate: [longitude, latitude],
        zoomLevel: 14,
        animationDuration: 1000,
      });
    }
  };

  const handleCategoryPress = (category: OfferCategory | null) => {
    setSelectedCategory(category === selectedCategory ? null : category);
  };

  const handleReserve = async () => {
    if (!selectedOffer) return;

    if (!user) {
      Alert.alert('Connexion requise', 'Veuillez vous connecter pour réserver une offre.');
      return;
    }

    setReserving(true);
    try {
      const result = await createReservation(selectedOffer.id, selectedOffer.store_id, 1);

      if (result.success) {
        Alert.alert(
          'Réservation confirmée !',
          `Vous avez réservé "${selectedOffer.title}" chez ${selectedOffer.store_name}.\n\nRetrait: ${selectedOffer.pickup_start} - ${selectedOffer.pickup_end}`,
          [{ text: 'OK', onPress: () => setSelectedOffer(null) }]
        );
        // Refresh offers to update quantities
        fetchOffers(user.id);
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de créer la réservation');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la réservation');
    } finally {
      setReserving(false);
    }
  };

  const categories: (OfferCategory | 'all')[] = [
    'all',
    'bakery',
    'restaurant',
    'grocery',
    'cafe',
    'supermarket',
  ];

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapboxGL.MapView
        ref={mapRef}
        style={styles.map}
        styleURL={MapboxGL.StyleURL.Street}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={12}
          centerCoordinate={ISTANBUL_CENTER}
          animationDuration={0}
        />

        {/* User location */}
        {hasPermission && (
          <MapboxGL.UserLocation visible={true} showsUserHeadingIndicator={true} />
        )}

        {/* Offer markers with logos */}
        {filteredOffers.map((offer) => (
          <MapboxGL.MarkerView
            key={offer.id}
            coordinate={[offer.longitude, offer.latitude]}
            anchor={{ x: 0.5, y: 1 }}
          >
            <TouchableOpacity
              style={styles.markerContainer}
              onPress={() => handleMarkerPress(offer)}
            >
              {/* Merchant logo or colored marker */}
              {offer.store_logo ? (
                <View style={styles.logoMarker}>
                  <Image
                    source={{ uri: offer.store_logo }}
                    style={styles.logoImage}
                  />
                  <View style={[styles.priceBadge, { backgroundColor: CATEGORY_CONFIG[offer.category].color }]}>
                    <Text style={styles.priceBadgeText}>{offer.discounted_price}₺</Text>
                  </View>
                </View>
              ) : (
                <View
                  style={[
                    styles.marker,
                    { backgroundColor: CATEGORY_CONFIG[offer.category].color },
                  ]}
                >
                  <Text style={styles.markerText}>{offer.discounted_price}₺</Text>
                </View>
              )}
            </TouchableOpacity>
          </MapboxGL.MarkerView>
        ))}
      </MapboxGL.MapView>

      {/* Header */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>KapKurtar</Text>
            <Text style={styles.headerSubtitle}>
              {filteredOffers.length} offre{filteredOffers.length > 1 ? 's' : ''} disponible
              {filteredOffers.length > 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity style={styles.locateButton} onPress={handleLocateMe}>
            <Navigation size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Demo mode indicator */}
        {useMockData && (
          <View style={styles.demoModeContainer}>
            <AlertCircle size={14} color={COLORS.warning} />
            <Text style={styles.demoModeText}>Mode démo - Données fictives</Text>
          </View>
        )}

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((cat) => {
            const isAll = cat === 'all';
            const isSelected = isAll ? !selectedCategory : selectedCategory === cat;
            const config = isAll ? null : CATEGORY_CONFIG[cat as OfferCategory];

            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  isSelected && {
                    backgroundColor: isAll ? COLORS.primary : config?.color,
                  },
                ]}
                onPress={() => handleCategoryPress(isAll ? null : (cat as OfferCategory))}
              >
                <Text
                  style={[
                    styles.categoryText,
                    isSelected && styles.categoryTextSelected,
                  ]}
                >
                  {isAll ? 'Tous' : config?.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      {/* Offer Detail Modal */}
      <Modal
        visible={!!selectedOffer}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedOffer(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedOffer && (
              <>
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => setSelectedOffer(null)}
                >
                  <X size={24} color={COLORS.text} />
                </TouchableOpacity>

                {/* Offer image with merchant logo overlay */}
                <View style={styles.imageContainer}>
                  {selectedOffer.image_url && (
                    <Image
                      source={{ uri: selectedOffer.image_url }}
                      style={styles.modalImage}
                    />
                  )}
                  {selectedOffer.store_logo && (
                    <View style={styles.merchantLogoContainer}>
                      <Image
                        source={{ uri: selectedOffer.store_logo }}
                        style={styles.merchantLogo}
                      />
                    </View>
                  )}
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>
                      {CATEGORY_CONFIG[selectedOffer.category].label}
                    </Text>
                  </View>

                  <Text style={styles.modalTitle}>{selectedOffer.title}</Text>
                  <Text style={styles.modalStore}>{selectedOffer.store_name}</Text>
                  <Text style={styles.modalDescription}>
                    {selectedOffer.description}
                  </Text>

                  {/* Distance indicator if available */}
                  {selectedOffer.distance_m && (
                    <View style={styles.distanceBadge}>
                      <MapPin size={14} color={COLORS.primary} />
                      <Text style={styles.distanceText}>
                        {selectedOffer.distance_m < 1000
                          ? `${selectedOffer.distance_m}m`
                          : `${(selectedOffer.distance_m / 1000).toFixed(1)}km`}
                      </Text>
                    </View>
                  )}

                  <View style={styles.modalInfo}>
                    <View style={styles.infoRow}>
                      <MapPin size={16} color={COLORS.textLight} />
                      <Text style={styles.infoText}>
                        {selectedOffer.store_address || 'Adresse à confirmer'}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Clock size={16} color={COLORS.textLight} />
                      <Text style={styles.infoText}>
                        Retrait: {selectedOffer.pickup_start} - {selectedOffer.pickup_end}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Package size={16} color={COLORS.textLight} />
                      <Text style={styles.infoText}>
                        {selectedOffer.quantity_available} disponible
                        {selectedOffer.quantity_available > 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.priceContainer}>
                    <View>
                      <Text style={styles.originalPrice}>
                        {selectedOffer.original_price}₺
                      </Text>
                      <Text style={styles.discountedPrice}>
                        {selectedOffer.discounted_price}₺
                      </Text>
                    </View>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>
                        -{selectedOffer.discount_percentage}%
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.reserveButton, reserving && styles.reserveButtonDisabled]}
                    onPress={handleReserve}
                    disabled={reserving || selectedOffer.quantity_available === 0}
                  >
                    {reserving ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <Text style={styles.reserveButtonText}>
                        {selectedOffer.quantity_available === 0
                          ? 'Épuisé'
                          : 'Réserver'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(247, 242, 231, 0.95)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 2,
  },
  locateButton: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  demoModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8E1',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    gap: 6,
  },
  demoModeText: {
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: '500',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  categoryChip: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  categoryTextSelected: {
    color: COLORS.white,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  markerText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  logoMarker: {
    alignItems: 'center',
    position: 'relative',
  },
  logoImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.white,
    backgroundColor: COLORS.white,
  },
  priceBadge: {
    position: 'absolute',
    bottom: -8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  priceBadgeText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 11,
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: COLORS.white,
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  merchantLogoContainer: {
    position: 'absolute',
    bottom: -30,
    left: 20,
    backgroundColor: COLORS.white,
    borderRadius: 35,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  merchantLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  modalBody: {
    padding: 20,
    paddingTop: 40,
  },
  categoryBadge: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  modalStore: {
    fontSize: 16,
    color: COLORS.secondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
    marginBottom: 12,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  modalInfo: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  originalPrice: {
    fontSize: 16,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  discountBadge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  discountText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  reserveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  reserveButtonDisabled: {
    opacity: 0.7,
  },
  reserveButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
