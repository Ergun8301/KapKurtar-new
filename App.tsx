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
import ManageOffersScreen from './src/screens/merchant/ManageOffersScreen';
import EditOfferScreen from './src/screens/merchant/EditOfferScreen';
import ReservationsScreen from './src/screens/merchant/ReservationsScreen';

// Services
import { registerForPushNotifications, setupNotificationListeners } from './src/services/notifications';

// Store
import { useAuthStore } from './src/store/authStore';

// Types
import type { Offer } from './src/types';

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
type MerchantScreen = 'dashboard' | 'createOffer' | 'manageOffers' | 'editOffer' | 'reservations';

// Merchant App Navigator
function MerchantApp() {
  const [currentScreen, setCurrentScreen] = useState<MerchantScreen>('dashboard');
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  const handleEditOffer = (offer: Offer) => {
    setSelectedOffer(offer);
    setCurrentScreen('editOffer');
  };

  const handleBackToDashboard = () => {
    setSelectedOffer(null);
    setCurrentScreen('dashboard');
  };

  const handleBackToManageOffers = () => {
    setSelectedOffer(null);
    setCurrentScreen('manageOffers');
  };

  if (currentScreen === 'createOffer') {
    return (
      <CreateOfferScreen
        onBack={handleBackToDashboard}
        onSuccess={handleBackToDashboard}
      />
    );
  }

  if (currentScreen === 'manageOffers') {
    return (
      <ManageOffersScreen
        onBack={handleBackToDashboard}
        onEditOffer={handleEditOffer}
      />
    );
  }

  if (currentScreen === 'editOffer' && selectedOffer) {
    return (
      <EditOfferScreen
        offer={selectedOffer}
        onBack={handleBackToManageOffers}
        onSuccess={handleBackToManageOffers}
      />
    );
  }

  if (currentScreen === 'reservations') {
    return (
      <ReservationsScreen
        onBack={handleBackToDashboard}
      />
    );
  }

  return (
    <MerchantDashboardScreen
      onCreateOffer={() => setCurrentScreen('createOffer')}
      onManageOffers={() => setCurrentScreen('manageOffers')}
      onViewReservations={() => setCurrentScreen('reservations')}
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

  // Setup push notifications when user is authenticated
  useEffect(() => {
    if (user) {
      registerForPushNotifications();

      // Setup notification listeners
      const cleanup = setupNotificationListeners(
        (notification) => {
          console.log('Notification received:', notification);
        },
        (response) => {
          console.log('Notification response:', response);
          // Handle navigation based on notification data here
        }
      );

      return cleanup;
    }
  }, [user]);

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
