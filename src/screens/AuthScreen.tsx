import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Store } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';

// KapKurtar colors
const COLORS = {
  primary: '#00A690',
  secondary: '#F75C00',
  background: '#F7F2E7',
  white: '#FFFFFF',
  text: '#1A1A1A',
  textLight: '#666666',
  error: '#E53935',
  border: '#E0E0E0',
  google: '#4285F4',
};

type UserType = 'client' | 'merchant';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState<UserType>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { signIn, signUp, signInWithGoogle, signInWithGoogleForRole, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async () => {
    clearError();

    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (!isLogin) {
      if (!fullName) {
        Alert.alert('Erreur', 'Veuillez entrer votre nom complet');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
        return;
      }
    }

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, fullName);
      }
    } catch {
      // Error is handled by the store
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    try {
      await signInWithGoogleForRole(userType);
    } catch (err) {
      Alert.alert('Erreur', 'Échec de la connexion avec Google');
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    clearError();
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>KapKurtar</Text>
            </View>
            <Text style={styles.tagline}>Sauvez des repas, économisez</Text>
          </View>

          {/* User Type Toggle */}
          <View style={styles.userTypeContainer}>
            <Text style={styles.userTypeLabel}>Je suis</Text>
            <View style={styles.userTypeToggle}>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  userType === 'client' && styles.userTypeButtonActive,
                ]}
                onPress={() => setUserType('client')}
              >
                <User
                  size={20}
                  color={userType === 'client' ? COLORS.white : COLORS.text}
                />
                <Text
                  style={[
                    styles.userTypeText,
                    userType === 'client' && styles.userTypeTextActive,
                  ]}
                >
                  Client
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  userType === 'merchant' && styles.userTypeButtonActive,
                ]}
                onPress={() => setUserType('merchant')}
              >
                <Store
                  size={20}
                  color={userType === 'merchant' ? COLORS.white : COLORS.text}
                />
                <Text
                  style={[
                    styles.userTypeText,
                    userType === 'merchant' && styles.userTypeTextActive,
                  ]}
                >
                  Commerçant
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.title}>
              {isLogin ? 'Connexion' : 'Créer un compte'}
            </Text>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Google Sign In Button */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Image
                source={{ uri: 'https://www.google.com/favicon.ico' }}
                style={styles.googleIcon}
              />
              <Text style={styles.googleButtonText}>
                Continuer avec Google
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nom complet</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Votre nom"
                  placeholderTextColor={COLORS.textLight}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="votre@email.com"
                placeholderTextColor={COLORS.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirmer le mot de passe</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.textLight}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isLogin ? 'Se connecter' : "S'inscrire"}
                </Text>
              )}
            </TouchableOpacity>

            {isLogin && (
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Toggle Section */}
          <View style={styles.toggleSection}>
            <Text style={styles.toggleText}>
              {isLogin ? "Pas encore de compte ?" : 'Déjà un compte ?'}
            </Text>
            <TouchableOpacity onPress={toggleMode}>
              <Text style={styles.toggleLink}>
                {isLogin ? "S'inscrire" : 'Se connecter'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoText}>
              {userType === 'client'
                ? '🛒 Trouvez des offres anti-gaspi près de chez vous'
                : '🏪 Proposez vos invendus et réduisez le gaspillage'}
            </Text>
          </View>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  logoContainer: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  userTypeContainer: {
    marginBottom: 20,
  },
  userTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  userTypeToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  userTypeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  userTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  userTypeTextActive: {
    color: COLORS.white,
  },
  formSection: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 12,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: COLORS.textLight,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
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
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  toggleSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  toggleText: {
    color: COLORS.textLight,
    fontSize: 14,
  },
  toggleLink: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
});
