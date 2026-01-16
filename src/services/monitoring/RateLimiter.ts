/**
 * RateLimiter
 * 
 * Implements rate limiting for push notification sends to prevent abuse
 * and comply with FCM rate limits.
 * 
 * Requirements: 14.7, 6.10, 15.7
 */

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  maxRequestsPerDay: number;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfterMs?: number;
}

/**
 * Request tracking entry
 */
interface RequestEntry {
  timestamp: Date;
  userId: string;
}

/**
 * Default rate limit configuration
 * Based on typical FCM limits and abuse prevention
 */
const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequestsPerMinute: 60, // 60 notifications per minute per user
  maxRequestsPerHour: 1000, // 1000 notifications per hour per user
  maxRequestsPerDay: 10000, // 10000 notifications per day per user
};

export class RateLimiter {
  private static instance: RateLimiter | null = null;
  private requests: Map<string, RequestEntry[]> = new Map();
  private config: RateLimitConfig;

  private constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Start periodic cleanup
    this.startCleanup();
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<RateLimitConfig>): RateLimiter {
    if (!this.instance) {
      this.instance = new RateLimiter(config);
    }
    return this.instance;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static resetInstance(): void {
    if (this.instance) {
      this.instance.stopCleanup();
      this.instance = null;
    }
  }

  /**
   * Check if a request is allowed for a user
   * 
   * @param userId - User ID to check rate limit for
   * @returns Rate limit result
   */
  checkLimit(userId: string): RateLimitResult {
    const now = new Date();
    const userRequests = this.getUserRequests(userId);

    // Check minute limit
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const requestsLastMinute = userRequests.filter(
      r => r.timestamp > oneMinuteAgo
    ).length;

    if (requestsLastMinute >= this.config.maxRequestsPerMinute) {
      return {
        allowed: false,
        reason: 'Rate limit exceeded: too many requests per minute',
        retryAfterMs: 60 * 1000, // Retry after 1 minute
      };
    }

    // Check hour limit
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const requestsLastHour = userRequests.filter(
      r => r.timestamp > oneHourAgo
    ).length;

    if (requestsLastHour >= this.config.maxRequestsPerHour) {
      return {
        allowed: false,
        reason: 'Rate limit exceeded: too many requests per hour',
        retryAfterMs: 60 * 60 * 1000, // Retry after 1 hour
      };
    }

    // Check day limit
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const requestsLastDay = userRequests.filter(
      r => r.timestamp > oneDayAgo
    ).length;

    if (requestsLastDay >= this.config.maxRequestsPerDay) {
      return {
        allowed: false,
        reason: 'Rate limit exceeded: too many requests per day',
        retryAfterMs: 24 * 60 * 60 * 1000, // Retry after 1 day
      };
    }

    return {
      allowed: true,
    };
  }

  /**
   * Record a request for a user
   * Should be called after checkLimit returns allowed: true
   * 
   * @param userId - User ID to record request for
   */
  recordRequest(userId: string): void {
    const userRequests = this.getUserRequests(userId);
    
    userRequests.push({
      timestamp: new Date(),
      userId,
    });

    this.requests.set(userId, userRequests);
  }

  /**
   * Get current request count for a user
   * 
   * @param userId - User ID to get count for
   * @param timeWindowMs - Time window in milliseconds
   * @returns Number of requests in time window
   */
  getRequestCount(userId: string, timeWindowMs: number): number {
    const now = new Date();
    const cutoff = new Date(now.getTime() - timeWindowMs);
    const userRequests = this.getUserRequests(userId);

    return userRequests.filter(r => r.timestamp > cutoff).length;
  }

  /**
   * Reset rate limit for a user
   * Useful for testing or manual intervention
   * 
   * @param userId - User ID to reset
   */
  reset(userId: string): void {
    this.requests.delete(userId);
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.requests.clear();
  }

  /**
   * Update rate limit configuration
   */
  updateConfig(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): RateLimitConfig {
    return { ...this.config };
  }

  /**
   * Get statistics about rate limiting
   */
  getStats(): {
    totalUsers: number;
    totalRequests: number;
    activeUsers: number; // Users with requests in last hour
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    let totalRequests = 0;
    let activeUsers = 0;

    for (const [, requests] of this.requests.entries()) {
      totalRequests += requests.length;
      
      const recentRequests = requests.filter(r => r.timestamp > oneHourAgo);
      if (recentRequests.length > 0) {
        activeUsers++;
      }
    }

    return {
      totalUsers: this.requests.size,
      totalRequests,
      activeUsers,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Get requests for a user
   */
  private getUserRequests(userId: string): RequestEntry[] {
    return this.requests.get(userId) || [];
  }

  /**
   * Cleanup interval handle
   */
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Start periodic cleanup of old requests
   */
  private startCleanup(): void {
    // Clean up every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Stop periodic cleanup
   */
  private stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Clean up old requests (older than 24 hours)
   */
  private cleanup(): void {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    let removedCount = 0;

    for (const [userId, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(r => r.timestamp > oneDayAgo);
      
      if (recentRequests.length === 0) {
        // No recent requests, remove user entirely
        this.requests.delete(userId);
        removedCount++;
      } else if (recentRequests.length < requests.length) {
        // Some old requests, keep only recent ones
        this.requests.set(userId, recentRequests);
      }
    }

    if (removedCount > 0) {
      console.log(`🧹 Rate limiter cleaned up ${removedCount} inactive users`);
    }
  }
}

/**
 * Convenience function to check rate limit
 */
export function checkRateLimit(userId: string): RateLimitResult {
  return RateLimiter.getInstance().checkLimit(userId);
}

/**
 * Convenience function to record request
 */
export function recordRequest(userId: string): void {
  RateLimiter.getInstance().recordRequest(userId);
}

/**
 * Convenience function to get request count
 */
export function getRequestCount(userId: string, timeWindowMs: number): number {
  return RateLimiter.getInstance().getRequestCount(userId, timeWindowMs);
}

/**
 * Convenience function to configure rate limits
 */
export function configureRateLimits(config: Partial<RateLimitConfig>): void {
  RateLimiter.getInstance().updateConfig(config);
}
