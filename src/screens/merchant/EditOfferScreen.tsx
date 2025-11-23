import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Camera,
  Package,
  Tag,
  Calendar,
  Clock,
  DollarSign,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/authStore';
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
};

interface EditOfferScreenProps {
  offer: Offer;
  onBack: () => void;
  onSuccess?: () => void;
}

export default function EditOfferScreen({ offer, onBack, onSuccess }: EditOfferScreenProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(offer.image_url || null);
  const [imageChanged, setImageChanged] = useState(false);

  // Form state - pre-filled with existing offer data
  const [title, setTitle] = useState(offer.title);
  const [description, setDescription] = useState(offer.description || '');
  const [originalPrice, setOriginalPrice] = useState(String(offer.original_price || ''));
  const [discountedPrice, setDiscountedPrice] = useState(String(offer.discounted_price || ''));
  const [quantity, setQuantity] = useState(String(offer.quantity_available || 1));
  const [pickupStartTime, setPickupStartTime] = useState(offer.pickup_start_time || '18:00');
  const [pickupEndTime, setPickupEndTime] = useState(offer.pickup_end_time || '20:00');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Hata', 'Fotoğraf erişimi için izin gerekli');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageChanged(true);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Hata', 'Kamera erişimi için izin gerekli');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageChanged(true);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Fotoğraf Değiştir',
      'Nasıl fotoğraf eklemek istersiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Galeri', onPress: pickImage },
        { text: 'Kamera', onPress: takePhoto },
      ]
    );
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Hata', 'Lütfen teklif başlığı girin');
      return false;
    }
    if (!originalPrice || isNaN(parseFloat(originalPrice))) {
      Alert.alert('Hata', 'Lütfen geçerli bir normal fiyat girin');
      return false;
    }
    if (!discountedPrice || isNaN(parseFloat(discountedPrice))) {
      Alert.alert('Hata', 'Lütfen geçerli bir indirimli fiyat girin');
      return false;
    }
    if (parseFloat(discountedPrice) >= parseFloat(originalPrice)) {
      Alert.alert('Hata', 'İndirimli fiyat normal fiyattan düşük olmalı');
      return false;
    }
    if (!quantity || parseInt(quantity) < 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir adet girin');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user) return;

    setLoading(true);
    try {
      let imageUrl = offer.image_url;

      // Upload new image if changed
      if (imageChanged && imageUri && !imageUri.startsWith('http')) {
        const fileName = `offer_${user.id}_${Date.now()}.jpg`;
        const formData = new FormData();
        formData.append('file', {
          uri: imageUri,
          name: fileName,
          type: 'image/jpeg',
        } as any);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('offer-images')
          .upload(fileName, formData);

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from('offer-images')
            .getPublicUrl(uploadData.path);
          imageUrl = urlData.publicUrl;
        }
      }

      // Update offer
      const { error } = await supabase
        .from('offers')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          original_price: parseFloat(originalPrice),
          discounted_price: parseFloat(discountedPrice),
          quantity_available: parseInt(quantity),
          pickup_start_time: pickupStartTime,
          pickup_end_time: pickupEndTime,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', offer.id)
        .eq('merchant_id', user.id);

      if (error) {
        console.error('Teklif güncelleme hatası:', error);
        Alert.alert('Hata', 'Teklif güncellenemedi. Lütfen tekrar deneyin.');
        return;
      }

      Alert.alert(
        'Başarılı',
        'Teklifiniz başarıyla güncellendi!',
        [
          {
            text: 'Tamam',
            onPress: () => {
              if (onSuccess) onSuccess();
              onBack();
            },
          },
        ]
      );
    } catch (err) {
      console.error('Teklif güncelleme hatası:', err);
      Alert.alert('Hata', 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const discountPercentage = originalPrice && discountedPrice
    ? Math.round((1 - parseFloat(discountedPrice) / parseFloat(originalPrice)) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Teklifi Düzenle</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Image Section */}
          <TouchableOpacity style={styles.imageSection} onPress={showImageOptions}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Camera size={40} color={COLORS.textLight} />
                <Text style={styles.imagePlaceholderText}>Fotoğraf Ekle</Text>
              </View>
            )}
            <View style={styles.changeImageBadge}>
              <Camera size={16} color={COLORS.white} />
            </View>
          </TouchableOpacity>

          {/* Form */}
          <View style={styles.form}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Package size={18} color={COLORS.primary} />
                <Text style={styles.label}>Teklif Başlığı *</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Örn: Sürpriz Paket"
                placeholderTextColor={COLORS.textLight}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Tag size={18} color={COLORS.primary} />
                <Text style={styles.label}>Açıklama</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Teklif hakkında detaylar..."
                placeholderTextColor={COLORS.textLight}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            </View>

            {/* Prices */}
            <View style={styles.priceRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <View style={styles.labelRow}>
                  <DollarSign size={18} color={COLORS.textLight} />
                  <Text style={styles.label}>Normal Fiyat *</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textLight}
                  value={originalPrice}
                  onChangeText={setOriginalPrice}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ width: 16 }} />
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <View style={styles.labelRow}>
                  <DollarSign size={18} color={COLORS.primary} />
                  <Text style={styles.label}>İndirimli Fiyat *</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.discountedInput]}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textLight}
                  value={discountedPrice}
                  onChangeText={setDiscountedPrice}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Discount Preview */}
            {discountPercentage > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>
                  %{discountPercentage} İndirim
                </Text>
              </View>
            )}

            {/* Quantity */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Package size={18} color={COLORS.primary} />
                <Text style={styles.label}>Mevcut Stok *</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="1"
                placeholderTextColor={COLORS.textLight}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="number-pad"
              />
            </View>

            {/* Pickup Time */}
            <View style={styles.timeRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <View style={styles.labelRow}>
                  <Clock size={18} color={COLORS.primary} />
                  <Text style={styles.label}>Başlangıç</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="18:00"
                  placeholderTextColor={COLORS.textLight}
                  value={pickupStartTime}
                  onChangeText={setPickupStartTime}
                />
              </View>
              <View style={{ width: 16 }} />
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <View style={styles.labelRow}>
                  <Clock size={18} color={COLORS.secondary} />
                  <Text style={styles.label}>Bitiş</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="20:00"
                  placeholderTextColor={COLORS.textLight}
                  value={pickupEndTime}
                  onChangeText={setPickupEndTime}
                />
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>Değişiklikleri Kaydet</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  imageSection: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 16,
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 8,
  },
  changeImageBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  priceRow: {
    flexDirection: 'row',
  },
  discountedInput: {
    borderColor: COLORS.primary,
    backgroundColor: '#E8F5E9',
  },
  discountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  discountText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  timeRow: {
    flexDirection: 'row',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
