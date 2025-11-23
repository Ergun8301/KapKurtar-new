import { supabase } from '../config/supabase';
import type { Reservation, ReservationStatus } from '../types';

// Create a reservation
export const createReservation = async (
  offerId: string,
  merchantId: string,
  quantity: number = 1
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      return { success: false, error: 'Échec de la récupération de la session: ' + sessionError.message };
    }

    if (!session || !session.user) {
      return { success: false, error: 'Vous devez être connecté pour faire une réservation' };
    }

    if (quantity < 1) {
      return { success: false, error: 'La quantité doit être au moins 1' };
    }

    // Call the RPC function to create reservation
    const { data, error } = await supabase.rpc('create_reservation_v2', {
      p_offer_id: offerId,
      p_quantity: quantity,
    });

    if (error) {
      console.error('Erreur création réservation:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message || 'Une erreur inattendue est survenue' };
  }
};

// Get client's reservations
export const getClientReservations = async (): Promise<Reservation[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return [];
    }

    const { data, error } = await supabase
      .from('reservations')
      .select(`
        id,
        client_id,
        merchant_id,
        offer_id,
        quantity,
        status,
        created_at,
        updated_at,
        offers (
          title,
          description,
          price_after,
          image_url
        ),
        merchants (
          company_name,
          city,
          logo_url
        )
      `)
      .eq('client_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur getClientReservations:', error);
      return [];
    }

    return (data || []).map((res: any) => ({
      id: res.id,
      client_id: res.client_id,
      merchant_id: res.merchant_id,
      offer_id: res.offer_id,
      quantity: res.quantity,
      status: res.status,
      created_at: res.created_at,
      updated_at: res.updated_at,
      offer: res.offers ? {
        title: res.offers.title,
        description: res.offers.description,
        price_after: res.offers.price_after,
        image_url: res.offers.image_url,
      } : undefined,
      merchant: res.merchants ? {
        company_name: res.merchants.company_name,
        city: res.merchants.city,
        logo_url: res.merchants.logo_url,
      } : undefined,
    }));
  } catch (err) {
    console.error('Erreur getClientReservations:', err);
    return [];
  }
};

// Get merchant's reservations
export const getMerchantReservations = async (): Promise<Reservation[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return [];
    }

    // First get the merchant profile
    const { data: merchantData, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();

    if (merchantError || !merchantData) {
      return [];
    }

    const { data, error } = await supabase
      .from('reservations')
      .select(`
        id,
        client_id,
        merchant_id,
        offer_id,
        quantity,
        status,
        created_at,
        updated_at,
        offers (
          title,
          description,
          price_after,
          image_url
        ),
        profiles (
          first_name,
          last_name
        )
      `)
      .eq('merchant_id', merchantData.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur getMerchantReservations:', error);
      return [];
    }

    return (data || []).map((res: any) => ({
      id: res.id,
      client_id: res.client_id,
      merchant_id: res.merchant_id,
      offer_id: res.offer_id,
      quantity: res.quantity,
      status: res.status,
      created_at: res.created_at,
      updated_at: res.updated_at,
      offer: res.offers ? {
        title: res.offers.title,
        description: res.offers.description,
        price_after: res.offers.price_after,
        image_url: res.offers.image_url,
      } : undefined,
    }));
  } catch (err) {
    console.error('Erreur getMerchantReservations:', err);
    return [];
  }
};

// Update reservation status
export const updateReservationStatus = async (
  reservationId: string,
  status: ReservationStatus
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('reservations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', reservationId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
};

// Cancel reservation
export const cancelReservation = async (reservationId: string) => {
  return updateReservationStatus(reservationId, 'cancelled');
};

// Confirm reservation
export const confirmReservation = async (reservationId: string) => {
  return updateReservationStatus(reservationId, 'confirmed');
};
