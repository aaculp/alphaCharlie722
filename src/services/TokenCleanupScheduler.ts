/**
 * TokenCleanupScheduler
 * 
 * Schedules periodic cleanup of expired device tokens.
 * Tokens that have been inactive for more than 30 days are removed.
 * 
 * Requirements: 1.9
 */

import { DeviceTokenManager } from './DeviceTokenManager';

export class TokenCleanupScheduler {
  private static cleanupInterval: NodeJS.Timeout | null = null;
  private static readonly CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Start the token cleanup scheduler
   * Runs cleanup immediately and then every 24 hours
   */
  static start(): void {
    if (this.cleanupInterval) {
      console.log('⚠️ Token cleanup scheduler already running');
      return;
    }

    console.log('🧹 Starting token cleanup scheduler');

    // Run cleanup immediately
    this.runCleanup();

    // Schedule periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.runCleanup();
    }, this.CLEANUP_INTERVAL_MS);
  }

  /**
   * Stop the token cleanup scheduler
   */
  static stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('✅ Token cleanup scheduler stopped');
    }
  }

  /**
   * Run token cleanup
   * Removes tokens that have been inactive for more than 30 days
   */
  private static async runCleanup(): Promise<void> {
    try {
      console.log('🧹 Running token cleanup...');
      const count = await DeviceTokenManager.cleanupExpiredTokens();
      console.log(`✅ Token cleanup complete: ${count} tokens removed`);
    } catch (error) {
      console.error('❌ Error running token cleanup:', error);
      // Don't throw - cleanup failures shouldn't crash the app
    }
  }

  /**
   * Manually trigger token cleanup
   * Useful for testing or manual maintenance
   */
  static async runManualCleanup(): Promise<number> {
    try {
      console.log('🧹 Running manual token cleanup...');
      const count = await DeviceTokenManager.cleanupExpiredTokens();
      console.log(`✅ Manual token cleanup complete: ${count} tokens removed`);
      return count;
    } catch (error) {
      console.error('❌ Error running manual token cleanup:', error);
      throw new Error('Failed to run manual token cleanup');
    }
  }
}
