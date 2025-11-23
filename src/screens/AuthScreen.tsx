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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
};

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { signIn, signUp, isLoading, error, clearError } = useAuthStore();

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
    marginTop: 40,
    marginBottom: 32,
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
    marginBottom: 24,
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
});
