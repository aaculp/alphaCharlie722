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
  SAME_DAY_OFFERS: '@flash_offers:same_day_', // Prefix for same-day offers with date
  CACHE_METADATA: '@flash_offers:cache_metadata',
};

// Cache configuration
const CACHE_CONFIG = {
  ACTIVE_OFFERS_TTL: 2 * 60 * 1000, // 2 minutes (reduced for faster updates)
  USER_CLAIMS_TTL: 10 * 60 * 1000, // 10 minutes
  OFFER_DETAILS_TTL: 3 * 60 * 1000, // 3 minutes
  SAME_DAY_OFFERS_TTL: 2 * 60 * 1000, // 2 minutes (reduced for faster updates)
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

export interface SameDayCacheEntry<T = any> {
  date: string; // YYYY-MM-DD format
  data: T[];
  timestamp: number;
  hasLocation: boolean;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  accessCount: number;
  lastAccessed: number;
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
   * Handles cache corruption gracefully by removing corrupted entries
   */
  static async getCachedActiveOffers(): Promise<FlashOffer[] | null> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.ACTIVE_OFFERS);
      if (!cached) return null;

      let parsed: CachedData<FlashOffer[]>;
      
      try {
        parsed = JSON.parse(cached);
      } catch (parseError) {
        // Cache is corrupted, remove it and return null
        console.warn('⚠️ Corrupted active offers cache detected, removing...', parseError);
        await AsyncStorage.removeItem(CACHE_KEYS.ACTIVE_OFFERS);
        return null;
      }

      // Validate cache structure
      if (!Array.isArray(parsed.data) || typeof parsed.timestamp !== 'number') {
        console.warn('⚠️ Invalid active offers cache structure detected, removing...');
        await AsyncStorage.removeItem(CACHE_KEYS.ACTIVE_OFFERS);
        return null;
      }
      
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
   * Handles cache corruption gracefully by removing corrupted entries
   */
  static async getCachedOfferDetails(offerId: string): Promise<any | null> {
    try {
      const key = `${CACHE_KEYS.OFFER_DETAILS}${offerId}`;
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      let parsed: CachedData<any>;
      
      try {
        parsed = JSON.parse(cached);
      } catch (parseError) {
        // Cache is corrupted, remove it and return null
        console.warn(`⚠️ Corrupted offer details cache detected for ${offerId}, removing...`, parseError);
        await AsyncStorage.removeItem(key);
        return null;
      }

      // Validate cache structure
      if (!parsed.data || typeof parsed.timestamp !== 'number') {
        console.warn(`⚠️ Invalid offer details cache structure detected for ${offerId}, removing...`);
        await AsyncStorage.removeItem(key);
        return null;
      }
      
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
          const parsed: CachedData<any> | SameDayCacheEntry = JSON.parse(cached);
          const age = Date.now() - parsed.timestamp;
          
          // Determine TTL based on key type
          let ttl = CACHE_CONFIG.OFFER_DETAILS_TTL;
          if (key === CACHE_KEYS.ACTIVE_OFFERS) {
            ttl = CACHE_CONFIG.ACTIVE_OFFERS_TTL;
          } else if (key === CACHE_KEYS.USER_CLAIMS) {
            ttl = CACHE_CONFIG.USER_CLAIMS_TTL;
          } else if (key.startsWith(CACHE_KEYS.SAME_DAY_OFFERS)) {
            ttl = CACHE_CONFIG.SAME_DAY_OFFERS_TTL;
            // Also check date validity for same-day offers
            const sameDayEntry = parsed as SameDayCacheEntry;
            const currentDateKey = this.getDateKey(new Date());
            if (sameDayEntry.date && sameDayEntry.date !== currentDateKey) {
              await AsyncStorage.removeItem(key);
              removedCount++;
              continue;
            }
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
   * Cache same-day offers with date-based key and location metadata
   */
  static async cacheSameDayOffers<T = any>(
    offers: T[],
    options?: {
      latitude?: number;
      longitude?: number;
    }
  ): Promise<void> {
    try {
      const now = new Date();
      const dateKey = this.getDateKey(now);
      const locationKey = this.getLocationKey(options?.latitude, options?.longitude);
      const cacheKey = `${CACHE_KEYS.SAME_DAY_OFFERS}${dateKey}${locationKey}`;

      const cached: SameDayCacheEntry<T> = {
        date: dateKey,
        data: offers,
        timestamp: Date.now(),
        hasLocation: options?.latitude !== undefined && options?.longitude !== undefined,
        userLocation: options?.latitude && options?.longitude ? {
          latitude: options.latitude,
          longitude: options.longitude,
        } : undefined,
        accessCount: 1,
        lastAccessed: Date.now(),
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cached));
      await this.updateCacheMetadata();
      console.log(`✅ Cached same-day offers for ${dateKey}${locationKey}`);
    } catch (error) {
      console.error('Error caching same-day offers:', error);
    }
  }

  /**
   * Get cached same-day offers with date validity check
   * Returns null if cache is expired or date has changed
   * Handles cache corruption gracefully by removing corrupted entries
   */
  static async getCachedSameDayOffers<T = any>(
    options?: {
      latitude?: number;
      longitude?: number;
    }
  ): Promise<T[] | null> {
    try {
      const now = new Date();
      const dateKey = this.getDateKey(now);
      const locationKey = this.getLocationKey(options?.latitude, options?.longitude);
      const cacheKey = `${CACHE_KEYS.SAME_DAY_OFFERS}${dateKey}${locationKey}`;

      const cached = await AsyncStorage.getItem(cacheKey);
      if (!cached) return null;

      let parsed: SameDayCacheEntry<T>;
      
      try {
        parsed = JSON.parse(cached);
      } catch (parseError) {
        // Cache is corrupted, remove it and return null
        console.warn('⚠️ Corrupted cache detected, removing...', parseError);
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }

      // Validate cache structure
      if (!parsed.date || !Array.isArray(parsed.data) || typeof parsed.timestamp !== 'number') {
        console.warn('⚠️ Invalid cache structure detected, removing...');
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }

      // Check if date has changed (cache invalidation on day change)
      if (parsed.date !== dateKey) {
        console.log(`🗑️ Same-day offers cache invalidated: date changed from ${parsed.date} to ${dateKey}`);
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }

      // Check if cache is expired (TTL check)
      if (Date.now() - parsed.timestamp > CACHE_CONFIG.SAME_DAY_OFFERS_TTL) {
        console.log('🗑️ Same-day offers cache expired, removing...');
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }

      // Update access metadata
      parsed.accessCount++;
      parsed.lastAccessed = Date.now();
      await AsyncStorage.setItem(cacheKey, JSON.stringify(parsed));

      console.log(`✅ Returning cached same-day offers for ${dateKey}${locationKey}`);
      return parsed.data;
    } catch (error) {
      console.error('Error getting cached same-day offers:', error);
      return null;
    }
  }

  /**
   * Invalidate all same-day offer caches (useful when day changes)
   */
  static async invalidateSameDayOffers(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const sameDayKeys = keys.filter(k => k.startsWith(CACHE_KEYS.SAME_DAY_OFFERS));
      
      if (sameDayKeys.length > 0) {
        await AsyncStorage.multiRemove(sameDayKeys);
        console.log(`🗑️ Invalidated ${sameDayKeys.length} same-day offer cache entries`);
        await this.updateCacheMetadata();
      }
    } catch (error) {
      console.error('Error invalidating same-day offers:', error);
    }
  }

  /**
   * Invalidate same-day offers for previous dates (cleanup old entries)
   */
  static async invalidateOldSameDayOffers(): Promise<void> {
    try {
      const now = new Date();
      const currentDateKey = this.getDateKey(now);
      const keys = await AsyncStorage.getAllKeys();
      const sameDayKeys = keys.filter(k => k.startsWith(CACHE_KEYS.SAME_DAY_OFFERS));
      
      let removedCount = 0;
      for (const key of sameDayKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (!cached) continue;

        try {
          const parsed: SameDayCacheEntry = JSON.parse(cached);
          // Remove if date is not current
          if (parsed.date !== currentDateKey) {
            await AsyncStorage.removeItem(key);
            removedCount++;
          }
        } catch (parseError) {
          // If we can't parse it, remove it
          await AsyncStorage.removeItem(key);
          removedCount++;
        }
      }

      if (removedCount > 0) {
        console.log(`🗑️ Removed ${removedCount} old same-day offer cache entries`);
        await this.updateCacheMetadata();
      }
    } catch (error) {
      console.error('Error invalidating old same-day offers:', error);
    }
  }

  /**
   * Generate date key in YYYY-MM-DD format for current date
   */
  private static getDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Generate location key for cache differentiation
   */
  private static getLocationKey(latitude?: number, longitude?: number): string {
    if (latitude === undefined || longitude === undefined) {
      return '';
    }
    return `_${latitude.toFixed(4)}_${longitude.toFixed(4)}`;
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
