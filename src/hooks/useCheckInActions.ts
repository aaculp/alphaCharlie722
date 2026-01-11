import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CheckInService } from '../services/api/checkins';
import type { CheckIn } from '../types';

export interface UseCheckInActionsOptions {
  onCheckInSuccess?: (checkIn: CheckIn) => void;
  onCheckOutSuccess?: () => void;
  onError?: (error: Error) => void;
}

export interface UseCheckInActionsReturn {
  checkIn: (venueId: string) => Promise<boolean>;
  checkOut: (checkInId: string) => Promise<boolean>;
  loading: boolean;
  error: Error | null;
}

/**
 * Custom hook for check-in and check-out actions
 * 
 * @param options - Options including success and error callbacks
 * @returns Check-in/check-out functions, loading state, and error state
 * 
 * @example
 * ```tsx
 * const { checkIn, checkOut, loading } = useCheckInActions({
 *   onCheckInSuccess: (checkIn) => {
 *     console.log('Checked in!', checkIn);
 *     refetchStats();
 *   },
 *   onCheckOutSuccess: () => {
 *     console.log('Checked out!');
 *     refetchStats();
 *   },
 *   onError: (error) => {
 *     Alert.alert('Error', error.message);
 *   }
 * });
 * 
 * // Check in to a venue
 * await checkIn('venue-123');
 * 
 * // Check out from a venue
 * await checkOut('checkin-456');
 * ```
 */
export function useCheckInActions(options: UseCheckInActionsOptions = {}): UseCheckInActionsReturn {
  const { onCheckInSuccess, onCheckOutSuccess, onError } = options;
  const { user } = useAuth();
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const checkIn = useCallback(async (venueId: string): Promise<boolean> => {
    // Check authentication
    if (!user?.id) {
      const authError = new Error('You must be logged in to check in');
      setError(authError);
      onError?.(authError);
      return false;
    }

    // Prevent duplicate requests
    if (loading) {
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const checkInData = await CheckInService.checkIn(venueId, user.id);
      
      onCheckInSuccess?.(checkInData);
      return true;
    } catch (err) {
      const checkInError = err instanceof Error ? err : new Error('Failed to check in');
      setError(checkInError);
      onError?.(checkInError);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, loading, onCheckInSuccess, onError]);

  const checkOut = useCallback(async (checkInId: string): Promise<boolean> => {
    // Check authentication
    if (!user?.id) {
      const authError = new Error('You must be logged in to check out');
      setError(authError);
      onError?.(authError);
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      await CheckInService.checkOut(checkInId, user.id);
      
      onCheckOutSuccess?.();
      return true;
    } catch (err) {
      const checkOutError = err instanceof Error ? err : new Error('Failed to check out');
      setError(checkOutError);
      onError?.(checkOutError);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, onCheckOutSuccess, onError]);

  return {
    checkIn,
    checkOut,
    loading,
    error,
  };
}
