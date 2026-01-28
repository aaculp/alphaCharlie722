/**
 * Supabase Real-Time Integration
 * 
 * Integrates Supabase real-time subscriptions with React Query cache invalidation.
 * Automatically invalidates queries when database changes occur, ensuring users
 * see live updates without manual refreshing.
 * 
 * Subscriptions:
 * - Venue changes (INSERT, UPDATE, DELETE) -> Invalidate venue queries
 * - Check-in changes (INSERT) -> Invalidate check-in and venue queries
 * - Flash offer changes (INSERT, UPDATE, DELETE) -> Invalidate flash offer queries
 * - Review changes (INSERT, UPDATE, DELETE) -> Invalidate venue queries (for rating updates)
 * 
 * Usage:
 * ```typescript
 * const cleanup = setupRealtimeSync(queryClient);
 * // Later, when unmounting:
 * cleanup();
 * ```
 */

import { QueryClient } from '@tanstack/react-query';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { queryKeys } from './queryKeys';

/**
 * Subscribe to venue table changes and invalidate affected queries
 * 
 * Invalidates:
 * - Specific venue detail query when a venue is updated
 * - All venue list queries when any venue changes
 * 
 * @param queryClient - The React Query client instance
 * @returns Supabase channel for cleanup
 */
function subscribeToVenueUpdates(queryClient: QueryClient): RealtimeChannel {
  const channel = supabase
    .channel('venue-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'venues' },
      (payload) => {
        console.log('🔄 Real-time venue change:', payload.eventType);
        
        // Invalidate specific venue detail if we have the ID
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          const venueId = (payload.new as any)?.id;
          if (venueId) {
            queryClient.invalidateQueries({ 
              queryKey: queryKeys.venues.detail(venueId),
              exact: true, // Only invalidate this specific venue
            });
          }
        } else if (payload.eventType === 'DELETE') {
          const venueId = (payload.old as any)?.id;
          if (venueId) {
            queryClient.invalidateQueries({ 
              queryKey: queryKeys.venues.detail(venueId),
              exact: true, // Only invalidate this specific venue
            });
          }
        }
        
        // Always invalidate venue lists when any venue changes
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.venues.lists() 
        });
      }
    )
    .subscribe((status, error) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to venue changes');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Venue subscription error:', error);
      }
    });

  return channel;
}

/**
 * Subscribe to check-in table changes and invalidate affected queries
 * 
 * Invalidates:
 * - Check-in queries by venue
 * - Check-in queries by user
 * - Venue detail query (to update check-in count)
 * 
 * @param queryClient - The React Query client instance
 * @returns Supabase channel for cleanup
 */
function subscribeToCheckInUpdates(queryClient: QueryClient): RealtimeChannel {
  const channel = supabase
    .channel('checkin-changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'check_ins' },
      (payload) => {
        console.log('🔄 Real-time check-in:', payload.eventType);
        
        const checkIn = payload.new as any;
        const venueId = checkIn?.venue_id;
        const userId = checkIn?.user_id;
        
        // Invalidate check-in queries
        if (venueId) {
          queryClient.invalidateQueries({ 
            queryKey: queryKeys.checkIns.byVenue(venueId),
            exact: true, // Only invalidate this venue's check-ins
          });
          
          // Invalidate venue detail to update check-in count
          queryClient.invalidateQueries({ 
            queryKey: queryKeys.venues.detail(venueId),
            exact: true, // Only invalidate this specific venue
          });
        }
        
        if (userId) {
          queryClient.invalidateQueries({ 
            queryKey: queryKeys.checkIns.byUser(userId),
            exact: true, // Only invalidate this user's check-ins
          });
        }
      }
    )
    .subscribe((status, error) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to check-in changes');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Check-in subscription error:', error);
      }
    });

  return channel;
}

/**
 * Subscribe to flash offer table changes and invalidate affected queries
 * 
 * Invalidates:
 * - Flash offer queries by venue
 * - Venue detail query (flash offers may affect venue display)
 * 
 * @param queryClient - The React Query client instance
 * @returns Supabase channel for cleanup
 */
function subscribeToFlashOfferUpdates(queryClient: QueryClient): RealtimeChannel {
  const channel = supabase
    .channel('flash-offer-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'flash_offers' },
      (payload) => {
        console.log('🔄 Real-time flash offer change:', payload.eventType);
        
        let venueId: string | undefined;
        
        if (payload.eventType === 'DELETE') {
          venueId = (payload.old as any)?.venue_id;
        } else {
          venueId = (payload.new as any)?.venue_id;
        }
        
        if (venueId) {
          // Invalidate flash offer queries for this venue
          queryClient.invalidateQueries({ 
            queryKey: queryKeys.flashOffers.byVenue(venueId),
            exact: true, // Only invalidate this venue's flash offers
          });
          
          // Invalidate venue detail (may show flash offer badge)
          queryClient.invalidateQueries({ 
            queryKey: queryKeys.venues.detail(venueId),
            exact: true, // Only invalidate this specific venue
          });
        }
        
        // IMPORTANT: Invalidate same-day offers query for HomeScreen
        // This ensures new flash offers appear immediately on the homescreen
        // without waiting for the 2-minute refetch interval
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.flashOffers.sameDayOffers(),
        });
      }
    )
    .subscribe((status, error) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to flash offer changes');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Flash offer subscription error:', error);
      }
    });

  return channel;
}

/**
 * Subscribe to review table changes and invalidate affected queries
 * 
 * When reviews are added, updated, or deleted, the venue's aggregate_rating
 * and review_count are automatically updated by database triggers.
 * This subscription ensures the venue data is refreshed to show the new ratings.
 * 
 * Invalidates:
 * - Venue detail query (to update aggregate_rating and review_count)
 * - Venue list queries (to update ratings in lists)
 * 
 * @param queryClient - The React Query client instance
 * @returns Supabase channel for cleanup
 */
function subscribeToReviewUpdates(queryClient: QueryClient): RealtimeChannel {
  const channel = supabase
    .channel('review-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'reviews' },
      (payload) => {
        console.log('🔄 Real-time review change:', payload.eventType);
        
        let venueId: string | undefined;
        
        if (payload.eventType === 'DELETE') {
          venueId = (payload.old as any)?.venue_id;
        } else {
          venueId = (payload.new as any)?.venue_id;
        }
        
        if (venueId) {
          // Invalidate venue detail to update aggregate_rating and review_count
          queryClient.invalidateQueries({ 
            queryKey: queryKeys.venues.detail(venueId),
            exact: true, // Only invalidate this specific venue
          });
          
          // Invalidate venue lists to update ratings in lists
          queryClient.invalidateQueries({ 
            queryKey: queryKeys.venues.lists() 
          });
        }
      }
    )
    .subscribe((status, error) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to review changes');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Review subscription error:', error);
      }
    });

  return channel;
}

/**
 * Set up all real-time subscriptions for React Query integration
 * 
 * Subscribes to:
 * - Venue changes
 * - Check-in changes
 * - Flash offer changes
 * - Review changes
 * 
 * Returns a cleanup function that unsubscribes from all channels.
 * Call this function when the app unmounts or when you want to stop
 * receiving real-time updates.
 * 
 * @param queryClient - The React Query client instance
 * @returns Cleanup function that unsubscribes all channels
 * 
 * @example
 * ```typescript
 * // In App.tsx or root component
 * useEffect(() => {
 *   const cleanup = setupRealtimeSync(queryClient);
 *   return cleanup; // Cleanup on unmount
 * }, []);
 * ```
 */
export function setupRealtimeSync(queryClient: QueryClient): () => void {
  console.log('🚀 Setting up real-time sync...');
  
  // Subscribe to all channels
  const venueChannel = subscribeToVenueUpdates(queryClient);
  const checkInChannel = subscribeToCheckInUpdates(queryClient);
  const flashOfferChannel = subscribeToFlashOfferUpdates(queryClient);
  const reviewChannel = subscribeToReviewUpdates(queryClient);
  
  // Return cleanup function
  return () => {
    console.log('🧹 Cleaning up real-time subscriptions...');
    
    venueChannel.unsubscribe();
    checkInChannel.unsubscribe();
    flashOfferChannel.unsubscribe();
    reviewChannel.unsubscribe();
    
    console.log('✅ Real-time subscriptions cleaned up');
  };
}
