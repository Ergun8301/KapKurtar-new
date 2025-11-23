import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Map, Tag, Heart, User, Bell } from 'lucide-react-native';

// Client screens
import MapScreen from '../screens/client/MapScreen';
import OffersScreen from '../screens/OffersScreen';
import FavoritesScreen from '../screens/client/FavoritesScreen';
import ProfileScreen from '../screens/client/ProfileScreen';
import NotificationsScreen from '../screens/client/NotificationsScreen';

const Tab = createBottomTabNavigator();

const COLORS = {
  primary: '#00A690',
  secondary: '#F75C00',
  background: '#F7F2E7',
  white: '#FFFFFF',
  text: '#1A1A1A',
  textLight: '#666666',
  inactive: '#9E9E9E',
};

interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
}

export default function ClientTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="Offers"
        component={OffersScreen}
        options={{
          tabBarLabel: 'Teklifler',
          tabBarIcon: ({ focused, color, size }: TabBarIconProps) => (
            <Tag size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarLabel: 'Harita',
          tabBarIcon: ({ focused, color, size }: TabBarIconProps) => (
            <Map size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          tabBarLabel: 'Favoriler',
          tabBarIcon: ({ focused, color, size }: TabBarIconProps) => (
            <Heart size={size} color={color} fill={focused ? color : 'none'} />
          ),
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Bildirimler',
          tabBarIcon: ({ focused, color, size }: TabBarIconProps) => (
            <View>
              <Bell size={size} color={color} />
              {/* Badge can be added here */}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ focused, color, size }: TabBarIconProps) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    height: 85,
    paddingTop: 8,
    paddingBottom: 25,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
