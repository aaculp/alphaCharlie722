/**
 * Reconnection Strategy
 * 
 * Implements exponential backoff reconnection logic for real-time subscriptions.
 * Provides automatic retry with increasing delays to handle temporary connection failures.
 * 
 * Features:
 * - Exponential backoff (1s, 2s, 4s delays)
 * - Max retry limit (3 attempts)
 * - Connection state tracking
 * - Automatic reset on successful connection
 * 
 * @module ReconnectionStrategy
 * @category Services
 */

/**
 * Connection state during reconnection attempts
 */
export type ReconnectionState = 
  | 'idle'           // No reconnection in progress
  | 'connecting'     // Initial connection attempt
  | 'reconnecting'   // Retrying after failure
  | 'connected'      // Successfully connected
  | 'failed';        // Max retries exceeded

/**
 * Reconnection attempt result
 */
export interface ReconnectionResult {
  /** Whether reconnection was successful */
  success: boolean;
  /** Number of attempts made */
  attempts: number;
  /** Current reconnection state */
  state: ReconnectionState;
  /** Error message if failed */
  error?: string;
}

/**
 * Reconnection Strategy
 * 
 * Implements exponential backoff reconnection logic for handling temporary
 * connection failures. Automatically retries with increasing delays (1s, 2s, 4s)
 * up to a maximum of 3 attempts.
 * 
 * Design Philosophy:
 * - Start with short delays for quick recovery from transient failures
 * - Exponentially increase delays to avoid overwhelming the server
 * - Limit total attempts to prevent infinite retry loops
 * - Reset attempt counter on successful connection
 * - Track connection state for UI feedback
 * 
 * @example
 * ```typescript
 * const strategy = new ReconnectionStrategy();
 * 
 * // Attempt to reconnect
 * const result = await strategy.reconnect(async () => {
 *   await supabase.channel('my-channel').subscribe();
 * });
 * 
 * if (result.success) {
 *   console.log('Reconnected successfully!');
 * } else {
 *   console.error('Failed to reconnect after', result.attempts, 'attempts');
 * }
 * 
 * // Check current state
 * const state = strategy.getState();
 * if (state === 'failed') {
 *   showManualRefreshButton();
 * }
 * 
 * // Reset for next reconnection attempt
 * strategy.reset();
 * ```
 */
export class ReconnectionStrategy {
  /** Current number of reconnection attempts */
  private attempts = 0;
  
  /** Maximum number of reconnection attempts */
  private readonly maxAttempts = 3;
  
  /** Base delay in milliseconds (1 second) */
  private readonly baseDelay = 1000;
  
  /** Current reconnection state */
  private state: ReconnectionState = 'idle';
  
  /** Timestamp of last connection attempt */
  private lastAttemptTime: number = 0;

  /**
   * Create a new ReconnectionStrategy
   * 
   * @param maxAttempts - Maximum number of reconnection attempts (default: 3)
   * @param baseDelay - Base delay in milliseconds (default: 1000ms)
   * 
   * @example
   * ```typescript
   * // Use default settings (3 attempts, 1s base delay)
   * const strategy = new ReconnectionStrategy();
   * 
   * // Custom settings (5 attempts, 2s base delay)
   * const customStrategy = new ReconnectionStrategy(5, 2000);
   * ```
   */
  constructor(maxAttempts: number = 3, baseDelay: number = 1000) {
    this.maxAttempts = maxAttempts;
    this.baseDelay = baseDelay;
    
    console.log(`🔄 ReconnectionStrategy initialized (max: ${maxAttempts}, base delay: ${baseDelay}ms)`);
  }

  /**
   * Attempt to reconnect with exponential backoff
   * 
   * Executes the provided connection function with automatic retry logic.
   * Uses exponential backoff delays: 1s, 2s, 4s (for default settings).
   * Resets attempt counter on successful connection.
   * 
   * @param connectFn - Async function that attempts to establish connection
   * @returns Reconnection result with success status and attempt count
   * 
   * @example
   * ```typescript
   * const strategy = new ReconnectionStrategy();
   * 
   * const result = await strategy.reconnect(async () => {
   *   // Your connection logic here
   *   const channel = supabase.channel('my-channel');
   *   await channel.subscribe();
   *   
   *   // Throw error if connection fails
   *   if (channel.state !== 'joined') {
   *     throw new Error('Failed to join channel');
   *   }
   * });
   * 
   * if (result.success) {
   *   console.log(`Connected after ${result.attempts} attempt(s)`);
   * } else {
   *   console.error(`Failed after ${result.attempts} attempts: ${result.error}`);
   * }
   * ```
   */
  async reconnect(connectFn: () => Promise<void>): Promise<ReconnectionResult> {
    console.log('🔄 Starting reconnection process...');
    
    this.attempts = 0;
    this.state = 'connecting';
    
    while (this.attempts < this.maxAttempts) {
      this.attempts++;
      this.lastAttemptTime = Date.now();
      
      console.log(`🔄 Reconnection attempt ${this.attempts}/${this.maxAttempts}`);
      
      try {
        // Update state for retry attempts
        if (this.attempts > 1) {
          this.state = 'reconnecting';
        }
        
        // Attempt connection
        await connectFn();
        
        // Success! Reset and return
        console.log(`✅ Reconnection successful after ${this.attempts} attempt(s)`);
        this.state = 'connected';
        this.attempts = 0; // Reset on success
        
        return {
          success: true,
          attempts: this.attempts,
          state: this.state,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Reconnection attempt ${this.attempts} failed:`, errorMessage);
        
        // If we haven't exceeded max attempts, wait before retrying
        if (this.attempts < this.maxAttempts) {
          const delay = this.calculateDelay(this.attempts);
          console.log(`⏳ Waiting ${delay}ms before next attempt...`);
          await this.sleep(delay);
        } else {
          // Max attempts exceeded
          console.error(`❌ Reconnection failed after ${this.attempts} attempts`);
          this.state = 'failed';
          
          return {
            success: false,
            attempts: this.attempts,
            state: this.state,
            error: errorMessage,
          };
        }
      }
    }
    
    // Should never reach here, but TypeScript needs it
    this.state = 'failed';
    return {
      success: false,
      attempts: this.attempts,
      state: this.state,
      error: 'Max reconnection attempts exceeded',
    };
  }

  /**
   * Calculate exponential backoff delay
   * 
   * Calculates the delay for the current attempt using exponential backoff:
   * - Attempt 1: baseDelay * 2^0 = 1s (1000ms)
   * - Attempt 2: baseDelay * 2^1 = 2s (2000ms)
   * - Attempt 3: baseDelay * 2^2 = 4s (4000ms)
   * 
   * @param attemptNumber - Current attempt number (1-indexed)
   * @returns Delay in milliseconds
   * 
   * @example
   * ```typescript
   * const strategy = new ReconnectionStrategy();
   * 
   * console.log(strategy.calculateDelay(1)); // 1000ms (1s)
   * console.log(strategy.calculateDelay(2)); // 2000ms (2s)
   * console.log(strategy.calculateDelay(3)); // 4000ms (4s)
   * ```
   */
  calculateDelay(attemptNumber: number): number {
    // Exponential backoff: baseDelay * 2^(attemptNumber - 1)
    // Attempt 1: 1000 * 2^0 = 1000ms (1s)
    // Attempt 2: 1000 * 2^1 = 2000ms (2s)
    // Attempt 3: 1000 * 2^2 = 4000ms (4s)
    return this.baseDelay * Math.pow(2, attemptNumber - 1);
  }

  /**
   * Get current reconnection state
   * 
   * Returns the current state of the reconnection process. Useful for
   * displaying connection status in the UI.
   * 
   * @returns Current reconnection state
   * 
   * @example
   * ```typescript
   * const strategy = new ReconnectionStrategy();
   * const state = strategy.getState();
   * 
   * switch (state) {
   *   case 'idle':
   *     console.log('No reconnection in progress');
   *     break;
   *   case 'connecting':
   *     console.log('Initial connection attempt...');
   *     break;
   *   case 'reconnecting':
   *     console.log('Retrying connection...');
   *     break;
   *   case 'connected':
   *     console.log('Successfully connected');
   *     break;
   *   case 'failed':
   *     console.log('Reconnection failed');
   *     break;
   * }
   * ```
   */
  getState(): ReconnectionState {
    return this.state;
  }

  /**
   * Get current attempt count
   * 
   * Returns the number of reconnection attempts made in the current
   * reconnection cycle. Resets to 0 on successful connection.
   * 
   * @returns Current attempt count
   * 
   * @example
   * ```typescript
   * const strategy = new ReconnectionStrategy();
   * 
   * await strategy.reconnect(connectFn);
   * 
   * const attempts = strategy.getAttempts();
   * console.log(`Made ${attempts} reconnection attempts`);
   * ```
   */
  getAttempts(): number {
    return this.attempts;
  }

  /**
   * Get maximum allowed attempts
   * 
   * Returns the maximum number of reconnection attempts configured
   * for this strategy.
   * 
   * @returns Maximum attempt count
   * 
   * @example
   * ```typescript
   * const strategy = new ReconnectionStrategy(5);
   * console.log(strategy.getMaxAttempts()); // 5
   * ```
   */
  getMaxAttempts(): number {
    return this.maxAttempts;
  }

  /**
   * Get timestamp of last connection attempt
   * 
   * Returns the timestamp (in milliseconds since epoch) of the last
   * connection attempt. Useful for debugging and monitoring.
   * 
   * @returns Timestamp of last attempt, or 0 if no attempts made
   * 
   * @example
   * ```typescript
   * const strategy = new ReconnectionStrategy();
   * await strategy.reconnect(connectFn);
   * 
   * const lastAttempt = strategy.getLastAttemptTime();
   * const elapsed = Date.now() - lastAttempt;
   * console.log(`Last attempt was ${elapsed}ms ago`);
   * ```
   */
  getLastAttemptTime(): number {
    return this.lastAttemptTime;
  }

  /**
   * Check if max attempts have been reached
   * 
   * Returns true if the maximum number of reconnection attempts has been
   * reached and no more retries will be attempted.
   * 
   * @returns True if max attempts reached, false otherwise
   * 
   * @example
   * ```typescript
   * const strategy = new ReconnectionStrategy();
   * 
   * if (strategy.hasReachedMaxAttempts()) {
   *   console.log('Max attempts reached, showing manual refresh button');
   *   showManualRefreshButton();
   * }
   * ```
   */
  hasReachedMaxAttempts(): boolean {
    return this.attempts >= this.maxAttempts;
  }

  /**
   * Reset reconnection state
   * 
   * Resets the attempt counter and state to idle. Call this when you want
   * to start a fresh reconnection cycle (e.g., after user manually triggers
   * a reconnection).
   * 
   * @example
   * ```typescript
   * const strategy = new ReconnectionStrategy();
   * 
   * // After failed reconnection
   * await strategy.reconnect(connectFn);
   * 
   * // User clicks "Try Again" button
   * strategy.reset();
   * await strategy.reconnect(connectFn); // Fresh attempt cycle
   * ```
   */
  reset(): void {
    console.log('🔄 Resetting reconnection strategy');
    this.attempts = 0;
    this.state = 'idle';
    this.lastAttemptTime = 0;
  }

  /**
   * Sleep for specified duration
   * 
   * Utility method for introducing delays between reconnection attempts.
   * 
   * @param ms - Duration to sleep in milliseconds
   * @returns Promise that resolves after the specified duration
   * @private
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create a new ReconnectionStrategy with default settings
 * 
 * Convenience function for creating a ReconnectionStrategy with default
 * settings (3 attempts, 1s base delay).
 * 
 * @returns New ReconnectionStrategy instance
 * 
 * @example
 * ```typescript
 * import { createReconnectionStrategy } from './services/ReconnectionStrategy';
 * 
 * const strategy = createReconnectionStrategy();
 * const result = await strategy.reconnect(connectFn);
 * ```
 */
export function createReconnectionStrategy(): ReconnectionStrategy {
  return new ReconnectionStrategy();
}
