import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingBag, Store } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#00A690',
  secondary: '#F75C00',
  background: '#F7F2E7',
  white: '#FFFFFF',
  text: '#1A1A1A',
  textLight: '#666666',
};

interface WelcomeScreenProps {
  onSelectRole: (role: 'client' | 'merchant') => void;
}

export default function WelcomeScreen({ onSelectRole }: WelcomeScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🍕</Text>
          </View>
          <Text style={styles.appName}>KapKurtar</Text>
          <Text style={styles.tagline}>
            Tasarruf Et, İsrafı Önle,{'\n'}Dünyayı Kurtar
          </Text>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.description}>
            Gıda israfını azaltın, tasarruf edin ve çevreye katkıda bulunun.
          </Text>
        </View>

        {/* Role Selection */}
        <View style={styles.buttonsSection}>
          <Text style={styles.selectText}>Nasıl kullanmak istersiniz?</Text>

          {/* Client Button */}
          <TouchableOpacity
            style={styles.roleButton}
            onPress={() => onSelectRole('client')}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, { backgroundColor: COLORS.primary }]}>
              <ShoppingBag size={32} color={COLORS.white} />
            </View>
            <View style={styles.roleTextContainer}>
              <Text style={styles.roleTitle}>🍕 Kap Kurtar</Text>
              <Text style={styles.roleSubtitle}>
                Yakınımdaki fırsatları keşfet ve tasarruf et
              </Text>
            </View>
          </TouchableOpacity>

          {/* Merchant Button */}
          <TouchableOpacity
            style={styles.roleButton}
            onPress={() => onSelectRole('merchant')}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, { backgroundColor: COLORS.secondary }]}>
              <Store size={32} color={COLORS.white} />
            </View>
            <View style={styles.roleTextContainer}>
              <Text style={styles.roleTitle}>🏪 Sat Kurtar</Text>
              <Text style={styles.roleSubtitle}>
                Ürünlerini sat, israfı önle, kazanç sağla
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Devam ederek{' '}
            <Text style={styles.footerLink}>Kullanım Şartları</Text>
            {' '}ve{' '}
            <Text style={styles.footerLink}>Gizlilik Politikası</Text>
            'nı kabul etmiş olursunuz.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.primary,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  logoEmoji: {
    fontSize: 48,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 26,
  },
  descriptionSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  description: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonsSection: {
    gap: 16,
  },
  selectText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  roleSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  footer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
