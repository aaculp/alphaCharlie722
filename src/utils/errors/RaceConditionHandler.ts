/**
 * RaceConditionHandler
 * 
 * Handles race conditions in flash offer operations
 * Provides optimistic UI updates with rollback capabilities
 */

export interface OptimisticUpdate<T> {
  id: string;
  data: T;
  timestamp: number;
}

export interface RollbackData<T> {
  previousData: T;
  updateId: string;
}

export class RaceConditionHandler {
  private static pendingUpdates = new Map<string, OptimisticUpdate<any>>();
  private static rollbackData = new Map<string, RollbackData<any>>();

  /**
   * Apply an optimistic update
   * Returns an update ID that can be used to rollback if needed
   */
  static applyOptimisticUpdate<T>(
    key: string,
    currentData: T,
    optimisticData: T
  ): string {
    const updateId = `${key}_${Date.now()}_${Math.random()}`;
    
    // Store the previous data for potential rollback
    this.rollbackData.set(updateId, {
      previousData: currentData,
      updateId,
    });

    // Store the optimistic update
    this.pendingUpdates.set(key, {
      id: updateId,
      data: optimisticData,
      timestamp: Date.now(),
    });

    return updateId;
  }

  /**
   * Confirm an optimistic update (remove from pending)
   */
  static confirmUpdate(key: string, updateId: string): void {
    const pending = this.pendingUpdates.get(key);
    if (pending && pending.id === updateId) {
      this.pendingUpdates.delete(key);
      this.rollbackData.delete(updateId);
    }
  }

  /**
   * Rollback an optimistic update
   */
  static rollbackUpdate<T>(updateId: string): T | null {
    const rollback = this.rollbackData.get(updateId);
    if (!rollback) {
      return null;
    }

    // Remove from pending updates
    for (const [key, update] of this.pendingUpdates.entries()) {
      if (update.id === updateId) {
        this.pendingUpdates.delete(key);
        break;
      }
    }

    // Remove rollback data
    this.rollbackData.delete(updateId);

    return rollback.previousData as T;
  }

  /**
   * Check if there's a pending update for a key
   */
  static hasPendingUpdate(key: string): boolean {
    return this.pendingUpdates.has(key);
  }

  /**
   * Get pending update data
   */
  static getPendingUpdate<T>(key: string): T | null {
    const pending = this.pendingUpdates.get(key);
    return pending ? pending.data : null;
  }

  /**
   * Clear all pending updates (useful for cleanup)
   */
  static clearAll(): void {
    this.pendingUpdates.clear();
    this.rollbackData.clear();
  }

  /**
   * Clear old pending updates (older than specified time)
   */
  static clearOldUpdates(maxAgeMs: number = 60000): void {
    const now = Date.now();
    
    for (const [key, update] of this.pendingUpdates.entries()) {
      if (now - update.timestamp > maxAgeMs) {
        this.pendingUpdates.delete(key);
        this.rollbackData.delete(update.id);
      }
    }
  }
}

/**
 * Race condition error types
 */
export class RaceConditionError extends Error {
  constructor(
    message: string,
    public readonly type: 'offer_full' | 'offer_expired' | 'already_redeemed' | 'already_claimed'
  ) {
    super(message);
    this.name = 'RaceConditionError';
  }
}

/**
 * Detect race condition errors from API responses
 */
export function detectRaceCondition(error: any): RaceConditionError | null {
  const message = (error.message || '').toLowerCase();

  if (message.includes('maximum claims') || message.includes('offer full')) {
    return new RaceConditionError(
      'This offer filled up while you were claiming it. Please try another offer.',
      'offer_full'
    );
  }

  if (message.includes('expired') || message.includes('no longer active')) {
    return new RaceConditionError(
      'This offer expired while you were viewing it. Please check for other active offers.',
      'offer_expired'
    );
  }

  if (message.includes('already redeemed')) {
    return new RaceConditionError(
      'This token has already been redeemed by another staff member.',
      'already_redeemed'
    );
  }

  if (message.includes('already claimed')) {
    return new RaceConditionError(
      'You have already claimed this offer.',
      'already_claimed'
    );
  }

  return null;
}
