/**
 * CacheManager - Simple in-memory cache with TTL support
 * Used for caching social data to improve performance
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * Get a value from cache
   * @param key - Cache key
   * @returns Cached value or null if not found or expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set a value in cache
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time to live in milliseconds
   */
  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Invalidate (delete) a cache entry
   * @param key - Cache key to invalidate
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching a pattern
   * @param pattern - Pattern to match (supports wildcards with *)
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  FRIENDS_LIST: 5 * 60 * 1000, // 5 minutes
  COLLECTIONS: 5 * 60 * 1000, // 5 minutes
  PRIVACY_SETTINGS: 10 * 60 * 1000, // 10 minutes
  FRIEND_REQUESTS: 1 * 60 * 1000, // 1 minute (more dynamic)
  SOCIAL_PROFILE: 5 * 60 * 1000, // 5 minutes
  VENUE_REVIEWS: 5 * 60 * 1000, // 5 minutes (Requirement 14.5)
} as const;
