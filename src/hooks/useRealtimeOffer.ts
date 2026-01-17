import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { FlashOffer } from '../types/flashOffer.types';

export interface UseRealtimeOfferOptions {
  offerId: string;
  enabled?: boolean;
  onOfferUpdate?: (offer: FlashOffer) => void;
  onOfferExpired?: () => void;
  onOfferFull?: () => void;
}

export interface UseRealtimeOfferReturn {
  offer: FlashOffer | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to subscribe to real-time updates for a flash offer
 * 
 * Subscribes to Supabase real-time changes for:
 * - Claim count updates
 * - Status changes (active -> full, active -> expired)
 * - Any other offer modifications
 * 
 * Optimizations:
 * - Debounces rapid updates to prevent excessive re-renders
 * - Only subscribes when enabled
 * - Automatically unsubscribes on unmount
 * - Filters out duplicate updates
 * 
 * @param options - Configuration options
 * @returns Object containing offer data, loading state, error, and refetch function
 * 
 * @example
 * ```tsx
 * const { offer, loading } = useRealtimeOffer({
 *   offerId: 'offer-123',
 *   onOfferFull: () => Alert.alert('Offer Full', 'This offer has reached its claim limit'),
 *   onOfferExpired: () => Alert.alert('Offer Expired', 'This offer has expired')
 * });
 * ```
 */
export const useRealtimeOffer = (options: UseRealtimeOfferOptions): UseRealtimeOfferReturn => {
  const { offerId, enabled = true, onOfferUpdate, onOfferExpired, onOfferFull } = options;
  
  const [offer, setOffer] = useState<FlashOffer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Debounce timer ref to prevent rapid updates
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const DEBOUNCE_MS = 500; // Wait 500ms between updates

  const fetchOffer = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('flash_offers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (fetchError) throw fetchError;

      setOffer(data);
      
      if (onOfferUpdate) {
        onOfferUpdate(data);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch offer');
      setError(error);
      console.error('Error fetching offer:', error);
    } finally {
      setLoading(false);
    }
  }, [offerId, enabled, onOfferUpdate]);

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchOffer();

    // Set up real-time subscription with optimizations
    const subscription = supabase
      .channel(`offer:${offerId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'flash_offers',
          filter: `id=eq.${offerId}`,
        },
        (payload) => {
          // Debounce rapid updates
          const now = Date.now();
          if (now - lastUpdateRef.current < DEBOUNCE_MS) {
            // Clear existing timer and set a new one
            if (debounceTimerRef.current) {
              clearTimeout(debounceTimerRef.current);
            }
            
            debounceTimerRef.current = setTimeout(() => {
              processUpdate(payload);
              lastUpdateRef.current = Date.now();
            }, DEBOUNCE_MS);
          } else {
            // Process immediately if enough time has passed
            processUpdate(payload);
            lastUpdateRef.current = now;
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    const processUpdate = (payload: any) => {
      console.log('📡 Real-time offer update:', payload);
      
      const updatedOffer = payload.new as FlashOffer;
      const previousOffer = offer;
      
      // Check if the update is actually different (prevent duplicate updates)
      if (previousOffer && 
          previousOffer.claimed_count === updatedOffer.claimed_count &&
          previousOffer.status === updatedOffer.status &&
          previousOffer.updated_at === updatedOffer.updated_at) {
        console.log('📡 Skipping duplicate update');
        return;
      }
      
      setOffer(updatedOffer);
      
      if (onOfferUpdate) {
        onOfferUpdate(updatedOffer);
      }

      // Check for status changes
      if (previousOffer) {
        // Offer became full
        if (
          previousOffer.status !== 'full' &&
          (updatedOffer.status === 'full' || updatedOffer.claimed_count >= updatedOffer.max_claims)
        ) {
          console.log('🔴 Offer is now full');
          if (onOfferFull) {
            onOfferFull();
          }
        }

        // Offer expired
        if (previousOffer.status !== 'expired' && updatedOffer.status === 'expired') {
          console.log('⏰ Offer has expired');
          if (onOfferExpired) {
            onOfferExpired();
          }
        }
      }
    };

    return () => {
      console.log('🔌 Unsubscribing from offer updates');
      
      // Clear debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      subscription.unsubscribe();
    };
  }, [offerId, enabled, fetchOffer, offer, onOfferUpdate, onOfferExpired, onOfferFull]);

  return {
    offer,
    loading,
    error,
    refetch: fetchOffer,
  };
};
