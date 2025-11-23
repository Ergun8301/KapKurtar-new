/**
 * HomeScreen - Placeholder (Mapbox temporarily disabled)
 *
 * This screen previously displayed a Mapbox map with nearby offers.
 * Mapbox has been temporarily disabled due to 401 authentication issues.
 * Users are redirected to use the Offers tab or MapScreen (list view) instead.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Map, Tag, AlertCircle } from 'lucide-react-native';

// KapKurtar colors
const COLORS = {
  primary: '#00A690',
  secondary: '#F75C00',
  background: '#F7F2E7',
  white: '#FFFFFF',
  text: '#1A1A1A',
  textLight: '#666666',
  info: '#2196F3',
};

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>KapKurtar</Text>
          <Text style={styles.headerSubtitle}>Yakınındaki fırsatları keşfet</Text>
        </View>

        {/* Map Disabled Notice */}
        <View style={styles.noticeCard}>
          <View style={styles.iconContainer}>
            <Map size={48} color={COLORS.info} />
          </View>
          <Text style={styles.noticeTitle}>Harita Geçici Olarak Devre Dışı</Text>
          <Text style={styles.noticeText}>
            Harita özelliği şu anda bakım altındadır.
            Teklifleri görüntülemek için aşağıdaki sekmeleri kullanabilirsiniz.
          </Text>

          <View style={styles.infoBox}>
            <AlertCircle size={16} color={COLORS.info} />
            <Text style={styles.infoText}>
              "Teklifler" veya "Harita" sekmesinde tüm teklifleri liste olarak görebilirsiniz.
            </Text>
          </View>
        </View>

        {/* Feature Cards */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureCard}>
            <Tag size={24} color={COLORS.primary} />
            <Text style={styles.featureTitle}>İndirimli Teklifler</Text>
            <Text style={styles.featureText}>%50'ye varan indirimlerle gıda israfını önleyin</Text>
          </View>

          <View style={styles.featureCard}>
            <Map size={24} color={COLORS.secondary} />
            <Text style={styles.featureTitle}>Yakınımdaki Mağazalar</Text>
            <Text style={styles.featureText}>Konumunuza göre en yakın teklifleri bulun</Text>
          </View>
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
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 4,
  },
  noticeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 40,
    padding: 16,
    marginBottom: 16,
  },
  noticeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  noticeText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.info,
  },
  featuresContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  featureCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 8,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
});
