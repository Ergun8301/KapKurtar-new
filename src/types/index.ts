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

// User role type
export type UserRole = 'merchant' | 'client' | 'none';

// User types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  created_at: string;
  role?: UserRole;
}

// Profile from Supabase RPC
export interface UserProfile {
  id: string;
  auth_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar_url?: string;
  has_location: boolean;
  halal?: boolean;
  vegan?: boolean;
  eco_friendly?: boolean;
  created_at?: string;
}

// Merchant types
export interface Merchant {
  id: string;
  auth_id: string;
  company_name: string;
  description?: string;
  street?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  logo_url?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  review_count?: number;
  is_verified?: boolean;
  created_at?: string;
}

// Offer types matching Sepet's structure
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
  store_logo?: string;
  category: OfferCategory;
  is_active: boolean;
  created_at: string;
  distance_m?: number;
}

// NearbyOffer from Supabase RPC
export interface NearbyOffer {
  id: string;
  merchant_id: string;
  merchant_name: string;
  merchant_logo?: string;
  merchant_street?: string;
  merchant_city?: string;
  merchant_postal_code?: string;
  title: string;
  description: string;
  image_url: string | null;
  price_before: number;
  price_after: number;
  discount_percent: number;
  available_from: string;
  available_until: string;
  quantity: number;
  distance_m: number;
  offer_lat?: number;
  offer_lng?: number;
  created_at?: string;
}

// Supabase RPC response types
export interface GetOffersNearbyDynamicResponse {
  id: string;
  merchant_id: string;
  merchant_name?: string;
  merchant_logo?: string;
  title: string;
  description?: string;
  image_url?: string;
  price_before: string;
  price_after: string;
  discount_percent: number;
  available_from?: string;
  available_until?: string;
  quantity: number;
  distance_meters: number;
  created_at?: string;
  offer_lat?: number;
  offer_lng?: number;
}

export interface EnsureProfileExistsResponse {
  id: string;
  auth_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar_url?: string;
  has_location: boolean;
  halal?: boolean;
  vegan?: boolean;
  eco_friendly?: boolean;
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
  logo_url?: string;
  category: OfferCategory;
  rating: number;
  review_count: number;
  is_verified: boolean;
  created_at: string;
}

// Reservation types
export interface Reservation {
  id: string;
  client_id: string;
  merchant_id: string;
  offer_id: string;
  quantity: number;
  status: ReservationStatus;
  created_at: string;
  updated_at: string;
  offer?: {
    title: string;
    description: string;
    price_after: number;
    image_url: string | null;
  };
  merchant?: {
    company_name: string;
    city: string;
    logo_url?: string;
  };
}

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'expired'
  | 'cancelled';

// Order types (legacy compatibility)
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
  profile: UserProfile | null;
  role: UserRole;
  isLoading: boolean;
  isAuthenticated: boolean;
  initialized: boolean;
}
