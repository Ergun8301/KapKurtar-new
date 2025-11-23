import { create } from 'zustand';
import { getNearbyOffers, getActiveOffers } from '../api/offers';
import type { Offer, OfferCategory } from '../types';

// Mock data for fallback when no Supabase connection
const mockOffers: Offer[] = [
  {
    id: '1',
    title: 'Panier Surprise Boulangerie',
    description: 'Pain, viennoiseries et pâtisseries du jour',
    original_price: 45,
    discounted_price: 15,
    discount_percentage: 67,
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
    pickup_start: '18:00',
    pickup_end: '19:30',
    quantity_available: 5,
    latitude: 41.0082,
    longitude: 28.9784,
    store_id: '1',
    store_name: 'Simit Sarayı',
    store_address: 'Taksim, Istanbul',
    category: 'bakery',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Box Repas Restaurant',
    description: 'Plats cuisinés du jour - kebab, pide, lahmacun',
    original_price: 80,
    discounted_price: 30,
    discount_percentage: 63,
    image_url: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=400',
    pickup_start: '21:00',
    pickup_end: '22:00',
    quantity_available: 3,
    latitude: 41.0136,
    longitude: 28.9550,
    store_id: '2',
    store_name: 'Karaköy Lokantası',
    store_address: 'Karaköy, Istanbul',
    category: 'restaurant',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Fruits & Légumes du Marché',
    description: 'Assortiment de fruits et légumes frais de saison',
    original_price: 60,
    discounted_price: 20,
    discount_percentage: 67,
    image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
    pickup_start: '17:00',
    pickup_end: '18:30',
    quantity_available: 8,
    latitude: 41.0180,
    longitude: 28.9700,
    store_id: '3',
    store_name: 'Kadıköy Pazarı',
    store_address: 'Kadıköy, Istanbul',
    category: 'grocery',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Café Gourmet Box',
    description: 'Pâtisseries, sandwichs et café à emporter',
    original_price: 55,
    discounted_price: 18,
    discount_percentage: 67,
    image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
    pickup_start: '19:00',
    pickup_end: '20:00',
    quantity_available: 4,
    latitude: 41.0317,
    longitude: 28.9744,
    store_id: '4',
    store_name: 'Mandabatmaz',
    store_address: 'Beyoğlu, Istanbul',
    category: 'cafe',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'Panier Supermarché',
    description: 'Produits variés proche de la date limite',
    original_price: 100,
    discounted_price: 35,
    discount_percentage: 65,
    image_url: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400',
    pickup_start: '20:00',
    pickup_end: '21:00',
    quantity_available: 10,
    latitude: 41.0422,
    longitude: 29.0083,
    store_id: '5',
    store_name: 'Migros',
    store_address: 'Beşiktaş, Istanbul',
    category: 'supermarket',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '6',
    title: 'Desserts Traditionnels',
    description: 'Baklava, künefe et autres douceurs turques',
    original_price: 70,
    discounted_price: 25,
    discount_percentage: 64,
    image_url: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=400',
    pickup_start: '18:30',
    pickup_end: '19:30',
    quantity_available: 6,
    latitude: 41.0053,
    longitude: 28.9770,
    store_id: '6',
    store_name: 'Karaköy Güllüoğlu',
    store_address: 'Karaköy, Istanbul',
    category: 'bakery',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

interface OffersStore {
  offers: Offer[];
  selectedOffer: Offer | null;
  isLoading: boolean;
  error: string | null;
  filterCategory: OfferCategory | null;
  radiusKm: number;
  useMockData: boolean;

  // Actions
  fetchOffers: (clientId?: string) => Promise<void>;
  fetchNearbyOffers: (clientId: string, radiusKm?: number) => Promise<void>;
  selectOffer: (offer: Offer | null) => void;
  setFilterCategory: (category: OfferCategory | null) => void;
  setRadiusKm: (radius: number) => void;
  getFilteredOffers: () => Offer[];
  refreshOffers: () => Promise<void>;
}

export const useOffersStore = create<OffersStore>((set, get) => ({
  offers: [],
  selectedOffer: null,
  isLoading: false,
  error: null,
  filterCategory: null,
  radiusKm: 10,
  useMockData: false,

  fetchOffers: async (clientId?: string) => {
    set({ isLoading: true, error: null });
    try {
      let offers: Offer[] = [];

      if (clientId) {
        // Try to fetch nearby offers with location
        offers = await getNearbyOffers(clientId, get().radiusKm);
      }

      // If no offers from nearby, try active offers
      if (offers.length === 0) {
        offers = await getActiveOffers();
      }

      // If still no offers, use mock data
      if (offers.length === 0) {
        console.log('Utilisation des données de démonstration');
        offers = mockOffers;
        set({ offers, isLoading: false, useMockData: true });
      } else {
        set({ offers, isLoading: false, useMockData: false });
      }
    } catch (error) {
      console.error('Erreur fetchOffers:', error);
      // Fallback to mock data on error
      set({ offers: mockOffers, isLoading: false, useMockData: true });
    }
  },

  fetchNearbyOffers: async (clientId: string, radiusKm?: number) => {
    const radius = radiusKm || get().radiusKm;
    set({ isLoading: true, error: null });

    try {
      const offers = await getNearbyOffers(clientId, radius);

      if (offers.length === 0) {
        // Try active offers as fallback
        const activeOffers = await getActiveOffers();
        if (activeOffers.length === 0) {
          set({ offers: mockOffers, isLoading: false, useMockData: true });
        } else {
          set({ offers: activeOffers, isLoading: false, useMockData: false });
        }
      } else {
        set({ offers, isLoading: false, useMockData: false });
      }
    } catch (error) {
      console.error('Erreur fetchNearbyOffers:', error);
      set({ offers: mockOffers, isLoading: false, useMockData: true });
    }
  },

  selectOffer: (offer) => set({ selectedOffer: offer }),

  setFilterCategory: (category) => set({ filterCategory: category }),

  setRadiusKm: (radius) => set({ radiusKm: radius }),

  getFilteredOffers: () => {
    const { offers, filterCategory } = get();
    if (!filterCategory) return offers;
    return offers.filter((offer) => offer.category === filterCategory);
  },

  refreshOffers: async () => {
    const { fetchOffers } = get();
    await fetchOffers();
  },
}));
