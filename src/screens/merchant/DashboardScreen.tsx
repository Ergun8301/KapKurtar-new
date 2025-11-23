import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Plus,
  Package,
  Clock,
  TrendingUp,
  Settings,
  LogOut,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { getMerchantOffers, toggleOfferActive } from '../../api/offers';
import { getMerchantReservations } from '../../api/reservations';
import type { Offer, Reservation } from '../../types';

const COLORS = {
  primary: '#00A690',
  secondary: '#F75C00',
  background: '#F7F2E7',
  white: '#FFFFFF',
  text: '#1A1A1A',
  textLight: '#666666',
  border: '#E0E0E0',
  success: '#4CAF50',
  error: '#E53935',
  warning: '#FFA000',
};

interface MerchantDashboardProps {
  onCreateOffer: () => void;
}

export default function MerchantDashboardScreen({ onCreateOffer }: MerchantDashboardProps) {
  const { user, signOut } = useAuthStore();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [offersData, reservationsData] = await Promise.all([
        getMerchantOffers(user.id),
        getMerchantReservations(),
      ]);
      setOffers(offersData);
      setReservations(reservationsData);
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOffer = async (offerId: string, currentStatus: boolean) => {
    if (!user) return;

    const result = await toggleOfferActive(offerId, user.id, !currentStatus);
    if (result.success) {
      setOffers((prev) =>
        prev.map((o) =>
          o.id === offerId ? { ...o, is_active: !currentStatus } : o
        )
      );
    } else {
      Alert.alert('Hata', result.error || 'Teklif durumu değiştirilemedi');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Çıkış Yap', style: 'destructive', onPress: signOut },
      ]
    );
  };

  // Stats
  const activeOffers = offers.filter((o) => o.is_active).length;
  const pendingReservations = reservations.filter((r) => r.status === 'pending').length;
  const todayRevenue = reservations
    .filter((r) => r.status === 'confirmed')
    .reduce((acc, r) => acc + (r.offer?.price_after || 0), 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchData}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Merhaba,</Text>
            <Text style={styles.merchantName}>
              {user?.full_name || 'İşletme'}
            </Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.iconButton}>
              <Settings size={24} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleSignOut}>
              <LogOut size={24} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
            <TrendingUp size={24} color={COLORS.white} />
            <Text style={styles.statValue}>{todayRevenue}₺</Text>
            <Text style={styles.statLabel}>Bugünkü Gelir</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.secondary }]}>
            <Package size={24} color={COLORS.white} />
            <Text style={styles.statValue}>{activeOffers}</Text>
            <Text style={styles.statLabel}>Aktif Teklif</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.warning }]}>
            <Clock size={24} color={COLORS.white} />
            <Text style={styles.statValue}>{pendingReservations}</Text>
            <Text style={styles.statLabel}>Bekleyen</Text>
          </View>
        </View>

        {/* Create Offer Button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={onCreateOffer}
        >
          <Plus size={24} color={COLORS.white} />
          <Text style={styles.createButtonText}>Yeni Teklif Oluştur</Text>
        </TouchableOpacity>

        {/* Pending Reservations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Bekleyen Rezervasyonlar ({pendingReservations})
          </Text>

          {pendingReservations === 0 ? (
            <View style={styles.emptyCard}>
              <Clock size={40} color={COLORS.textLight} />
              <Text style={styles.emptyText}>Bekleyen rezervasyon yok</Text>
            </View>
          ) : (
            reservations
              .filter((r) => r.status === 'pending')
              .slice(0, 5)
              .map((reservation) => (
                <View key={reservation.id} style={styles.reservationCard}>
                  <View style={styles.reservationInfo}>
                    <Text style={styles.reservationTitle}>
                      {reservation.offer?.title || 'Sipariş'}
                    </Text>
                    <Text style={styles.reservationQuantity}>
                      Adet: {reservation.quantity}
                    </Text>
                  </View>
                  <View style={styles.reservationActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.acceptButton]}
                    >
                      <CheckCircle size={20} color={COLORS.white} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                    >
                      <XCircle size={20} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
          )}
        </View>

        {/* My Offers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Tekliflerim ({offers.length})
          </Text>

          {offers.length === 0 ? (
            <View style={styles.emptyCard}>
              <Package size={40} color={COLORS.textLight} />
              <Text style={styles.emptyText}>Henüz teklif oluşturmadınız</Text>
              <TouchableOpacity
                style={styles.createSmallButton}
                onPress={onCreateOffer}
              >
                <Text style={styles.createSmallButtonText}>İlk Teklifi Oluştur</Text>
              </TouchableOpacity>
            </View>
          ) : (
            offers.map((offer) => (
              <View key={offer.id} style={styles.offerCard}>
                {offer.image_url ? (
                  <Image
                    source={{ uri: offer.image_url }}
                    style={styles.offerImage}
                  />
                ) : (
                  <View style={[styles.offerImage, styles.imagePlaceholder]}>
                    <Package size={24} color={COLORS.textLight} />
                  </View>
                )}
                <View style={styles.offerInfo}>
                  <Text style={styles.offerTitle} numberOfLines={1}>
                    {offer.title}
                  </Text>
                  <View style={styles.offerPriceRow}>
                    <Text style={styles.offerOriginalPrice}>
                      {offer.original_price}₺
                    </Text>
                    <Text style={styles.offerDiscountedPrice}>
                      {offer.discounted_price}₺
                    </Text>
                  </View>
                  <View style={styles.offerMeta}>
                    <View
                      style={[
                        styles.statusBadge,
                        offer.is_active
                          ? styles.activeBadge
                          : styles.inactiveBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          offer.is_active
                            ? styles.activeText
                            : styles.inactiveText,
                        ]}
                      >
                        {offer.is_active ? 'Aktif' : 'Pasif'}
                      </Text>
                    </View>
                    <Text style={styles.quantityText}>
                      Stok: {offer.quantity_available}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() => handleToggleOffer(offer.id, offer.is_active)}
                >
                  {offer.is_active ? (
                    <EyeOff size={20} color={COLORS.textLight} />
                  ) : (
                    <Eye size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  merchantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    gap: 8,
    marginBottom: 24,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
  },
  createSmallButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  createSmallButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  reservationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  reservationInfo: {
    flex: 1,
  },
  reservationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  reservationQuantity: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  reservationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: COLORS.success,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
  },
  offerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  offerImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 12,
  },
  imagePlaceholder: {
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerInfo: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  offerPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  offerOriginalPrice: {
    fontSize: 12,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
  offerDiscountedPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  offerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeBadge: {
    backgroundColor: '#E8F5E9',
  },
  inactiveBadge: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activeText: {
    color: COLORS.success,
  },
  inactiveText: {
    color: COLORS.error,
  },
  quantityText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  toggleButton: {
    padding: 8,
  },
});
