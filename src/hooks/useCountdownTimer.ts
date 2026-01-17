import { useState, useEffect } from 'react';

export interface CountdownResult {
  timeRemaining: string;
  isExpired: boolean;
  totalSeconds: number;
}

/**
 * Hook to create a countdown timer that updates every second
 * 
 * @param endTime - ISO 8601 timestamp string for when the countdown ends
 * @returns Object containing formatted time remaining, expiration status, and total seconds
 * 
 * @example
 * const { timeRemaining, isExpired } = useCountdownTimer(offer.end_time);
 */
export const useCountdownTimer = (endTime: string): CountdownResult => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [totalSeconds, setTotalSeconds] = useState<number>(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const end = new Date(endTime);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expired');
        setIsExpired(true);
        setTotalSeconds(0);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const totalSecs = Math.floor(diff / 1000);

      setTotalSeconds(totalSecs);
      setIsExpired(false);

      // Format time remaining in human-readable format
      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  return {
    timeRemaining,
    isExpired,
    totalSeconds,
  };
};

/**
 * Hook to create a countdown timer for claim expiration
 * Similar to useCountdownTimer but with different formatting for shorter durations
 * 
 * @param expiresAt - ISO 8601 timestamp string for when the claim expires
 * @returns Object containing formatted time remaining, expiration status, and total seconds
 */
export const useClaimExpirationTimer = (expiresAt: string): CountdownResult => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [totalSeconds, setTotalSeconds] = useState<number>(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const expires = new Date(expiresAt);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expired');
        setIsExpired(true);
        setTotalSeconds(0);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const totalSecs = Math.floor(diff / 1000);

      setTotalSeconds(totalSecs);
      setIsExpired(false);

      // Format time remaining (shorter format for claims)
      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return {
    timeRemaining,
    isExpired,
    totalSeconds,
  };
};
