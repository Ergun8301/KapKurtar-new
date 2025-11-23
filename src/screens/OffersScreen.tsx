import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, Clock, Tag, X, Package, AlertCircle } from 'lucide-react-native';
import { useOffersStore } from '../store/offersStore';
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

interface OfferCardProps {
  offer: Offer;
  onPress: (offer: Offer) => void;
}

function OfferCard({ offer, onPress }: OfferCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(offer)}>
      <View style={styles.cardImageContainer}>
        {offer.image_url ? (
          <Image source={{ uri: offer.image_url }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Tag size={32} color={COLORS.textLight} />
          </View>
        )}
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>-{offer.discount_percentage}%</Text>
        </View>
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: CATEGORY_CONFIG[offer.category].color },
          ]}
        >
          <Text style={styles.categoryBadgeText}>
            {CATEGORY_CONFIG[offer.category].label}
          </Text>
        </View>
        {/* Merchant logo overlay */}
        {offer.store_logo && (
          <View style={styles.storeLogo}>
            <Image source={{ uri: offer.store_logo }} style={styles.storeLogoImage} />
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {offer.title}
        </Text>
        <Text style={styles.cardStore} numberOfLines={1}>
          {offer.store_name}
        </Text>

        <View style={styles.cardInfo}>
          <View style={styles.infoRow}>
            <MapPin size={14} color={COLORS.textLight} />
            <Text style={styles.infoText} numberOfLines={1}>
              {offer.store_address || 'Adresse à confirmer'}
              {offer.distance_m && (
                <Text style={styles.distanceText}>
                  {' '}• {offer.distance_m < 1000
                    ? `${offer.distance_m}m`
                    : `${(offer.distance_m / 1000).toFixed(1)}km`}
                </Text>
              )}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={14} color={COLORS.textLight} />
            <Text style={styles.infoText}>
              {offer.pickup_start} - {offer.pickup_end}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.originalPrice}>{offer.original_price}₺</Text>
            <Text style={styles.discountedPrice}>{offer.discounted_price}₺</Text>
          </View>
          <View style={styles.quantityBadge}>
            <Text style={styles.quantityText}>
              {offer.quantity_available} restant{offer.quantity_available > 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function OffersScreen() {
  const { offers, fetchOffers, isLoading, useMockData } = useOffersStore();
  const { user, profile } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<OfferCategory | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    // Fetch offers with user ID if available for nearby offers
    if (user?.id && profile?.has_location) {
      fetchOffers(user.id);
    } else {
      fetchOffers();
    }
  }, [user?.id, profile?.has_location]);

  const filteredOffers = offers.filter((offer) => {
    const matchesSearch =
      offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.store_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || offer.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOfferPress = (offer: Offer) => {
    setSelectedOffer(offer);
  };

  const handleRefresh = () => {
    if (user?.id && profile?.has_location) {
      fetchOffers(user.id);
    } else {
      fetchOffers();
    }
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
        handleRefresh();
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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Offres Anti-Gaspi</Text>
        <Text style={styles.headerSubtitle}>
          {filteredOffers.length} offre{filteredOffers.length > 1 ? 's' : ''} disponible
          {filteredOffers.length > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Demo mode indicator */}
      {useMockData && (
        <View style={styles.demoModeContainer}>
          <AlertCircle size={14} color={COLORS.warning} />
          <Text style={styles.demoModeText}>Mode démo - Données fictives</Text>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une offre ou un commerce..."
          placeholderTextColor={COLORS.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Categories */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={categories}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.categoriesContainer}
        renderItem={({ item }) => {
          const isAll = item === 'all';
          const isSelected = isAll ? !selectedCategory : selectedCategory === item;
          const config = isAll ? null : CATEGORY_CONFIG[item as OfferCategory];

          return (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                isSelected && {
                  backgroundColor: isAll ? COLORS.primary : config?.color,
                },
              ]}
              onPress={() =>
                setSelectedCategory(isAll ? null : (item as OfferCategory))
              }
            >
              <Text
                style={[styles.categoryText, isSelected && styles.categoryTextSelected]}
              >
                {isAll ? 'Tous' : config?.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Offers List */}
      <FlatList
        data={filteredOffers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OfferCard offer={item} onPress={handleOfferPress} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Tag size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>Aucune offre trouvée</Text>
            <Text style={styles.emptySubtext}>
              Essayez de modifier votre recherche
            </Text>
          </View>
        }
      />

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
                  <View style={[styles.modalCategoryBadge, { backgroundColor: CATEGORY_CONFIG[selectedOffer.category].color }]}>
                    <Text style={styles.modalCategoryBadgeText}>
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
                    <View style={styles.modalDistanceBadge}>
                      <MapPin size={14} color={COLORS.primary} />
                      <Text style={styles.modalDistanceText}>
                        {selectedOffer.distance_m < 1000
                          ? `${selectedOffer.distance_m}m`
                          : `${(selectedOffer.distance_m / 1000).toFixed(1)}km`}
                      </Text>
                    </View>
                  )}

                  <View style={styles.modalInfo}>
                    <View style={styles.modalInfoRow}>
                      <MapPin size={16} color={COLORS.textLight} />
                      <Text style={styles.modalInfoText}>
                        {selectedOffer.store_address || 'Adresse à confirmer'}
                      </Text>
                    </View>
                    <View style={styles.modalInfoRow}>
                      <Clock size={16} color={COLORS.textLight} />
                      <Text style={styles.modalInfoText}>
                        Retrait: {selectedOffer.pickup_start} - {selectedOffer.pickup_end}
                      </Text>
                    </View>
                    <View style={styles.modalInfoRow}>
                      <Package size={16} color={COLORS.textLight} />
                      <Text style={styles.modalInfoText}>
                        {selectedOffer.quantity_available} disponible
                        {selectedOffer.quantity_available > 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalPriceContainer}>
                    <View>
                      <Text style={styles.modalOriginalPrice}>
                        {selectedOffer.original_price}₺
                      </Text>
                      <Text style={styles.modalDiscountedPrice}>
                        {selectedOffer.discounted_price}₺
                      </Text>
                    </View>
                    <View style={styles.modalDiscountBadge}>
                      <Text style={styles.modalDiscountText}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 48,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardImageContainer: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  cardImagePlaceholder: {
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 12,
  },
  storeLogo: {
    position: 'absolute',
    bottom: -20,
    right: 12,
    backgroundColor: COLORS.white,
    borderRadius: 25,
    padding: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  storeLogoImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  cardContent: {
    padding: 16,
    paddingTop: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardStore: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '600',
    marginBottom: 12,
  },
  cardInfo: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textLight,
    flex: 1,
  },
  distanceText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  quantityBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quantityText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  // Modal styles
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
  modalCategoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  modalCategoryBadgeText: {
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
  modalDistanceBadge: {
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
  modalDistanceText: {
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
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalInfoText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  modalPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalOriginalPrice: {
    fontSize: 16,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
  modalDiscountedPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  modalDiscountBadge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  modalDiscountText: {
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
