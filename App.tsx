import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import CustomerAuthScreen from './src/screens/CustomerAuthScreen';
import MerchantAuthScreen from './src/screens/MerchantAuthScreen';

// Navigation
import ClientTabs from './src/navigation/ClientTabs';

// Merchant Screens
import MerchantDashboardScreen from './src/screens/merchant/DashboardScreen';
import CreateOfferScreen from './src/screens/merchant/CreateOfferScreen';

// Store
import { useAuthStore } from './src/store/authStore';

// Types
import type { UserRole } from './src/types';

// KapKurtar colors
const COLORS = {
  primary: '#00A690',
  secondary: '#F75C00',
  background: '#F7F2E7',
  white: '#FFFFFF',
  text: '#1A1A1A',
  textLight: '#666666',
};

const Stack = createNativeStackNavigator();

type AppScreen = 'splash' | 'welcome' | 'customerAuth' | 'merchantAuth' | 'clientApp' | 'merchantApp';
type MerchantScreen = 'dashboard' | 'createOffer';

// Merchant App Navigator
function MerchantApp() {
  const [currentScreen, setCurrentScreen] = useState<MerchantScreen>('dashboard');

  if (currentScreen === 'createOffer') {
    return (
      <CreateOfferScreen
        onBack={() => setCurrentScreen('dashboard')}
        onSuccess={() => setCurrentScreen('dashboard')}
      />
    );
  }

  return (
    <MerchantDashboardScreen
      onCreateOffer={() => setCurrentScreen('createOffer')}
    />
  );
}

// Loading Screen
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

// Main App Content
function AppContent() {
  const { isAuthenticated, isLoading, checkAuth, user } = useAuthStore();
  const [showSplash, setShowSplash] = useState(true);
  const [selectedRole, setSelectedRole] = useState<'client' | 'merchant' | null>(null);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('splash');

  useEffect(() => {
    checkAuth();
  }, []);

  // Handle splash finish
  const handleSplashFinish = () => {
    setShowSplash(false);
    if (isAuthenticated && user) {
      // User is already authenticated, go directly to app
      if (user.role === 'merchant') {
        setCurrentScreen('merchantApp');
      } else {
        setCurrentScreen('clientApp');
      }
    } else {
      setCurrentScreen('welcome');
    }
  };

  // Handle role selection from welcome screen
  const handleSelectRole = (role: 'client' | 'merchant') => {
    setSelectedRole(role);
    if (role === 'client') {
      setCurrentScreen('customerAuth');
    } else {
      setCurrentScreen('merchantAuth');
    }
  };

  // Handle successful authentication
  useEffect(() => {
    if (isAuthenticated && user && !showSplash) {
      if (user.role === 'merchant') {
        setCurrentScreen('merchantApp');
      } else {
        setCurrentScreen('clientApp');
      }
    }
  }, [isAuthenticated, user, showSplash]);

  // Handle back from auth screens
  const handleBackToWelcome = () => {
    setSelectedRole(null);
    setCurrentScreen('welcome');
  };

  if (isLoading && !showSplash) {
    return <LoadingScreen />;
  }

  // Splash Screen
  if (showSplash || currentScreen === 'splash') {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  // Welcome Screen
  if (currentScreen === 'welcome') {
    return <WelcomeScreen onSelectRole={handleSelectRole} />;
  }

  // Customer Auth Screen
  if (currentScreen === 'customerAuth') {
    return <CustomerAuthScreen onBack={handleBackToWelcome} />;
  }

  // Merchant Auth Screen
  if (currentScreen === 'merchantAuth') {
    return <MerchantAuthScreen onBack={handleBackToWelcome} />;
  }

  // Merchant App
  if (currentScreen === 'merchantApp' || user?.role === 'merchant') {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MerchantApp" component={MerchantApp} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Client App (default)
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ClientTabs" component={ClientTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AppContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
