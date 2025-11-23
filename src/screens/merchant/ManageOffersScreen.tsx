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
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  AlertCircle,
} from 'lucide-react-native';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/authStore';
import { getMerchantOffers, toggleOfferActive, deleteOffer } from '../../api/offers';
import type { Offer } from '../../types';

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

interface ManageOffersScreenProps {
  onBack: () => void;
  onEditOffer: (offer: Offer) => void;
}

type OfferStatus = 'active' | 'inactive' | 'expired' | 'sold_out';

function getOfferStatus(offer: Offer): OfferStatus {
  const now = new Date();
  const expiresAt = offer.expires_at ? new Date(offer.expires_at) : null;

  if (expiresAt && expiresAt < now) {
    return 'expired';
  }
  if ((offer.quantity_available || 0) <= 0) {
    return 'sold_out';
  }
  if (!offer.is_active) {
    return 'inactive';
  }
  return 'active';
}

function getStatusConfig(status: OfferStatus) {
  switch (status) {
    case 'active':
      return { label: 'Aktif', color: COLORS.success, bgColor: '#E8F5E9' };
    case 'inactive':
      return { label: 'Pasif', color: COLORS.textLight, bgColor: '#F5F5F5' };
    case 'expired':
      return { label: 'Süresi Doldu', color: COLORS.error, bgColor: '#FFEBEE' };
    case 'sold_out':
      return { label: 'Tükendi', color: COLORS.warning, bgColor: '#FFF8E1' };
  }
}

export default function ManageOffersScreen({
  onBack,
  onEditOffer,
}: ManageOffersScreenProps) {
  const { user } = useAuthStore();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchOffers();
    }
  }, [user]);

  const fetchOffers = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getMerchantOffers(user.id);
      setOffers(data);
    } catch (err) {
      console.error('Teklifleri yükleme hatası:', err);
      Alert.alert('Hata', 'Teklifler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (offer: Offer) => {
    if (!user) return;

    setActionLoading(offer.id);
    try {
      const result = await toggleOfferActive(offer.id, user.id, !offer.is_active);
      if (result.success) {
        setOffers((prev) =>
          prev.map((o) =>
            o.id === offer.id ? { ...o, is_active: !offer.is_active } : o
          )
        );
      } else {
        Alert.alert('Hata', result.error || 'Durum değiştirilemedi');
      }
    } catch (err) {
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteOffer = async (offer: Offer) => {
    Alert.alert(
      'Teklifi Sil',
      `"${offer.title}" teklifini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;

            setActionLoading(offer.id);
            try {
              const result = await deleteOffer(offer.id, user.id);
              if (result.success) {
                setOffers((prev) => prev.filter((o) => o.id !== offer.id));
                Alert.alert('Başarılı', 'Teklif silindi');
              } else {
                Alert.alert('Hata', result.error || 'Teklif silinemedi');
              }
            } catch (err) {
              Alert.alert('Hata', 'Bir hata oluştu');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const renderOfferItem = ({ item }: { item: Offer }) => {
    const status = getOfferStatus(item);
    const statusConfig = getStatusConfig(status);
    const isActionLoading = actionLoading === item.id;

    return (
      <View style={styles.offerCard}>
        <View style={styles.offerRow}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.offerImage} />
          ) : (
            <View style={[styles.offerImage, styles.imagePlaceholder]}>
              <Package size={24} color={COLORS.textLight} />
            </View>
          )}

          <View style={styles.offerInfo}>
            <Text style={styles.offerTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.priceRow}>
              <Text style={styles.originalPrice}>{item.original_price}₺</Text>
              <Text style={styles.discountedPrice}>{item.discounted_price}₺</Text>
            </View>
            <View style={styles.metaRow}>
              <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                <Text style={[styles.statusText, { color: statusConfig.color }]}>
                  {statusConfig.label}
                </Text>
              </View>
              <Text style={styles.stockText}>
                Stok: {item.quantity_available || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => onEditOffer(item)}
            disabled={isActionLoading}
          >
            <Edit3 size={18} color={COLORS.primary} />
            <Text style={[styles.actionText, { color: COLORS.primary }]}>Düzenle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.toggleButton]}
            onPress={() => handleToggleStatus(item)}
            disabled={isActionLoading || status === 'expired'}
          >
            {isActionLoading ? (
              <ActivityIndicator size="small" color={COLORS.textLight} />
            ) : item.is_active ? (
              <>
                <EyeOff size={18} color={COLORS.warning} />
                <Text style={[styles.actionText, { color: COLORS.warning }]}>Gizle</Text>
              </>
            ) : (
              <>
                <Eye size={18} color={COLORS.success} />
                <Text style={[styles.actionText, { color: COLORS.success }]}>Aktifleştir</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteOffer(item)}
            disabled={isActionLoading}
          >
            <Trash2 size={18} color={COLORS.error} />
            <Text style={[styles.actionText, { color: COLORS.error }]}>Sil</Text>
          </TouchableOpacity>
        </View>
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
        <Text style={styles.headerTitle}>Tekliflerimi Yönet</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {offers.filter((o) => getOfferStatus(o) === 'active').length}
          </Text>
          <Text style={styles.summaryLabel}>Aktif</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {offers.filter((o) => getOfferStatus(o) === 'inactive').length}
          </Text>
          <Text style={styles.summaryLabel}>Pasif</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {offers.filter((o) => getOfferStatus(o) === 'sold_out').length}
          </Text>
          <Text style={styles.summaryLabel}>Tükenen</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {offers.filter((o) => getOfferStatus(o) === 'expired').length}
          </Text>
          <Text style={styles.summaryLabel}>Süresi Dolan</Text>
        </View>
      </View>

      {/* Offers List */}
      <FlatList
        data={offers}
        keyExtractor={(item) => item.id}
        renderItem={renderOfferItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchOffers}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Package size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>Henüz teklif yok</Text>
            <Text style={styles.emptySubtext}>
              Yeni teklif oluşturmak için geri dönün
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
  summary: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  offerCard: {
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
  offerRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  offerImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
  },
  imagePlaceholder: {
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stockText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  editButton: {
    backgroundColor: '#E3F2FD',
  },
  toggleButton: {
    backgroundColor: '#FFF8E1',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
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
