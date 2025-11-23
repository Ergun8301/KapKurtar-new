import { supabase } from '../config/supabase';
import type { Offer, GetOffersNearbyDynamicResponse, OfferCategory } from '../types';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';

// Map merchant categories to our categories
const mapCategory = (merchantCategory?: string): OfferCategory => {
  const categoryMap: Record<string, OfferCategory> = {
    'boulangerie': 'bakery',
    'bakery': 'bakery',
    'restaurant': 'restaurant',
    'epicerie': 'grocery',
    'grocery': 'grocery',
    'cafe': 'cafe',
    'coffee': 'cafe',
    'supermarche': 'supermarket',
    'supermarket': 'supermarket',
  };

  const key = merchantCategory?.toLowerCase() || '';
  return categoryMap[key] || 'other';
};

// Get offers nearby using client's stored location
export const getNearbyOffers = async (
  clientId: string,
  radiusKm: number = 10
): Promise<Offer[]> => {
  try {
    const radiusMeters = Math.round(radiusKm * 1000);

    const { data, error } = await supabase.rpc('get_offers_nearby_dynamic_v2', {
      p_client_id: clientId,
      p_radius_meters: radiusMeters,
    });

    if (error) {
      console.error('Erreur RPC get_offers_nearby_dynamic_v2:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    const offers: Offer[] = (data as GetOffersNearbyDynamicResponse[]).map((offer) => ({
      id: offer.id,
      title: offer.title,
      description: offer.description || '',
      original_price: parseFloat(offer.price_before),
      discounted_price: parseFloat(offer.price_after),
      discount_percentage: offer.discount_percent,
      image_url: offer.image_url || DEFAULT_IMAGE,
      pickup_start: offer.available_from || '',
      pickup_end: offer.available_until || '',
      quantity_available: offer.quantity,
      latitude: offer.offer_lat || 0,
      longitude: offer.offer_lng || 0,
      store_id: offer.merchant_id,
      store_name: offer.merchant_name || 'Marchand',
      store_address: '',
      store_logo: offer.merchant_logo,
      category: mapCategory(),
      is_active: true,
      created_at: offer.created_at || new Date().toISOString(),
      distance_m: Math.round(offer.distance_meters),
    }));

    return offers;
  } catch (err) {
    console.error('Erreur getNearbyOffers:', err);
    return [];
  }
};

// Get all active offers (fallback without location)
export const getActiveOffers = async (): Promise<Offer[]> => {
  try {
    const { data, error } = await supabase
      .from('offers')
      .select(`
        id,
        title,
        description,
        price_before,
        price_after,
        discount_percent,
        image_url,
        available_from,
        available_until,
        quantity,
        created_at,
        merchant_id,
        merchants (
          id,
          company_name,
          logo_url,
          street,
          city,
          postal_code,
          latitude,
          longitude
        )
      `)
      .eq('is_active', true)
      .gt('quantity', 0)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur getActiveOffers:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    const offers: Offer[] = data.map((offer: any) => {
      const merchant = offer.merchants;
      const address = merchant
        ? [merchant.street, merchant.city, merchant.postal_code]
            .filter(Boolean)
            .join(', ')
        : '';

      return {
        id: offer.id,
        title: offer.title,
        description: offer.description || '',
        original_price: parseFloat(offer.price_before) || 0,
        discounted_price: parseFloat(offer.price_after) || 0,
        discount_percentage: offer.discount_percent || 0,
        image_url: offer.image_url || DEFAULT_IMAGE,
        pickup_start: offer.available_from || '',
        pickup_end: offer.available_until || '',
        quantity_available: offer.quantity || 0,
        latitude: merchant?.latitude || 41.0082,
        longitude: merchant?.longitude || 28.9784,
        store_id: offer.merchant_id || '',
        store_name: merchant?.company_name || 'Marchand',
        store_address: address,
        store_logo: merchant?.logo_url,
        category: mapCategory(),
        is_active: true,
        created_at: offer.created_at || new Date().toISOString(),
      };
    });

    return offers;
  } catch (err) {
    console.error('Erreur getActiveOffers:', err);
    return [];
  }
};

// Get offers by merchant
export const getMerchantOffers = async (merchantId: string): Promise<Offer[]> => {
  try {
    const { data, error } = await supabase
      .from('offers')
      .select(`
        id,
        title,
        description,
        price_before,
        price_after,
        discount_percent,
        image_url,
        available_from,
        available_until,
        quantity,
        is_active,
        created_at,
        merchant_id,
        merchants (
          id,
          company_name,
          logo_url,
          street,
          city,
          postal_code,
          latitude,
          longitude
        )
      `)
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur getMerchantOffers:', error);
      return [];
    }

    if (!data) return [];

    const offers: Offer[] = data.map((offer: any) => {
      const merchant = offer.merchants;
      const address = merchant
        ? [merchant.street, merchant.city, merchant.postal_code]
            .filter(Boolean)
            .join(', ')
        : '';

      return {
        id: offer.id,
        title: offer.title,
        description: offer.description || '',
        original_price: parseFloat(offer.price_before) || 0,
        discounted_price: parseFloat(offer.price_after) || 0,
        discount_percentage: offer.discount_percent || 0,
        image_url: offer.image_url || DEFAULT_IMAGE,
        pickup_start: offer.available_from || '',
        pickup_end: offer.available_until || '',
        quantity_available: offer.quantity || 0,
        latitude: merchant?.latitude || 41.0082,
        longitude: merchant?.longitude || 28.9784,
        store_id: offer.merchant_id || '',
        store_name: merchant?.company_name || 'Marchand',
        store_address: address,
        store_logo: merchant?.logo_url,
        category: mapCategory(),
        is_active: offer.is_active,
        created_at: offer.created_at || new Date().toISOString(),
      };
    });

    return offers;
  } catch (err) {
    console.error('Erreur getMerchantOffers:', err);
    return [];
  }
};

// Toggle offer active status (for merchants)
export const toggleOfferActive = async (
  offerId: string,
  merchantId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('offers')
      .update({ is_active: isActive })
      .eq('id', offerId)
      .eq('merchant_id', merchantId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
};
