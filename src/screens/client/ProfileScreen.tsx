import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Package,
  Heart,
  Settings,
  LogOut,
  ChevronRight,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { getClientReservations } from '../../api/reservations';
import type { Reservation } from '../../types';

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

export default function ProfileScreen() {
  const { user, profile, signOut, role } = useAuthStore();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchReservations();
    }
  }, [user]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const data = await getClientReservations();
      setReservations(data);
    } catch (err) {
      console.error('Rezervasyon hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return COLORS.success;
      case 'pending':
        return COLORS.warning;
      case 'cancelled':
      case 'expired':
        return COLORS.error;
      default:
        return COLORS.textLight;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Onaylandı';
      case 'pending':
        return 'Beklemede';
      case 'cancelled':
        return 'İptal Edildi';
      case 'expired':
        return 'Süresi Doldu';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle size={16} color={COLORS.success} />;
      case 'pending':
        return <Clock size={16} color={COLORS.warning} />;
      case 'cancelled':
      case 'expired':
        return <XCircle size={16} color={COLORS.error} />;
      default:
        return <Package size={16} color={COLORS.textLight} />;
    }
  };

  // Stats
  const confirmedCount = reservations.filter((r) => r.status === 'confirmed').length;
  const totalSaved = reservations
    .filter((r) => r.status === 'confirmed')
    .reduce((acc, r) => acc + (r.offer?.price_after || 0), 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchReservations}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <User size={40} color={COLORS.white} />
              </View>
            )}
          </View>
          <Text style={styles.userName}>
            {user?.full_name || profile?.first_name || 'Kullanıcı'}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {role === 'merchant' ? '🏪 İşletme' : '🍕 Müşteri'}
            </Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{confirmedCount}</Text>
            <Text style={styles.statLabel}>Sipariş</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalSaved}₺</Text>
            <Text style={styles.statLabel}>Tasarruf</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.floor(confirmedCount * 0.5)}kg</Text>
            <Text style={styles.statLabel}>CO₂ Tasarrufu</Text>
          </View>
        </View>

        {/* Recent Reservations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Son Siparişlerim</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>

          {reservations.length === 0 ? (
            <View style={styles.emptyReservations}>
              <Package size={40} color={COLORS.textLight} />
              <Text style={styles.emptyText}>Henüz sipariş yok</Text>
            </View>
          ) : (
            reservations.slice(0, 3).map((reservation) => (
              <View key={reservation.id} style={styles.reservationCard}>
                {reservation.merchant?.logo_url ? (
                  <Image
                    source={{ uri: reservation.merchant.logo_url }}
                    style={styles.reservationLogo}
                  />
                ) : (
                  <View style={[styles.reservationLogo, styles.logoPlaceholder]}>
                    <Package size={20} color={COLORS.textLight} />
                  </View>
                )}
                <View style={styles.reservationInfo}>
                  <Text style={styles.reservationTitle} numberOfLines={1}>
                    {reservation.offer?.title || 'Sipariş'}
                  </Text>
                  <Text style={styles.reservationStore}>
                    {reservation.merchant?.company_name || 'İşletme'}
                  </Text>
                  <View style={styles.statusRow}>
                    {getStatusIcon(reservation.status)}
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(reservation.status) },
                      ]}
                    >
                      {getStatusText(reservation.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.reservationPrice}>
                  {reservation.offer?.price_after || 0}₺
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Menu Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hesabım</Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <User size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.menuText}>Profil Bilgilerim</Text>
            <ChevronRight size={20} color={COLORS.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Package size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.menuText}>Tüm Siparişlerim</Text>
            <ChevronRight size={20} color={COLORS.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Heart size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.menuText}>Favorilerim</Text>
            <ChevronRight size={20} color={COLORS.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <MapPin size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.menuText}>Adreslerim</Text>
            <ChevronRight size={20} color={COLORS.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Settings size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.menuText}>Ayarlar</Text>
            <ChevronRight size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <LogOut size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>

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
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyReservations: {
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
  reservationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  reservationLogo: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 12,
  },
  logoPlaceholder: {
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reservationInfo: {
    flex: 1,
  },
  reservationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  reservationStore: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reservationPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
});
