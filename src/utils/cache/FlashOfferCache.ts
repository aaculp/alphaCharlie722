/**
 * FlashOfferCache
 * 
 * Manages offline caching for flash offers with advanced features:
 * - TTL (Time To Live) for cache expiration
 * - Cache size limits to prevent storage bloat
 * - LRU (Least Recently Used) eviction strategy
 * - Automatic cache cleanup
 * 
 * Stores data locally when offline and syncs when back online
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FlashOffer } from '../../services/api/flashOffers';
import type { FlashOfferClaim } from '../../services/api/flashOfferClaims';

const CACHE_KEYS = {
  ACTIVE_OFFERS: '@flash_offers:active_offers',
  USER_CLAIMS: '@flash_offers:user_claims',
  PENDING_CLAIMS: '@flash_offers:pending_claims',
  LAST_SYNC: '@flash_offers:last_sync',
  OFFER_DETAILS: '@flash_offers:offer_details:', // Prefix for individual offers
  CACHE_METADATA: '@flash_offers:cache_metadata',
};

// Cache configuration
const CACHE_CONFIG = {
  ACTIVE_OFFERS_TTL: 5 * 60 * 1000, // 5 minutes
  USER_CLAIMS_TTL: 10 * 60 * 1000, // 10 minutes
  OFFER_DETAILS_TTL: 3 * 60 * 1000, // 3 minutes
  MAX_OFFER_DETAILS_CACHE: 50, // Maximum number of cached offer details
  MAX_CACHE_SIZE_MB: 10, // Maximum total cache size in MB
};

export interface CachedData<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

export interface PendingClaim {
  offerId: string;
  userId: string;
  timestamp: number;
}

export interface CacheMetadata {
  totalSize: number;
  itemCount: number;
  lastCleanup: number;
}

export class FlashOfferCache {
  /**
   * Cache active offers with TTL
   */
  static async cacheActiveOffers(offers: FlashOffer[]): Promise<void> {
    try {
      const cached: CachedData<FlashOffer[]> = {
        data: offers,
        timestamp: Date.now(),
        accessCount: 1,
        lastAccessed: Date.now(),
      };
      await AsyncStorage.setItem(CACHE_KEYS.ACTIVE_OFFERS, JSON.stringify(cached));
      await this.updateCacheMetadata();
    } catch (error) {
      console.error('Error caching active offers:', error);
    }
  }

  /**
   * Get cached active offers with TTL check
   */
  static async getCachedActiveOffers(): Promise<FlashOffer[] | null> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.ACTIVE_OFFERS);
      if (!cached) return null;

      const parsed: CachedData<FlashOffer[]> = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() - parsed.timestamp > CACHE_CONFIG.ACTIVE_OFFERS_TTL) {
        console.log('🗑️ Active offers cache expired, removing...');
        await AsyncStorage.removeItem(CACHE_KEYS.ACTIVE_OFFERS);
        return null;
      }

      // Update access metadata
      parsed.accessCount++;
      parsed.lastAccessed = Date.now();
      await AsyncStorage.setItem(CACHE_KEYS.ACTIVE_OFFERS, JSON.stringify(parsed));

      return parsed.data;
    } catch (error) {
      console.error('Error getting cached active offers:', error);
      return null;
    }
  }

  /**
   * Cache user claims with TTL
   */
  static async cacheUserClaims(claims: FlashOfferClaim[]): Promise<void> {
    try {
      const cached: CachedData<FlashOfferClaim[]> = {
        data: claims,
        timestamp: Date.now(),
        accessCount: 1,
        lastAccessed: Date.now(),
      };
      await AsyncStorage.setItem(CACHE_KEYS.USER_CLAIMS, JSON.stringify(cached));
      await this.updateCacheMetadata();
    } catch (error) {
      console.error('Error caching user claims:', error);
    }
  }

  /**
   * Get cached user claims with TTL check
   */
  static async getCachedUserClaims(): Promise<FlashOfferClaim[] | null> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.USER_CLAIMS);
      if (!cached) return null;

      const parsed: CachedData<FlashOfferClaim[]> = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() - parsed.timestamp > CACHE_CONFIG.USER_CLAIMS_TTL) {
        console.log('🗑️ User claims cache expired, removing...');
        await AsyncStorage.removeItem(CACHE_KEYS.USER_CLAIMS);
        return null;
      }

      // Update access metadata
      parsed.accessCount++;
      parsed.lastAccessed = Date.now();
      await AsyncStorage.setItem(CACHE_KEYS.USER_CLAIMS, JSON.stringify(parsed));

      return parsed.data;
    } catch (error) {
      console.error('Error getting cached user claims:', error);
      return null;
    }
  }

  /**
   * Cache individual offer details with LRU eviction
   */
  static async cacheOfferDetails(offerId: string, offer: any): Promise<void> {
    try {
      const cached: CachedData<any> = {
        data: offer,
        timestamp: Date.now(),
        accessCount: 1,
        lastAccessed: Date.now(),
      };
      
      const key = `${CACHE_KEYS.OFFER_DETAILS}${offerId}`;
      await AsyncStorage.setItem(key, JSON.stringify(cached));
      
      // Check cache size and evict if necessary
      await this.evictLRUIfNeeded();
      await this.updateCacheMetadata();
    } catch (error) {
      console.error('Error caching offer details:', error);
    }
  }

  /**
   * Get cached offer details with TTL check
   */
  static async getCachedOfferDetails(offerId: string): Promise<any | null> {
    try {
      const key = `${CACHE_KEYS.OFFER_DETAILS}${offerId}`;
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const parsed: CachedData<any> = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() - parsed.timestamp > CACHE_CONFIG.OFFER_DETAILS_TTL) {
        console.log(`🗑️ Offer details cache expired for ${offerId}, removing...`);
        await AsyncStorage.removeItem(key);
        return null;
      }

      // Update access metadata
      parsed.accessCount++;
      parsed.lastAccessed = Date.now();
      await AsyncStorage.setItem(key, JSON.stringify(parsed));

      return parsed.data;
    } catch (error) {
      console.error('Error getting cached offer details:', error);
      return null;
    }
  }

  /**
   * Evict least recently used offer details if cache is too large
   */
  private static async evictLRUIfNeeded(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const offerDetailKeys = keys.filter(k => k.startsWith(CACHE_KEYS.OFFER_DETAILS));
      
      if (offerDetailKeys.length <= CACHE_CONFIG.MAX_OFFER_DETAILS_CACHE) {
        return;
      }

      console.log(`🗑️ Cache size exceeded (${offerDetailKeys.length}), evicting LRU items...`);

      // Get all cached items with their metadata
      const items = await Promise.all(
        offerDetailKeys.map(async (key) => {
          const cached = await AsyncStorage.getItem(key);
          if (!cached) return null;
          const parsed: CachedData<any> = JSON.parse(cached);
          return { key, lastAccessed: parsed.lastAccessed };
        })
      );

      // Filter out nulls and sort by last accessed (oldest first)
      const validItems = items.filter(item => item !== null) as Array<{ key: string; lastAccessed: number }>;
      validItems.sort((a, b) => a.lastAccessed - b.lastAccessed);

      // Remove oldest items until we're under the limit
      const itemsToRemove = validItems.length - CACHE_CONFIG.MAX_OFFER_DETAILS_CACHE;
      const keysToRemove = validItems.slice(0, itemsToRemove).map(item => item.key);
      
      await Promise.all(keysToRemove.map(key => AsyncStorage.removeItem(key)));
      console.log(`🗑️ Evicted ${keysToRemove.length} LRU items`);
    } catch (error) {
      console.error('Error evicting LRU items:', error);
    }
  }

  /**
   * Update cache metadata (size, item count, etc.)
   */
  private static async updateCacheMetadata(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const flashOfferKeys = keys.filter(k => k.startsWith('@flash_offers:'));
      
      // Calculate approximate cache size
      let totalSize = 0;
      for (const key of flashOfferKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }

      const metadata: CacheMetadata = {
        totalSize,
        itemCount: flashOfferKeys.length,
        lastCleanup: Date.now(),
      };

      await AsyncStorage.setItem(CACHE_KEYS.CACHE_METADATA, JSON.stringify(metadata));

      // Check if we need to cleanup
      const sizeMB = totalSize / (1024 * 1024);
      if (sizeMB > CACHE_CONFIG.MAX_CACHE_SIZE_MB) {
        console.warn(`⚠️ Cache size (${sizeMB.toFixed(2)}MB) exceeds limit, triggering cleanup...`);
        await this.cleanupExpiredCache();
      }
    } catch (error) {
      console.error('Error updating cache metadata:', error);
    }
  }

  /**
   * Get cache metadata
   */
  static async getCacheMetadata(): Promise<CacheMetadata | null> {
    try {
      const metadata = await AsyncStorage.getItem(CACHE_KEYS.CACHE_METADATA);
      return metadata ? JSON.parse(metadata) : null;
    } catch (error) {
      console.error('Error getting cache metadata:', error);
      return null;
    }
  }

  /**
   * Clean up expired cache entries
   */
  static async cleanupExpiredCache(): Promise<void> {
    try {
      console.log('🧹 Starting cache cleanup...');
      const keys = await AsyncStorage.getAllKeys();
      const flashOfferKeys = keys.filter(k => k.startsWith('@flash_offers:'));
      
      let removedCount = 0;
      
      for (const key of flashOfferKeys) {
        // Skip metadata and pending claims
        if (key === CACHE_KEYS.CACHE_METADATA || key === CACHE_KEYS.PENDING_CLAIMS || key === CACHE_KEYS.LAST_SYNC) {
          continue;
        }

        const cached = await AsyncStorage.getItem(key);
        if (!cached) continue;

        try {
          const parsed: CachedData<any> = JSON.parse(cached);
          const age = Date.now() - parsed.timestamp;
          
          // Determine TTL based on key type
          let ttl = CACHE_CONFIG.OFFER_DETAILS_TTL;
          if (key === CACHE_KEYS.ACTIVE_OFFERS) {
            ttl = CACHE_CONFIG.ACTIVE_OFFERS_TTL;
          } else if (key === CACHE_KEYS.USER_CLAIMS) {
            ttl = CACHE_CONFIG.USER_CLAIMS_TTL;
          }

          // Remove if expired
          if (age > ttl) {
            await AsyncStorage.removeItem(key);
            removedCount++;
          }
        } catch (parseError) {
          // If we can't parse it, remove it
          await AsyncStorage.removeItem(key);
          removedCount++;
        }
      }

      console.log(`🧹 Cache cleanup complete: removed ${removedCount} expired items`);
      await this.updateCacheMetadata();
    } catch (error) {
      console.error('Error cleaning up cache:', error);
    }
  }

  /**
   * Add a pending claim (to be synced when online)
   */
  static async addPendingClaim(offerId: string, userId: string): Promise<void> {
    try {
      const pending = await this.getPendingClaims();
      const newClaim: PendingClaim = {
        offerId,
        userId,
        timestamp: Date.now(),
      };
      
      pending.push(newClaim);
      await AsyncStorage.setItem(CACHE_KEYS.PENDING_CLAIMS, JSON.stringify(pending));
    } catch (error) {
      console.error('Error adding pending claim:', error);
    }
  }

  /**
   * Get all pending claims
   */
  static async getPendingClaims(): Promise<PendingClaim[]> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.PENDING_CLAIMS);
      if (!cached) return [];
      return JSON.parse(cached);
    } catch (error) {
      console.error('Error getting pending claims:', error);
      return [];
    }
  }

  /**
   * Remove a pending claim
   */
  static async removePendingClaim(offerId: string, userId: string): Promise<void> {
    try {
      const pending = await this.getPendingClaims();
      const filtered = pending.filter(
        claim => !(claim.offerId === offerId && claim.userId === userId)
      );
      await AsyncStorage.setItem(CACHE_KEYS.PENDING_CLAIMS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing pending claim:', error);
    }
  }

  /**
   * Clear all pending claims
   */
  static async clearPendingClaims(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_KEYS.PENDING_CLAIMS);
    } catch (error) {
      console.error('Error clearing pending claims:', error);
    }
  }

  /**
   * Update last sync timestamp
   */
  static async updateLastSync(): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, Date.now().toString());
    } catch (error) {
      console.error('Error updating last sync:', error);
    }
  }

  /**
   * Get last sync timestamp
   */
  static async getLastSync(): Promise<number | null> {
    try {
      const timestamp = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);
      return timestamp ? parseInt(timestamp, 10) : null;
    } catch (error) {
      console.error('Error getting last sync:', error);
      return null;
    }
  }

  /**
   * Clear all cached data
   */
  static async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const flashOfferKeys = keys.filter(k => k.startsWith('@flash_offers:'));
      await AsyncStorage.multiRemove(flashOfferKeys);
      console.log('🗑️ Cleared all flash offer cache');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}
