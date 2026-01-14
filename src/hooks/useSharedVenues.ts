import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { VenueShareService } from '../services/api/venueShare';
import type { VenueShare } from '../types/social.types';

export interface UseSharedVenuesOptions {
  autoLoad?: boolean;
  type?: 'received' | 'sent' | 'both';
}

export interface UseSharedVenuesReturn {
  receivedShares: VenueShare[];
  sentShares: VenueShare[];
  loading: boolean;
  error: Error | null;
  shareVenue: (venueId: string, toUserIds: string[], message?: string) => Promise<boolean>;
  markAsViewed: (shareId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for managing venue shares
 * 
 * @param options - Configuration options
 * @returns Shared venues data, loading state, error state, and sharing functions
 * 
 * @example
 * ```tsx
 * const {
 *   receivedShares,
 *   sentShares,
 *   loading,
 *   shareVenue,
 *   markAsViewed,
 * } = useSharedVenues();
 * 
 * // Share a venue with friends
 * await shareVenue('venue-123', ['friend-1', 'friend-2'], 'Check out this place!');
 * 
 * // Mark a share as viewed
 * await markAsViewed('share-456');
 * ```
 */
export function useSharedVenues(options: UseSharedVenuesOptions = {}): UseSharedVenuesReturn {
  const { autoLoad = true, type = 'both' } = options;
  const { user } = useAuth();

  const [receivedShares, setReceivedShares] = useState<VenueShare[]>([]);
  const [sentShares, setSentShares] = useState<VenueShare[]>([]);
  const [loading, setLoading] = useState<boolean>(autoLoad);
  const [error, setError] = useState<Error | null>(null);

  // Load shared venues
  const loadSharedVenues = useCallback(async () => {
    if (!user?.id) {
      setReceivedShares([]);
      setSentShares([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load based on type option
      if (type === 'received' || type === 'both') {
        const received = await VenueShareService.getReceivedShares(user.id);
        setReceivedShares(received);
      }

      if (type === 'sent' || type === 'both') {
        const sent = await VenueShareService.getSentShares(user.id);
        setSentShares(sent);
      }
    } catch (err) {
      const loadError = err instanceof Error ? err : new Error('Failed to load shared venues');
      setError(loadError);
      console.error('Error loading shared venues:', loadError);
    } finally {
      setLoading(false);
    }
  }, [user, type]);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad) {
      loadSharedVenues();
    }
  }, [autoLoad, loadSharedVenues]);

  // Share a venue with friends
  const shareVenue = useCallback(
    async (venueId: string, toUserIds: string[], message?: string): Promise<boolean> => {
      if (!user?.id) {
        console.warn('User must be logged in to share venues');
        return false;
      }

      if (!toUserIds || toUserIds.length === 0) {
        console.warn('Must specify at least one recipient to share venue');
        return false;
      }

      try {
        const shares = await VenueShareService.shareVenue(user.id, venueId, toUserIds, message);

        // Add to sent shares list if we're tracking sent shares
        if (type === 'sent' || type === 'both') {
          setSentShares((prev) => [...shares, ...prev]);
        }

        return true;
      } catch (err) {
        const shareError = err instanceof Error ? err : new Error('Failed to share venue');
        setError(shareError);
        console.error('Error sharing venue:', shareError);
        return false;
      }
    },
    [user, type]
  );

  // Mark a share as viewed
  const markAsViewed = useCallback(
    async (shareId: string): Promise<boolean> => {
      if (!user?.id) {
        console.warn('User must be logged in to mark shares as viewed');
        return false;
      }

      try {
        await VenueShareService.markShareAsViewed(shareId);

        // Update the share in received shares list
        setReceivedShares((prev) =>
          prev.map((share) =>
            share.id === shareId
              ? { ...share, viewed: true, viewed_at: new Date().toISOString() }
              : share
          )
        );

        return true;
      } catch (err) {
        const viewError = err instanceof Error ? err : new Error('Failed to mark share as viewed');
        setError(viewError);
        console.error('Error marking share as viewed:', viewError);
        return false;
      }
    },
    [user]
  );

  // Refetch shared venues
  const refetch = useCallback(async () => {
    await loadSharedVenues();
  }, [loadSharedVenues]);

  return {
    receivedShares,
    sentShares,
    loading,
    error,
    shareVenue,
    markAsViewed,
    refetch,
  };
}
