// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Offers: undefined;
  Profile: undefined;
};

// User types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  created_at: string;
}

// Offer types
export interface Offer {
  id: string;
  title: string;
  description: string;
  original_price: number;
  discounted_price: number;
  discount_percentage: number;
  image_url?: string;
  pickup_start: string;
  pickup_end: string;
  quantity_available: number;
  latitude: number;
  longitude: number;
  store_id: string;
  store_name: string;
  store_address: string;
  category: OfferCategory;
  is_active: boolean;
  created_at: string;
}

export type OfferCategory =
  | 'bakery'
  | 'restaurant'
  | 'grocery'
  | 'cafe'
  | 'supermarket'
  | 'other';

// Store types
export interface Store {
  id: string;
  name: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  image_url?: string;
  category: OfferCategory;
  rating: number;
  review_count: number;
  is_verified: boolean;
  created_at: string;
}

// Order types
export interface Order {
  id: string;
  user_id: string;
  offer_id: string;
  status: OrderStatus;
  quantity: number;
  total_price: number;
  pickup_code: string;
  created_at: string;
  picked_up_at?: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'ready'
  | 'picked_up'
  | 'cancelled';

// Location types
export interface Location {
  latitude: number;
  longitude: number;
}

// Auth types
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
