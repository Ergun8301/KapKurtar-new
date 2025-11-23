import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Settings,
  Heart,
  ShoppingBag,
  HelpCircle,
  LogOut,
  ChevronRight,
  Bell,
  CreditCard,
  Shield,
} from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';

// KapKurtar colors
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

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  showBadge?: boolean;
  isDestructive?: boolean;
}

function MenuItem({ icon, label, onPress, showBadge, isDestructive }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View
          style={[
            styles.menuItemIcon,
            isDestructive && { backgroundColor: '#FFEBEE' },
          ]}
        >
          {icon}
        </View>
        <Text
          style={[styles.menuItemLabel, isDestructive && { color: COLORS.error }]}
        >
          {label}
        </Text>
      </View>
      <View style={styles.menuItemRight}>
        {showBadge && <View style={styles.badge} />}
        <ChevronRight size={20} color={COLORS.textLight} />
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, signOut, isLoading } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const handleMenuPress = (item: string) => {
    // Handle menu item press
    console.log('Pressed:', item);
    Alert.alert(item, 'Cette fonctionnalité sera bientôt disponible');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mon Profil</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {user?.avatar_url ? (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </Text>
              </View>
            ) : (
              <View style={styles.avatar}>
                <User size={32} color={COLORS.white} />
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.full_name || 'Utilisateur'}
            </Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleMenuPress('Modifier le profil')}
          >
            <Text style={styles.editButtonText}>Modifier</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Repas sauvés</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>156₺</Text>
            <Text style={styles.statLabel}>Économisés</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>8kg</Text>
            <Text style={styles.statLabel}>CO₂ évité</Text>
          </View>
        </View>

        {/* Menu Sections */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Mon compte</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon={<ShoppingBag size={20} color={COLORS.primary} />}
              label="Mes commandes"
              onPress={() => handleMenuPress('Mes commandes')}
            />
            <MenuItem
              icon={<Heart size={20} color={COLORS.primary} />}
              label="Mes favoris"
              onPress={() => handleMenuPress('Mes favoris')}
            />
            <MenuItem
              icon={<CreditCard size={20} color={COLORS.primary} />}
              label="Paiement"
              onPress={() => handleMenuPress('Paiement')}
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Paramètres</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon={<Bell size={20} color={COLORS.primary} />}
              label="Notifications"
              onPress={() => handleMenuPress('Notifications')}
              showBadge
            />
            <MenuItem
              icon={<Shield size={20} color={COLORS.primary} />}
              label="Confidentialité"
              onPress={() => handleMenuPress('Confidentialité')}
            />
            <MenuItem
              icon={<Settings size={20} color={COLORS.primary} />}
              label="Paramètres"
              onPress={() => handleMenuPress('Paramètres')}
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Support</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon={<HelpCircle size={20} color={COLORS.primary} />}
              label="Aide et FAQ"
              onPress={() => handleMenuPress('Aide et FAQ')}
            />
          </View>
        </View>

        {/* Logout */}
        <View style={styles.menuSection}>
          <View style={styles.menuCard}>
            <MenuItem
              icon={<LogOut size={20} color={COLORS.error} />}
              label="Déconnexion"
              onPress={handleSignOut}
              isDestructive
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>KapKurtar</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appTagline}>Sauvez des repas, économisez</Text>
        </View>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  editButton: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  menuSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  menuSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textLight,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingBottom: 100,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  appVersion: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  appTagline: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
  },
});
