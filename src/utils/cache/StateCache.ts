/**
 * StateCache
 * 
 * Manages local cache of claim states for real-time claim feedback feature.
 * 
 * Features:
 * - In-memory cache with Map data structure for fast access
 * - AsyncStorage persistence for offline access
 * - Timestamp validation to prevent stale data
 * - Synchronization with server on reconnection
 * - Cache invalidation and cleanup
 * 
 * Follows patterns from FlashOfferCache.ts and cachePersistence.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ClaimStatus } from '../../types/flashOfferClaim.types';

const CACHE_KEYS = {
  CLAIMS: '@state_cache:claims',
  LAST_SYNC: '@state_cache:last_sync',
};

/**
 * Cached claim interface
 * Represents a claim stored in the state cache with sync metadata
 */
export interface CachedClaim {
  claimId: string;
  userId: string;
  status: ClaimStatus;
  claimToken: string;
  promotionId: string;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
  lastSyncedAt: string;
}

/**
 * Partial claim update interface
 * Used for updating specific fields of a cached claim
 */
export interface ClaimUpdate {
  claimId: string;
  status?: ClaimStatus;
  updatedAt?: string;
  rejectionReason?: string;
}

/**
 * StateCache class
 * Singleton-style class for managing claim state cache
 */
export class StateCache {
  private cache: Map<string, CachedClaim>;
  private initialized: boolean = false;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Initialize cache from AsyncStorage
   * Should be called once when the app starts
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.CLAIMS);
      if (cached) {
        const parsed: Record<string, CachedClaim> = JSON.parse(cached);
        
        // Populate in-memory cache
        Object.entries(parsed).forEach(([claimId, claim]) => {
          this.cache.set(claimId, claim);
        });
        
        console.log(`✅ StateCache initialized with ${this.cache.size} claims`);
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing StateCache:', error);
      // Continue with empty cache
      this.initialized = true;
    }
  }

  /**
   * Get cached claim by ID
   * Returns null if claim is not in cache
   */
  getClaim(claimId: string): CachedClaim | null {
    return this.cache.get(claimId) || null;
  }

  /**
   * Update claim in cache with timestamp validation
   * Returns true if update was applied, false if rejected due to stale timestamp
   */
  updateClaim(claimId: string, update: Partial<CachedClaim>): boolean {
    const existing = this.cache.get(claimId);
    
    // If claim doesn't exist, create it
    if (!existing) {
      if (this.isValidNewClaim(update)) {
        const newClaim: CachedClaim = {
          claimId: update.claimId!,
          userId: update.userId!,
          status: update.status!,
          claimToken: update.claimToken!,
          promotionId: update.promotionId!,
          createdAt: update.createdAt!,
          updatedAt: update.updatedAt!,
          rejectionReason: update.rejectionReason,
          lastSyncedAt: new Date().toISOString(),
        };
        
        this.cache.set(claimId, newClaim);
        this.persistCache();
        return true;
      }
      
      console.warn('Cannot create claim: missing required fields', update);
      return false;
    }
    
    // Validate timestamp if updatedAt is provided
    if (update.updatedAt) {
      const existingTimestamp = new Date(existing.updatedAt).getTime();
      const updateTimestamp = new Date(update.updatedAt).getTime();
      
      // Reject stale updates
      if (updateTimestamp < existingTimestamp) {
        console.log(`🚫 Rejected stale update for claim ${claimId}: ${update.updatedAt} < ${existing.updatedAt}`);
        return false;
      }
    }
    
    // Apply update
    const updatedClaim: CachedClaim = {
      ...existing,
      ...update,
      lastSyncedAt: new Date().toISOString(),
    };
    
    this.cache.set(claimId, updatedClaim);
    this.persistCache();
    
    console.log(`✅ Updated claim ${claimId} in cache`);
    return true;
  }

  /**
   * Validate if a partial claim has all required fields for creation
   */
  private isValidNewClaim(claim: Partial<CachedClaim>): claim is CachedClaim {
    return !!(
      claim.claimId &&
      claim.userId &&
      claim.status &&
      claim.claimToken &&
      claim.promotionId &&
      claim.createdAt &&
      claim.updatedAt
    );
  }

  /**
   * Get all cached claims for a specific user
   * Returns empty array if no claims found
   */
  getUserClaims(userId: string): CachedClaim[] {
    const userClaims: CachedClaim[] = [];
    
    this.cache.forEach((claim) => {
      if (claim.userId === userId) {
        userClaims.push(claim);
      }
    });
    
    // Sort by creation date (newest first)
    return userClaims.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  /**
   * Clear all cached claims
   * Useful for logout or cache reset
   */
  async clear(): Promise<void> {
    try {
      this.cache.clear();
      await AsyncStorage.removeItem(CACHE_KEYS.CLAIMS);
      await AsyncStorage.removeItem(CACHE_KEYS.LAST_SYNC);
      console.log('🗑️ StateCache cleared');
    } catch (error) {
      console.error('Error clearing StateCache:', error);
    }
  }

  /**
   * Sync cache with server
   * Fetches latest claim data from server and updates cache
   * 
   * @param userId - User ID to sync claims for
   * @param fetchClaimsFn - Function to fetch claims from server
   */
  async syncWithServer(
    userId: string,
    fetchClaimsFn: (userId: string) => Promise<CachedClaim[]>
  ): Promise<void> {
    try {
      console.log(`🔄 Syncing StateCache with server for user ${userId}...`);
      
      const serverClaims = await fetchClaimsFn(userId);
      
      // Update cache with server data
      serverClaims.forEach((claim) => {
        this.updateClaim(claim.claimId, claim);
      });
      
      // Update last sync timestamp
      await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());
      
      console.log(`✅ StateCache synced: ${serverClaims.length} claims updated`);
    } catch (error) {
      console.error('Error syncing StateCache with server:', error);
      throw error;
    }
  }

  /**
   * Get last sync timestamp
   * Returns null if never synced
   */
  async getLastSync(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);
    } catch (error) {
      console.error('Error getting last sync timestamp:', error);
      return null;
    }
  }

  /**
   * Persist in-memory cache to AsyncStorage
   * Called automatically after cache updates
   */
  private async persistCache(): Promise<void> {
    try {
      // Convert Map to plain object for JSON serialization
      const cacheObject: Record<string, CachedClaim> = {};
      this.cache.forEach((claim, claimId) => {
        cacheObject[claimId] = claim;
      });
      
      await AsyncStorage.setItem(CACHE_KEYS.CLAIMS, JSON.stringify(cacheObject));
    } catch (error) {
      console.error('Error persisting StateCache:', error);
    }
  }

  /**
   * Get cache size (number of cached claims)
   */
  getSize(): number {
    return this.cache.size;
  }

  /**
   * Check if cache has been initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const stateCache = new StateCache();
