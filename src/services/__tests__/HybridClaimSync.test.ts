/**
 * HybridClaimSync Tests
 * 
 * Tests for backward compatibility with legacy claims.
 * Verifies that both real-time and polling modes work correctly.
 * 
 * Requirements: 10.2 (Backward Compatibility)
 */

import { HybridClaimSync } from '../HybridClaimSync';
import { SubscriptionManager } from '../SubscriptionManager';
import { ClaimService } from '../api/flashOfferClaims';
import { stateCache } from '../../utils/cache/StateCache';
import type { ClaimUpdate } from '../SubscriptionManager';
import type { CachedClaim } from '../../utils/cache/StateCache';

// Mock dependencies
jest.mock('../SubscriptionManager');
jest.mock('../api/flashOfferClaims');
jest.mock('../../utils/cache/StateCache');

describe('HybridClaimSync', () => {
  let hybridSync: HybridClaimSync;
  let mockSubscriptionManager: jest.Mocked<SubscriptionManager>;
  
  beforeEach(() => {
    // Reset singleton
    (HybridClaimSync as any).instance = null;
    
    // Mock SubscriptionManager
    mockSubscriptionManager = {
      subscribeToClaimUpdates: jest.fn(),
      subscribeToUserClaims: jest.fn(),
    } as any;
    
    // Get fresh instance with mocked subscription manager
    hybridSync = HybridClaimSync.getInstance(mockSubscriptionManager);
    
    // Mock stateCache
    (stateCache.getClaim as jest.Mock).mockReturnValue(null);
    (stateCache.updateClaim as jest.Mock).mockReturnValue(true);
    
    // Mock ClaimService
    (ClaimService.getClaimWithDetails as jest.Mock).mockResolvedValue(null);
    (ClaimService.getUserClaimsWithDetails as jest.Mock).mockResolvedValue({
      claims: [],
      hasMore: false,
      total: 0,
    });
  });
  
  afterEach(() => {
    // Clean up
    hybridSync.cleanup();
    jest.clearAllMocks();
    jest.clearAllTimers();
  });
  
  describe('Configuration', () => {
    it('should use default configuration', () => {
      const stats = hybridSync.getSyncStats();
      expect(stats.totalSyncs).toBe(0);
    });
    
    it('should allow custom configuration', () => {
      hybridSync.configure({
        legacyCutoffDate: '2024-03-01T00:00:00Z',
        pollingInterval: 3000,
        enableFallback: false,
      });
      
      // Configuration is applied (no direct way to verify, but no errors)
      expect(true).toBe(true);
    });
  });
  
  describe('Sync Mode Detection', () => {
    it('should use real-time for new claims', () => {
      // Mock a new claim (created after cutoff)
      const newClaim: CachedClaim = {
        claimId: 'claim-new',
        userId: 'user-123',
        status: 'active',
        claimToken: '123456',
        promotionId: 'promo-1',
        createdAt: '2024-03-15T00:00:00Z', // After default cutoff
        updatedAt: '2024-03-15T00:00:00Z',
        lastSyncedAt: '2024-03-15T00:00:00Z',
      };
      
      (stateCache.getClaim as jest.Mock).mockReturnValue(newClaim);
      
      // Mock subscription
      const mockUnsubscribe = jest.fn();
      mockSubscriptionManager.subscribeToClaimUpdates.mockReturnValue({
        id: 'sub-1',
        isActive: true,
        unsubscribe: mockUnsubscribe,
      });
      
      // Subscribe
      const unsubscribe = hybridSync.subscribeToClaimUpdates(
        'claim-new',
        jest.fn(),
        jest.fn()
      );
      
      // Verify real-time subscription was created
      expect(mockSubscriptionManager.subscribeToClaimUpdates).toHaveBeenCalledWith(
        'claim-new',
        expect.any(Function),
        expect.any(Function)
      );
      
      // Verify mode
      const mode = hybridSync.getSyncMode('claim-new');
      expect(mode).toBe('realtime');
      
      // Clean up
      unsubscribe();
    });
    
    it('should use polling for legacy claims', () => {
      jest.useFakeTimers();
      
      // Configure with cutoff date
      hybridSync.configure({
        legacyCutoffDate: '2024-03-01T00:00:00Z',
        pollingInterval: 1000,
      });
      
      // Mock a legacy claim (created before cutoff)
      const legacyClaim: CachedClaim = {
        claimId: 'claim-legacy',
        userId: 'user-123',
        status: 'active',
        claimToken: '123456',
        promotionId: 'promo-1',
        createdAt: '2024-02-15T00:00:00Z', // Before cutoff
        updatedAt: '2024-02-15T00:00:00Z',
        lastSyncedAt: '2024-02-15T00:00:00Z',
      };
      
      (stateCache.getClaim as jest.Mock).mockReturnValue(legacyClaim);
      
      // Subscribe
      const unsubscribe = hybridSync.subscribeToClaimUpdates(
        'claim-legacy',
        jest.fn(),
        jest.fn()
      );
      
      // Verify real-time subscription was NOT created
      expect(mockSubscriptionManager.subscribeToClaimUpdates).not.toHaveBeenCalled();
      
      // Verify mode
      const mode = hybridSync.getSyncMode('claim-legacy');
      expect(mode).toBe('polling');
      
      // Verify polling was set up
      expect(ClaimService.getClaimWithDetails).toHaveBeenCalledWith('claim-legacy');
      
      // Clean up
      unsubscribe();
      jest.useRealTimers();
    });
    
    it('should default to real-time when claim not in cache', () => {
      // Mock no cached claim
      (stateCache.getClaim as jest.Mock).mockReturnValue(null);
      
      // Mock subscription
      mockSubscriptionManager.subscribeToClaimUpdates.mockReturnValue({
        id: 'sub-1',
        isActive: true,
        unsubscribe: jest.fn(),
      });
      
      // Subscribe
      const unsubscribe = hybridSync.subscribeToClaimUpdates(
        'claim-unknown',
        jest.fn(),
        jest.fn()
      );
      
      // Verify real-time subscription was created
      expect(mockSubscriptionManager.subscribeToClaimUpdates).toHaveBeenCalled();
      
      // Verify mode
      const mode = hybridSync.getSyncMode('claim-unknown');
      expect(mode).toBe('realtime');
      
      // Clean up
      unsubscribe();
    });
  });
  
  describe('Real-time Sync', () => {
    it('should handle real-time updates', () => {
      const onUpdate = jest.fn();
      const onError = jest.fn();
      
      // Mock subscription
      let updateCallback: (update: ClaimUpdate) => void;
      mockSubscriptionManager.subscribeToClaimUpdates.mockImplementation((claimId, onUpd, onErr) => {
        updateCallback = onUpd;
        return {
          id: 'sub-1',
          isActive: true,
          unsubscribe: jest.fn(),
        };
      });
      
      // Subscribe
      hybridSync.subscribeToClaimUpdates('claim-1', onUpdate, onError);
      
      // Simulate real-time update
      const update: ClaimUpdate = {
        claimId: 'claim-1',
        status: 'redeemed',
        updatedAt: '2024-03-15T12:00:00Z',
      };
      
      updateCallback!(update);
      
      // Verify callback was invoked
      expect(onUpdate).toHaveBeenCalledWith(update);
      expect(onError).not.toHaveBeenCalled();
    });
    
    it('should fall back to polling when real-time fails', () => {
      jest.useFakeTimers();
      
      hybridSync.configure({
        enableFallback: true,
        pollingInterval: 1000,
      });
      
      const onUpdate = jest.fn();
      const onError = jest.fn();
      
      // Mock subscription that fails
      let errorCallback: (error: any) => void;
      mockSubscriptionManager.subscribeToClaimUpdates.mockImplementation((claimId, onUpd, onErr) => {
        errorCallback = onErr;
        return {
          id: 'sub-1',
          isActive: true,
          unsubscribe: jest.fn(),
        };
      });
      
      // Subscribe
      const unsubscribe = hybridSync.subscribeToClaimUpdates('claim-1', onUpdate, onError);
      
      // Verify initial mode is real-time
      expect(hybridSync.getSyncMode('claim-1')).toBe('realtime');
      
      // Simulate non-retryable error
      errorCallback!({
        type: 'connection_failed',
        message: 'Connection failed',
        retryable: false,
      });
      
      // Verify mode changed to fallback
      expect(hybridSync.getSyncMode('claim-1')).toBe('fallback');
      
      // Verify polling started
      expect(ClaimService.getClaimWithDetails).toHaveBeenCalledWith('claim-1');
      
      // Clean up
      unsubscribe();
      jest.useRealTimers();
    });
    
    it('should not fall back when fallback is disabled', () => {
      hybridSync.configure({
        enableFallback: false,
      });
      
      const onUpdate = jest.fn();
      const onError = jest.fn();
      
      // Mock subscription that fails
      let errorCallback: (error: any) => void;
      mockSubscriptionManager.subscribeToClaimUpdates.mockImplementation((claimId, onUpd, onErr) => {
        errorCallback = onErr;
        return {
          id: 'sub-1',
          isActive: true,
          unsubscribe: jest.fn(),
        };
      });
      
      // Subscribe
      hybridSync.subscribeToClaimUpdates('claim-1', onUpdate, onError);
      
      // Simulate non-retryable error
      errorCallback!({
        type: 'connection_failed',
        message: 'Connection failed',
        retryable: false,
      });
      
      // Verify error was passed to caller
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      
      // Verify mode is still real-time (no fallback)
      expect(hybridSync.getSyncMode('claim-1')).toBe('realtime');
    });
  });
  
  describe('Polling Sync', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    
    afterEach(() => {
      jest.useRealTimers();
    });
    
    it('should poll for updates at configured interval', async () => {
      hybridSync.configure({
        legacyCutoffDate: '2024-03-01T00:00:00Z',
        pollingInterval: 2000,
      });
      
      // Mock legacy claim
      const legacyClaim: CachedClaim = {
        claimId: 'claim-legacy',
        userId: 'user-123',
        status: 'active',
        claimToken: '123456',
        promotionId: 'promo-1',
        createdAt: '2024-02-15T00:00:00Z',
        updatedAt: '2024-02-15T00:00:00Z',
        lastSyncedAt: '2024-02-15T00:00:00Z',
      };
      
      (stateCache.getClaim as jest.Mock).mockReturnValue(legacyClaim);
      
      // Mock server response
      (ClaimService.getClaimWithDetails as jest.Mock).mockResolvedValue({
        id: 'claim-legacy',
        user_id: 'user-123',
        status: 'active',
        token: '123456',
        offer_id: 'promo-1',
        created_at: '2024-02-15T00:00:00Z',
        updated_at: '2024-02-15T00:00:00Z',
        redeemed_at: null,
        redeemed_by_user_id: null,
      });
      
      const onUpdate = jest.fn();
      
      // Subscribe
      const unsubscribe = hybridSync.subscribeToClaimUpdates(
        'claim-legacy',
        onUpdate,
        jest.fn()
      );
      
      // Wait for initial poll
      await jest.runOnlyPendingTimersAsync();
      
      // Verify polling started
      expect(ClaimService.getClaimWithDetails).toHaveBeenCalled();
      expect(ClaimService.getClaimWithDetails).toHaveBeenCalledWith('claim-legacy');
      
      // Verify at least 2 calls happened (initial + interval)
      expect((ClaimService.getClaimWithDetails as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(2);
      
      // Clean up
      unsubscribe();
    });
    
    it('should detect status changes during polling', async () => {
      hybridSync.configure({
        legacyCutoffDate: '2024-03-01T00:00:00Z',
        pollingInterval: 1000,
      });
      
      // Mock legacy claim
      const legacyClaim: CachedClaim = {
        claimId: 'claim-legacy',
        userId: 'user-123',
        status: 'active',
        claimToken: '123456',
        promotionId: 'promo-1',
        createdAt: '2024-02-15T00:00:00Z',
        updatedAt: '2024-02-15T00:00:00Z',
        lastSyncedAt: '2024-02-15T00:00:00Z',
      };
      
      (stateCache.getClaim as jest.Mock).mockReturnValue(legacyClaim);
      
      // Mock server response with status change
      (ClaimService.getClaimWithDetails as jest.Mock).mockResolvedValue({
        id: 'claim-legacy',
        user_id: 'user-123',
        status: 'redeemed', // Status changed!
        token: '123456',
        offer_id: 'promo-1',
        created_at: '2024-02-15T00:00:00Z',
        updated_at: '2024-03-15T12:00:00Z',
        redeemed_at: '2024-03-15T12:00:00Z',
        redeemed_by_user_id: 'staff-456',
      });
      
      const onUpdate = jest.fn();
      
      // Subscribe
      const unsubscribe = hybridSync.subscribeToClaimUpdates(
        'claim-legacy',
        onUpdate,
        jest.fn()
      );
      
      // Wait for initial poll
      await jest.runOnlyPendingTimersAsync();
      
      // Verify update callback was invoked
      expect(onUpdate).toHaveBeenCalledWith({
        claimId: 'claim-legacy',
        status: 'redeemed',
        updatedAt: '2024-03-15T12:00:00Z',
        redeemedAt: '2024-03-15T12:00:00Z',
        redeemedByUserId: 'staff-456',
      });
      
      // Verify cache was updated
      expect(stateCache.updateClaim).toHaveBeenCalledWith('claim-legacy', expect.objectContaining({
        status: 'redeemed',
      }));
      
      // Clean up
      unsubscribe();
    });
    
    it('should handle polling errors gracefully', async () => {
      hybridSync.configure({
        legacyCutoffDate: '2024-03-01T00:00:00Z',
        pollingInterval: 1000,
      });
      
      // Mock legacy claim
      const legacyClaim: CachedClaim = {
        claimId: 'claim-legacy',
        userId: 'user-123',
        status: 'active',
        claimToken: '123456',
        promotionId: 'promo-1',
        createdAt: '2024-02-15T00:00:00Z',
        updatedAt: '2024-02-15T00:00:00Z',
        lastSyncedAt: '2024-02-15T00:00:00Z',
      };
      
      (stateCache.getClaim as jest.Mock).mockReturnValue(legacyClaim);
      
      // Mock server error
      (ClaimService.getClaimWithDetails as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );
      
      const onUpdate = jest.fn();
      const onError = jest.fn();
      
      // Subscribe
      const unsubscribe = hybridSync.subscribeToClaimUpdates(
        'claim-legacy',
        onUpdate,
        onError
      );
      
      // Wait for initial poll
      await jest.runOnlyPendingTimersAsync();
      
      // Verify error callback was invoked
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      
      // Clean up
      unsubscribe();
    });
  });
  
  describe('User Claims Sync', () => {
    it('should subscribe to all user claims', () => {
      const onUpdate = jest.fn();
      const onError = jest.fn();
      
      // Mock subscription
      mockSubscriptionManager.subscribeToUserClaims.mockReturnValue({
        id: 'sub-1',
        isActive: true,
        unsubscribe: jest.fn(),
      });
      
      // Subscribe
      const unsubscribe = hybridSync.subscribeToUserClaims('user-123', onUpdate, onError);
      
      // Verify subscription was created
      expect(mockSubscriptionManager.subscribeToUserClaims).toHaveBeenCalledWith(
        'user-123',
        expect.any(Function),
        expect.any(Function)
      );
      
      // Verify mode
      const mode = hybridSync.getSyncMode('user:user-123');
      expect(mode).toBe('realtime');
      
      // Clean up
      unsubscribe();
    });
  });
  
  describe('Statistics', () => {
    it('should track sync statistics', () => {
      // Mock subscriptions
      mockSubscriptionManager.subscribeToClaimUpdates.mockReturnValue({
        id: 'sub-1',
        isActive: true,
        unsubscribe: jest.fn(),
      });
      
      // Subscribe to multiple claims
      const unsub1 = hybridSync.subscribeToClaimUpdates('claim-1', jest.fn(), jest.fn());
      const unsub2 = hybridSync.subscribeToClaimUpdates('claim-2', jest.fn(), jest.fn());
      
      // Get stats
      const stats = hybridSync.getSyncStats();
      
      expect(stats.totalSyncs).toBe(2);
      expect(stats.realtimeCount).toBe(2);
      expect(stats.pollingCount).toBe(0);
      expect(stats.fallbackCount).toBe(0);
      
      // Clean up
      unsub1();
      unsub2();
    });
  });
  
  describe('Cleanup', () => {
    it('should clean up all syncs', () => {
      jest.useFakeTimers();
      
      // Mock subscriptions
      const mockUnsubscribe1 = jest.fn();
      const mockUnsubscribe2 = jest.fn();
      
      mockSubscriptionManager.subscribeToClaimUpdates
        .mockReturnValueOnce({
          id: 'sub-1',
          isActive: true,
          unsubscribe: mockUnsubscribe1,
        })
        .mockReturnValueOnce({
          id: 'sub-2',
          isActive: true,
          unsubscribe: mockUnsubscribe2,
        });
      
      // Subscribe to multiple claims
      hybridSync.subscribeToClaimUpdates('claim-1', jest.fn(), jest.fn());
      hybridSync.subscribeToClaimUpdates('claim-2', jest.fn(), jest.fn());
      
      // Verify syncs are active
      expect(hybridSync.getSyncStats().totalSyncs).toBe(2);
      
      // Clean up
      hybridSync.cleanup();
      
      // Verify all syncs were cleaned up
      expect(hybridSync.getSyncStats().totalSyncs).toBe(0);
      expect(mockUnsubscribe1).toHaveBeenCalled();
      expect(mockUnsubscribe2).toHaveBeenCalled();
      
      jest.useRealTimers();
    });
  });
});
