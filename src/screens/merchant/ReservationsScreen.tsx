import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Check,
  User,
  Calendar,
} from 'lucide-react-native';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/authStore';
import type { Reservation } from '../../types';

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
  info: '#2196F3',
};

interface ReservationsScreenProps {
  onBack: () => void;
}

type FilterType = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

const FILTER_CONFIG: Record<FilterType, { label: string; color: string }> = {
  all: { label: 'Tümü', color: COLORS.primary },
  pending: { label: 'Bekleyen', color: COLORS.warning },
  confirmed: { label: 'Onaylanan', color: COLORS.info },
  completed: { label: 'Tamamlanan', color: COLORS.success },
  cancelled: { label: 'İptal', color: COLORS.error },
};

function getStatusConfig(status: string) {
  switch (status) {
    case 'pending':
      return { label: 'Bekliyor', color: COLORS.warning, bgColor: '#FFF8E1' };
    case 'confirmed':
      return { label: 'Onaylandı', color: COLORS.info, bgColor: '#E3F2FD' };
    case 'completed':
      return { label: 'Tamamlandı', color: COLORS.success, bgColor: '#E8F5E9' };
    case 'cancelled':
      return { label: 'İptal Edildi', color: COLORS.error, bgColor: '#FFEBEE' };
    default:
      return { label: status, color: COLORS.textLight, bgColor: '#F5F5F5' };
  }
}

export default function ReservationsScreen({ onBack }: ReservationsScreenProps) {
  const { user } = useAuthStore();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    if (user) {
      fetchReservations();
    }
  }, [user]);

  const fetchReservations = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          quantity,
          status,
          created_at,
          client_id,
          offer_id,
          offers (
            id,
            title,
            image_url,
            price_after,
            available_from,
            available_until
          ),
          profiles:client_id (
            full_name
          )
        `)
        .eq('merchant_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Rezervasyonları yükleme hatası:', error);
        Alert.alert('Hata', 'Rezervasyonlar yüklenemedi');
        return;
      }

      const formattedReservations: Reservation[] = (data || []).map((item: any) => ({
        id: item.id,
        offer_id: item.offer_id,
        client_id: item.client_id,
        quantity: item.quantity,
        status: item.status,
        created_at: item.created_at,
        offer: item.offers ? {
          id: item.offers.id,
          title: item.offers.title,
          image_url: item.offers.image_url,
          price_after: item.offers.price_after,
          pickup_start_time: item.offers.available_from,
          pickup_end_time: item.offers.available_until,
        } : undefined,
        client_name: item.profiles?.full_name || 'Müşteri',
      }));

      setReservations(formattedReservations);
    } catch (err) {
      console.error('Rezervasyon hatası:', err);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const updateReservationStatus = async (
    reservationId: string,
    newStatus: 'confirmed' | 'cancelled' | 'completed'
  ) => {
    setActionLoading(reservationId);
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', reservationId);

      if (error) {
        Alert.alert('Hata', 'Durum güncellenemedi');
        return;
      }

      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservationId ? { ...r, status: newStatus } : r
        )
      );

      const messages = {
        confirmed: 'Rezervasyon onaylandı',
        cancelled: 'Rezervasyon reddedildi',
        completed: 'Rezervasyon tamamlandı',
      };
      Alert.alert('Başarılı', messages[newStatus]);
    } catch (err) {
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAccept = (reservation: Reservation) => {
    Alert.alert(
      'Rezervasyonu Onayla',
      `${reservation.client_name} için ${reservation.quantity} adetlik rezervasyonu onaylamak istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Onayla',
          onPress: () => updateReservationStatus(reservation.id, 'confirmed'),
        },
      ]
    );
  };

  const handleReject = (reservation: Reservation) => {
    Alert.alert(
      'Rezervasyonu Reddet',
      `Bu rezervasyonu reddetmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Reddet',
          style: 'destructive',
          onPress: () => updateReservationStatus(reservation.id, 'cancelled'),
        },
      ]
    );
  };

  const handleComplete = (reservation: Reservation) => {
    Alert.alert(
      'Teslim Edildi',
      `Müşteri ürünü teslim aldı mı?`,
      [
        { text: 'Hayır', style: 'cancel' },
        {
          text: 'Evet, Tamamlandı',
          onPress: () => updateReservationStatus(reservation.id, 'completed'),
        },
      ]
    );
  };

  const filteredReservations = reservations.filter((r) =>
    filter === 'all' ? true : r.status === filter
  );

  const renderReservationItem = ({ item }: { item: Reservation }) => {
    const statusConfig = getStatusConfig(item.status);
    const isActionLoading = actionLoading === item.id;
    const isPending = item.status === 'pending';
    const isConfirmed = item.status === 'confirmed';

    const formatTime = (time?: string) => {
      if (!time) return '--:--';
      return time.slice(0, 5);
    };

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return (
      <View style={styles.reservationCard}>
        <View style={styles.reservationRow}>
          {item.offer?.image_url ? (
            <Image source={{ uri: item.offer.image_url }} style={styles.offerImage} />
          ) : (
            <View style={[styles.offerImage, styles.imagePlaceholder]}>
              <Package size={24} color={COLORS.textLight} />
            </View>
          )}

          <View style={styles.reservationInfo}>
            <Text style={styles.offerTitle} numberOfLines={1}>
              {item.offer?.title || 'Teklif'}
            </Text>
            <View style={styles.clientRow}>
              <User size={14} color={COLORS.textLight} />
              <Text style={styles.clientName}>{item.client_name}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.quantityText}>Adet: {item.quantity}</Text>
              <Text style={styles.priceText}>
                {((item.offer?.price_after || 0) * item.quantity).toFixed(2)}₺
              </Text>
            </View>
            <View style={styles.timeRow}>
              <Clock size={12} color={COLORS.textLight} />
              <Text style={styles.timeText}>
                Teslim: {formatTime(item.offer?.pickup_start_time)} - {formatTime(item.offer?.pickup_end_time)}
              </Text>
            </View>
            <View style={styles.dateRow}>
              <Calendar size={12} color={COLORS.textLight} />
              <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Actions based on status */}
        {(isPending || isConfirmed) && (
          <View style={styles.actionsRow}>
            {isPending && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.acceptButton]}
                  onPress={() => handleAccept(item)}
                  disabled={isActionLoading}
                >
                  {isActionLoading ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <>
                      <CheckCircle size={18} color={COLORS.white} />
                      <Text style={styles.actionButtonText}>Onayla</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleReject(item)}
                  disabled={isActionLoading}
                >
                  <XCircle size={18} color={COLORS.white} />
                  <Text style={styles.actionButtonText}>Reddet</Text>
                </TouchableOpacity>
              </>
            )}
            {isConfirmed && (
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={() => handleComplete(item)}
                disabled={isActionLoading}
              >
                {isActionLoading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Check size={18} color={COLORS.white} />
                    <Text style={styles.actionButtonText}>Teslim Edildi</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rezervasyonlar</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={Object.entries(FILTER_CONFIG) as [FilterType, { label: string; color: string }][]}
          keyExtractor={([key]) => key}
          contentContainerStyle={styles.filtersList}
          renderItem={({ item: [key, config] }) => {
            const isSelected = filter === key;
            const count = key === 'all'
              ? reservations.length
              : reservations.filter((r) => r.status === key).length;

            return (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  isSelected && { backgroundColor: config.color },
                ]}
                onPress={() => setFilter(key)}
              >
                <Text
                  style={[
                    styles.filterText,
                    isSelected && styles.filterTextSelected,
                  ]}
                >
                  {config.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Reservations List */}
      <FlatList
        data={filteredReservations}
        keyExtractor={(item) => item.id}
        renderItem={renderReservationItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchReservations}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Package size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>
              {filter === 'all' ? 'Henüz rezervasyon yok' : 'Bu kategoride rezervasyon yok'}
            </Text>
            <Text style={styles.emptySubtext}>
              Yeni rezervasyonlar burada görünecek
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
  filtersContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filtersList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  filterTextSelected: {
    color: COLORS.white,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  reservationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  reservationRow: {
    flexDirection: 'row',
  },
  offerImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 12,
  },
  imagePlaceholder: {
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reservationInfo: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  clientName: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  quantityText: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  acceptButton: {
    backgroundColor: COLORS.success,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
  },
  completeButton: {
    backgroundColor: COLORS.primary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
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
    textAlign: 'center',
  },
});
