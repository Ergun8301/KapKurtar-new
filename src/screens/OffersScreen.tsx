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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, Clock, Tag, Package, AlertCircle } from 'lucide-react-native';
import { useOffersStore } from '../store/offersStore';
import { useAuthStore } from '../store/authStore';
import OfferDetailsScreen from './client/OfferDetailsScreen';
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

// Category config (Turkish)
const CATEGORY_CONFIG: Record<OfferCategory, { label: string; color: string }> = {
  bakery: { label: 'Fırın', color: '#E8A830' },
  restaurant: { label: 'Restoran', color: '#E53935' },
  grocery: { label: 'Market', color: '#4CAF50' },
  cafe: { label: 'Kafe', color: '#795548' },
  supermarket: { label: 'Süpermarket', color: '#2196F3' },
  other: { label: 'Diğer', color: '#9E9E9E' },
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
            { backgroundColor: CATEGORY_CONFIG[offer.category]?.color || COLORS.textLight },
          ]}
        >
          <Text style={styles.categoryBadgeText}>
            {CATEGORY_CONFIG[offer.category]?.label || 'Diğer'}
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
              {offer.store_address || 'Adres belirtilmemiş'}
              {offer.distance_m && (
                <Text style={styles.distanceText}>
                  {' '}• {offer.distance_m < 1000
                    ? `${Math.round(offer.distance_m)}m`
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
              {offer.quantity_available} kaldı
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

  const handleBackFromDetails = () => {
    setSelectedOffer(null);
    handleRefresh();
  };

  const categories: (OfferCategory | 'all')[] = [
    'all',
    'bakery',
    'restaurant',
    'grocery',
    'cafe',
    'supermarket',
  ];

  // Show OfferDetailsScreen if an offer is selected
  if (selectedOffer) {
    return (
      <OfferDetailsScreen
        offer={selectedOffer}
        onBack={handleBackFromDetails}
        onReservationSuccess={handleRefresh}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Teklifler</Text>
        <Text style={styles.headerSubtitle}>
          {filteredOffers.length} teklif mevcut
        </Text>
      </View>

      {/* Demo mode indicator */}
      {useMockData && (
        <View style={styles.demoModeContainer}>
          <AlertCircle size={14} color={COLORS.warning} />
          <Text style={styles.demoModeText}>Demo modu - Örnek veriler</Text>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Teklif veya mağaza ara..."
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
                {isAll ? 'Tümü' : config?.label}
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
            <Text style={styles.emptyText}>Teklif bulunamadı</Text>
            <Text style={styles.emptySubtext}>
              Aramanızı değiştirmeyi deneyin
            </Text>
          </View>
        }
      />
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
});
