/**
 * TokenCache
 * 
 * In-memory cache for device tokens with TTL support.
 * Reduces database queries for frequently accessed tokens.
 * 
 * Requirements: 14.3
 */

import { DeviceToken } from '../../services/DeviceTokenManager';

interface CacheEntry {
  tokens: DeviceToken[];
  timestamp: number;
}

export class TokenCache {
  private static cache = new Map<string, CacheEntry>();
  private static readonly TTL_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached tokens for a user
   * Returns null if cache miss or expired
   * 
   * @param userId - User ID to get tokens for
   * @returns Cached tokens or null
   */
  static get(userId: string): DeviceToken[] | null {
    const entry = this.cache.get(userId);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > this.TTL_MS) {
      // Entry expired, remove it
      this.cache.delete(userId);
      return null;
    }

    return entry.tokens;
  }

  /**
   * Store tokens in cache for a user
   * 
   * @param userId - User ID to cache tokens for
   * @param tokens - Device tokens to cache
   */
  static set(userId: string, tokens: DeviceToken[]): void {
    this.cache.set(userId, {
      tokens,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidate cache for a specific user
   * Called when tokens are updated
   * 
   * @param userId - User ID to invalidate cache for
   */
  static invalidate(userId: string): void {
    this.cache.delete(userId);
  }

  /**
   * Clear all cached tokens
   * Useful for testing or memory management
   */
  static clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * Useful for monitoring and debugging
   * 
   * @returns Cache statistics
   */
  static getStats(): { size: number; entries: number } {
    return {
      size: this.cache.size,
      entries: this.cache.size,
    };
  }

  /**
   * Clean up expired entries
   * Should be called periodically to prevent memory leaks
   * 
   * @returns Number of entries removed
   */
  static cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [userId, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL_MS) {
        this.cache.delete(userId);
        removed++;
      }
    }

    return removed;
  }
}
