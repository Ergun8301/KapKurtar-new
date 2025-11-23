import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, MapPin, Trash2 } from 'lucide-react-native';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/authStore';

const COLORS = {
  primary: '#00A690',
  secondary: '#F75C00',
  background: '#F7F2E7',
  white: '#FFFFFF',
  text: '#1A1A1A',
  textLight: '#666666',
  border: '#E0E0E0',
  error: '#E53935',
};

interface FavoriteMerchant {
  id: string;
  merchant_id: string;
  company_name: string;
  logo_url?: string;
  city?: string;
}

export default function FavoritesScreen() {
  const { user } = useAuthStore();
  const [favorites, setFavorites] = useState<FavoriteMerchant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          merchant_id,
          merchants (
            company_name,
            logo_url,
            city
          )
        `)
        .eq('client_id', user.id);

      if (error) {
        console.error('Favori yükleme hatası:', error);
        return;
      }

      const formattedFavorites: FavoriteMerchant[] = (data || []).map((item: any) => ({
        id: item.id,
        merchant_id: item.merchant_id,
        company_name: item.merchants?.company_name || 'Bilinmeyen İşletme',
        logo_url: item.merchants?.logo_url,
        city: item.merchants?.city,
      }));

      setFavorites(formattedFavorites);
    } catch (err) {
      console.error('Favori hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    Alert.alert(
      'Favorilerden Kaldır',
      'Bu işletmeyi favorilerinizden kaldırmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('id', favoriteId);

              if (error) {
                Alert.alert('Hata', 'Favori kaldırılamadı');
                return;
              }

              setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
            } catch (err) {
              Alert.alert('Hata', 'Bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const renderFavoriteItem = ({ item }: { item: FavoriteMerchant }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        {item.logo_url ? (
          <Image source={{ uri: item.logo_url }} style={styles.logo} />
        ) : (
          <View style={[styles.logo, styles.logoPlaceholder]}>
            <Heart size={24} color={COLORS.primary} />
          </View>
        )}
        <View style={styles.infoContainer}>
          <Text style={styles.merchantName}>{item.company_name}</Text>
          {item.city && (
            <View style={styles.locationRow}>
              <MapPin size={14} color={COLORS.textLight} />
              <Text style={styles.locationText}>{item.city}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFavorite(item.id)}
        >
          <Trash2 size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Heart size={64} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>Giriş Yapın</Text>
          <Text style={styles.emptyText}>
            Favorilerinizi görmek için giriş yapmanız gerekiyor.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favorilerim</Text>
        <Text style={styles.headerSubtitle}>
          {favorites.length} favori işletme
        </Text>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={renderFavoriteItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchFavorites}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Heart size={64} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>Henüz favori yok</Text>
            <Text style={styles.emptyText}>
              Beğendiğiniz işletmeleri favorilere ekleyin ve tekliflerini kaçırmayın!
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  logoPlaceholder: {
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  merchantName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  removeButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
});
