/**
 * useStateCache Hook
 * 
 * React hook for accessing the StateCache singleton instance.
 * Provides easy access to claim state caching functionality in components.
 * 
 * Usage:
 * ```tsx
 * const stateCache = useStateCache();
 * const claim = stateCache.getClaim(claimId);
 * ```
 */

import { useEffect, useState } from 'react';
import { stateCache } from '../utils/cache/StateCache';

/**
 * Hook to access the StateCache singleton
 * Ensures cache is initialized before use
 */
export function useStateCache() {
  const [isReady, setIsReady] = useState(stateCache.isInitialized());

  useEffect(() => {
    // Initialize cache if not already initialized
    if (!stateCache.isInitialized()) {
      stateCache.initialize().then(() => {
        setIsReady(true);
      });
    }
  }, []);

  return {
    cache: stateCache,
    isReady,
  };
}
