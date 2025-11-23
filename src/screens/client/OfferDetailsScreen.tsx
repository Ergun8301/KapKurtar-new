import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Heart,
  MapPin,
  Clock,
  Package,
  Minus,
  Plus,
  Store,
  Phone,
  Navigation,
} from 'lucide-react-native';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/authStore';
import { createReservation } from '../../api/reservations';
import type { Offer } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  primary: '#00A690',
  secondary: '#F75C00',
  background: '#F7F2E7',
  white: '#FFFFFF',
  text: '#1A1A1A',
  textLight: '#666666',
  border: '#E0E0E0',
  error: '#E53935',
  success: '#4CAF50',
  warning: '#FFA000',
};

interface OfferDetailsScreenProps {
  offer: Offer;
  onBack: () => void;
  onReservationSuccess?: () => void;
}

export default function OfferDetailsScreen({
  offer,
  onBack,
  onReservationSuccess,
}: OfferDetailsScreenProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [merchantInfo, setMerchantInfo] = useState<any>(null);

  useEffect(() => {
    checkFavorite();
    fetchMerchantInfo();
  }, [offer]);

  const checkFavorite = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('client_id', user.id)
        .eq('merchant_id', offer.merchant_id)
        .maybeSingle();

      if (!error && data) {
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Favori kontrolü hatası:', err);
    }
  };

  const fetchMerchantInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('merchants')
        .select('company_name, logo_url, address, city, phone')
        .eq('id', offer.merchant_id)
        .single();

      if (!error && data) {
        setMerchantInfo(data);
      }
    } catch (err) {
      console.error('Mağaza bilgisi hatası:', err);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      Alert.alert('Giriş Gerekli', 'Favorilere eklemek için giriş yapmalısınız.');
      return;
    }

    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('client_id', user.id)
          .eq('merchant_id', offer.merchant_id);

        if (!error) {
          setIsFavorite(false);
        }
      } else {
        // Add to favorites
        const { error } = await supabase.from('favorites').insert({
          client_id: user.id,
          merchant_id: offer.merchant_id,
        });

        if (!error) {
          setIsFavorite(true);
        }
      }
    } catch (err) {
      Alert.alert('Hata', 'Favori işlemi başarısız oldu');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleReserve = async () => {
    if (!user) {
      Alert.alert('Giriş Gerekli', 'Rezervasyon yapmak için giriş yapmalısınız.');
      return;
    }

    if (quantity < 1 || quantity > (offer.quantity_available || 1)) {
      Alert.alert('Hata', 'Geçersiz miktar');
      return;
    }

    setLoading(true);
    try {
      const result = await createReservation(user.id, offer.id, quantity);

      if (result.success) {
        Alert.alert(
          'Rezervasyon Başarılı!',
          `${quantity} adet "${offer.title}" rezerve edildi. Lütfen belirtilen saatlerde teslim alın.`,
          [
            {
              text: 'Tamam',
              onPress: () => {
                if (onReservationSuccess) onReservationSuccess();
                onBack();
              },
            },
          ]
        );
      } else {
        Alert.alert('Hata', result.error || 'Rezervasyon oluşturulamadı');
      }
    } catch (err) {
      Alert.alert('Hata', 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const incrementQuantity = () => {
    if (quantity < (offer.quantity_available || 1)) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  // Calculate discount percentage
  const discountPercentage = offer.original_price && offer.discounted_price
    ? Math.round((1 - offer.discounted_price / offer.original_price) * 100)
    : 0;

  // Format time
  const formatTime = (time?: string) => {
    if (!time) return '--:--';
    return time.slice(0, 5);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Teklif Detayı</Text>
        <TouchableOpacity
          style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]}
          onPress={toggleFavorite}
          disabled={favoriteLoading}
        >
          {favoriteLoading ? (
            <ActivityIndicator size="small" color={COLORS.secondary} />
          ) : (
            <Heart
              size={24}
              color={isFavorite ? COLORS.secondary : COLORS.textLight}
              fill={isFavorite ? COLORS.secondary : 'none'}
            />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Section */}
        <View style={styles.imageContainer}>
          {offer.image_url ? (
            <Image source={{ uri: offer.image_url }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Package size={60} color={COLORS.textLight} />
            </View>
          )}

          {/* Discount Badge */}
          {discountPercentage > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discountPercentage}%</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title & Description */}
          <Text style={styles.title}>{offer.title}</Text>
          {offer.description && (
            <Text style={styles.description}>{offer.description}</Text>
          )}

          {/* Price Section */}
          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              {offer.original_price && (
                <Text style={styles.originalPrice}>{offer.original_price}₺</Text>
              )}
              <Text style={styles.discountedPrice}>
                {offer.discounted_price || offer.price_after}₺
              </Text>
            </View>
            <Text style={styles.savingsText}>
              {offer.original_price && offer.discounted_price
                ? `${(offer.original_price - offer.discounted_price).toFixed(2)}₺ tasarruf edin!`
                : ''}
            </Text>
          </View>

          {/* Info Cards */}
          <View style={styles.infoCards}>
            {/* Quantity Card */}
            <View style={styles.infoCard}>
              <Package size={20} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Stok</Text>
              <Text style={styles.infoValue}>
                {offer.quantity_available || 0} adet
              </Text>
            </View>

            {/* Pickup Time Card */}
            <View style={styles.infoCard}>
              <Clock size={20} color={COLORS.secondary} />
              <Text style={styles.infoLabel}>Teslim Saati</Text>
              <Text style={styles.infoValue}>
                {formatTime(offer.pickup_start_time)} - {formatTime(offer.pickup_end_time)}
              </Text>
            </View>
          </View>

          {/* Merchant Section */}
          <View style={styles.merchantSection}>
            <Text style={styles.sectionTitle}>Mağaza Bilgileri</Text>
            <View style={styles.merchantCard}>
              <View style={styles.merchantRow}>
                {merchantInfo?.logo_url || offer.store_logo ? (
                  <Image
                    source={{ uri: merchantInfo?.logo_url || offer.store_logo }}
                    style={styles.merchantLogo}
                  />
                ) : (
                  <View style={[styles.merchantLogo, styles.logoPlaceholder]}>
                    <Store size={24} color={COLORS.primary} />
                  </View>
                )}
                <View style={styles.merchantInfo}>
                  <Text style={styles.merchantName}>
                    {merchantInfo?.company_name || offer.store_name || 'Mağaza'}
                  </Text>
                  {(merchantInfo?.address || merchantInfo?.city) && (
                    <View style={styles.merchantLocation}>
                      <MapPin size={14} color={COLORS.textLight} />
                      <Text style={styles.merchantAddress}>
                        {merchantInfo?.address}, {merchantInfo?.city}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Merchant Actions */}
              <View style={styles.merchantActions}>
                {merchantInfo?.phone && (
                  <TouchableOpacity style={styles.merchantActionButton}>
                    <Phone size={18} color={COLORS.primary} />
                    <Text style={styles.merchantActionText}>Ara</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.merchantActionButton}>
                  <Navigation size={18} color={COLORS.primary} />
                  <Text style={styles.merchantActionText}>Yol Tarifi</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Distance */}
          {offer.distance_m && (
            <View style={styles.distanceRow}>
              <MapPin size={16} color={COLORS.textLight} />
              <Text style={styles.distanceText}>
                {offer.distance_m < 1000
                  ? `${Math.round(offer.distance_m)} m uzaklıkta`
                  : `${(offer.distance_m / 1000).toFixed(1)} km uzaklıkta`}
              </Text>
            </View>
          )}

          {/* Quantity Selector */}
          <View style={styles.quantitySection}>
            <Text style={styles.sectionTitle}>Miktar Seçin</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
                onPress={decrementQuantity}
                disabled={quantity <= 1}
              >
                <Minus size={20} color={quantity <= 1 ? COLORS.textLight : COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  quantity >= (offer.quantity_available || 1) && styles.quantityButtonDisabled,
                ]}
                onPress={incrementQuantity}
                disabled={quantity >= (offer.quantity_available || 1)}
              >
                <Plus
                  size={20}
                  color={
                    quantity >= (offer.quantity_available || 1)
                      ? COLORS.textLight
                      : COLORS.text
                  }
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Total */}
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Toplam</Text>
            <Text style={styles.totalValue}>
              {((offer.discounted_price || offer.price_after || 0) * quantity).toFixed(2)}₺
            </Text>
          </View>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Reserve Button - Fixed at bottom */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.reserveButton,
            (loading || !offer.quantity_available || offer.quantity_available < 1) &&
              styles.reserveButtonDisabled,
          ]}
          onPress={handleReserve}
          disabled={loading || !offer.quantity_available || offer.quantity_available < 1}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.reserveButtonText}>
              {offer.quantity_available && offer.quantity_available > 0
                ? 'Rezervasyon Yap'
                : 'Stokta Yok'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButtonActive: {
    backgroundColor: '#FFF3E0',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.7,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  discountText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: COLORS.textLight,
    lineHeight: 24,
    marginBottom: 16,
  },
  priceSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  originalPrice: {
    fontSize: 18,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  savingsText: {
    fontSize: 14,
    color: COLORS.success,
    marginTop: 8,
  },
  infoCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 8,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 4,
  },
  merchantSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  merchantCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  merchantLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
  },
  logoPlaceholder: {
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  merchantInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  merchantLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  merchantAddress: {
    fontSize: 14,
    color: COLORS.textLight,
    flex: 1,
  },
  merchantActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  merchantActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  merchantActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  distanceText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  quantitySection: {
    marginBottom: 16,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 8,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginHorizontal: 32,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  reserveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  reserveButtonDisabled: {
    backgroundColor: COLORS.textLight,
  },
  reserveButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
