/**
 * ClaimSyncService Tests
 * 
 * Unit tests for ClaimSyncService functionality including:
 * - Network state monitoring
 * - Offline-to-online synchronization
 * - Initial sync on app launch
 * - Missed update notifications
 * - Manual sync triggering
 * 
 * Requirements: 5.1, 5.2, 5.3
 */

import NetInfo from '@react-native-community/netinfo';
import { ClaimSyncService } from '../ClaimSyncService';
import { stateCache } from '../../utils/cache/StateCache';
import { FeedbackManager } from '../FeedbackManager';
import { ClaimService } from '../api/flashOfferClaims';
import type { CachedClaim } from '../../utils/cache/StateCache';

// Mock dependencies
jest.mock('@react-native-community/netinfo');
jest.mock('../../utils/cache/StateCache');
jest.mock('../FeedbackManager');
jest.mock('../api/flashOfferClaims');

describe('ClaimSyncService', () => {
  let syncService: ClaimSyncService;
  let mockNetInfoListener: any;
  let mockFeedbackManager: jest.Mocked<FeedbackManager>;

  beforeEach(() => {
    // Reset singleton instance
    (ClaimSyncService as any).instance = null;
    syncService = ClaimSyncService.getInstance();

    // Mock NetInfo
    mockNetInfoListener = null;
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      mockNetInfoListener = callback;
      return jest.fn(); // Return unsubscribe function
    });

    // Mock FeedbackManager
    mockFeedbackManager = {
      showConnectionWarning: jest.fn(),
      hideConnectionWarning: jest.fn(),
      showAcceptedFeedback: jest.fn(),
      showRejectedFeedback: jest.fn(),
    } as any;
    (FeedbackManager.getInstance as jest.Mock).mockReturnValue(mockFeedbackManager);

    // Mock StateCache
    (stateCache.initialize as jest.Mock).mockResolvedValue(undefined);
    (stateCache.getUserClaims as jest.Mock).mockReturnValue([]);
    // Mock syncWithServer to actually call the fetchClaimsFn
    (stateCache.syncWithServer as jest.Mock).mockImplementation(async (userId, fetchFn) => {
      await fetchFn(userId);
    });

    // Mock ClaimService
    (ClaimService.getUserClaimsWithDetails as jest.Mock).mockResolvedValue({
      claims: [],
      hasMore: false,
      total: 0,
    });
  });

  afterEach(() => {
    syncService.cleanup();
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ClaimSyncService.getInstance();
      const instance2 = ClaimSyncService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('Initialization (Requirement 5.2)', () => {
    it('should initialize StateCache on initialization', async () => {
      await syncService.initialize('user-123');

      expect(stateCache.initialize).toHaveBeenCalledTimes(1);
    });

    it('should set up network monitoring on initialization', async () => {
      await syncService.initialize('user-123');

      expect(NetInfo.addEventListener).toHaveBeenCalledTimes(1);
      expect(mockNetInfoListener).toBeDefined();
    });

    it('should perform initial sync on app launch', async () => {
      const mockClaims = [
        {
          id: 'claim-1',
          user_id: 'user-123',
          status: 'active',
          claim_token: 'ABC123',
          promotion_id: 'promo-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      (ClaimService.getUserClaimsWithDetails as jest.Mock).mockResolvedValue({
        claims: mockClaims,
        hasMore: false,
        total: 1,
      });

      // Mock getUserClaims to return empty initially, then the synced claims
      (stateCache.getUserClaims as jest.Mock)
        .mockReturnValueOnce([]) // Before sync
        .mockReturnValueOnce([   // After sync
          {
            claimId: 'claim-1',
            userId: 'user-123',
            status: 'active',
            claimToken: 'ABC123',
            promotionId: 'promo-1',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            lastSyncedAt: expect.any(String),
          },
        ]);

      // Mock syncWithServer to actually call the fetchClaimsFn
      (stateCache.syncWithServer as jest.Mock).mockImplementation(async (userId, fetchFn) => {
        await fetchFn(userId);
      });

      await syncService.initialize('user-123');

      expect(ClaimService.getUserClaimsWithDetails).toHaveBeenCalledWith('user-123');
      expect(stateCache.syncWithServer).toHaveBeenCalled();
    });
  });

  describe('Network State Monitoring (Requirement 5.1)', () => {
    it('should show connection warning when device goes offline', async () => {
      await syncService.initialize('user-123');

      // Simulate going offline
      mockNetInfoListener({ isConnected: false });

      expect(mockFeedbackManager.showConnectionWarning).toHaveBeenCalledTimes(1);
    });

    it('should hide connection warning when device comes online', async () => {
      await syncService.initialize('user-123');

      // Simulate going offline then online
      mockNetInfoListener({ isConnected: false });
      mockNetInfoListener({ isConnected: true });

      expect(mockFeedbackManager.hideConnectionWarning).toHaveBeenCalledTimes(1);
    });

    it('should trigger sync when device comes back online', async () => {
      // Set up mock to return claims
      (ClaimService.getUserClaimsWithDetails as jest.Mock).mockResolvedValue({
        claims: [],
        hasMore: false,
        total: 0,
      });

      (stateCache.getUserClaims as jest.Mock).mockReturnValue([]);

      await syncService.initialize('user-123');

      // Clear initial sync calls
      jest.clearAllMocks();

      // Simulate going offline then online
      mockNetInfoListener({ isConnected: false });
      
      // Wait a bit for async operations
      await new Promise(resolve => setTimeout(resolve, 10));
      
      mockNetInfoListener({ isConnected: true });

      // Wait for sync to be triggered
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(ClaimService.getUserClaimsWithDetails).toHaveBeenCalled();
    });

    it('should not trigger sync when going offline', async () => {
      await syncService.initialize('user-123');

      // Clear initial sync calls
      jest.clearAllMocks();

      // Simulate going offline
      mockNetInfoListener({ isConnected: false });

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(ClaimService.getUserClaimsWithDetails).not.toHaveBeenCalled();
    });
  });

  describe('Claim Synchronization', () => {
    it('should sync claims with server', async () => {
      const mockClaims = [
        {
          id: 'claim-1',
          user_id: 'user-123',
          status: 'active',
          claim_token: 'ABC123',
          promotion_id: 'promo-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      (ClaimService.getUserClaimsWithDetails as jest.Mock).mockResolvedValue({
        claims: mockClaims,
        hasMore: false,
        total: 1,
      });

      (stateCache.getUserClaims as jest.Mock).mockReturnValue([
        {
          claimId: 'claim-1',
          userId: 'user-123',
          status: 'active',
          claimToken: 'ABC123',
          promotionId: 'promo-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          lastSyncedAt: '2024-01-01T00:00:00Z',
        },
      ]);

      await syncService.initialize('user-123');
      const result = await syncService.syncClaims('user-123');

      expect(result.success).toBe(true);
      expect(result.claimsSynced).toBe(1);
      expect(stateCache.syncWithServer).toHaveBeenCalled();
    });

    it('should detect status changes during sync', async () => {
      // Mock cached claim with 'active' status
      const cachedClaim: CachedClaim = {
        claimId: 'claim-1',
        userId: 'user-123',
        status: 'active',
        claimToken: 'ABC123',
        promotionId: 'promo-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        lastSyncedAt: '2024-01-01T00:00:00Z',
      };

      // Mock server claim with 'redeemed' status
      const serverClaim = {
        id: 'claim-1',
        user_id: 'user-123',
        status: 'redeemed',
        claim_token: 'ABC123',
        promotion_id: 'promo-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T12:00:00Z',
      };

      // Mock getUserClaims to return cached claim before sync, updated claim after
      (stateCache.getUserClaims as jest.Mock)
        .mockReturnValueOnce([cachedClaim]) // Before sync (in syncClaims)
        .mockReturnValueOnce([{ ...cachedClaim, status: 'redeemed', updatedAt: '2024-01-01T12:00:00Z' }]); // After sync

      (ClaimService.getUserClaimsWithDetails as jest.Mock).mockResolvedValue({
        claims: [serverClaim],
        hasMore: false,
        total: 1,
      });

      await syncService.initialize('user-123');
      
      // Clear the getUserClaims calls from initialization
      (stateCache.getUserClaims as jest.Mock).mockClear();
      
      // Set up the mock sequence again for the syncClaims call
      (stateCache.getUserClaims as jest.Mock)
        .mockReturnValueOnce([cachedClaim]) // Before sync
        .mockReturnValueOnce([{ ...cachedClaim, status: 'redeemed', updatedAt: '2024-01-01T12:00:00Z' }]); // After sync
      
      const result = await syncService.syncClaims('user-123');

      expect(result.statusChanges).toBe(1);
      expect(result.changedClaims).toHaveLength(1);
      expect(result.changedClaims[0].status).toBe('redeemed');
    });

    it('should handle sync errors gracefully', async () => {
      (ClaimService.getUserClaimsWithDetails as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      // Mock syncWithServer to throw error
      (stateCache.syncWithServer as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await syncService.initialize('user-123');
      const result = await syncService.syncClaims('user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.claimsSynced).toBe(0);
    });
  });

  describe('Missed Update Notifications (Requirement 5.3)', () => {
    it('should display notifications for redeemed claims', async () => {
      const cachedClaim: CachedClaim = {
        claimId: 'claim-1',
        userId: 'user-123',
        status: 'active',
        claimToken: 'ABC123',
        promotionId: 'promo-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        lastSyncedAt: '2024-01-01T00:00:00Z',
      };

      const updatedClaim: CachedClaim = {
        ...cachedClaim,
        status: 'redeemed',
        updatedAt: '2024-01-01T12:00:00Z',
      };

      (stateCache.getUserClaims as jest.Mock)
        .mockReturnValueOnce([cachedClaim])
        .mockReturnValueOnce([updatedClaim]);

      (ClaimService.getUserClaimsWithDetails as jest.Mock).mockResolvedValue({
        claims: [{
          id: 'claim-1',
          user_id: 'user-123',
          status: 'redeemed',
          claim_token: 'ABC123',
          promotion_id: 'promo-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T12:00:00Z',
        }],
        hasMore: false,
        total: 1,
      });

      await syncService.initialize('user-123');

      expect(mockFeedbackManager.showAcceptedFeedback).toHaveBeenCalledWith('claim-1');
    });

    it('should display notifications for expired claims', async () => {
      const cachedClaim: CachedClaim = {
        claimId: 'claim-1',
        userId: 'user-123',
        status: 'active',
        claimToken: 'ABC123',
        promotionId: 'promo-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        lastSyncedAt: '2024-01-01T00:00:00Z',
      };

      const updatedClaim: CachedClaim = {
        ...cachedClaim,
        status: 'expired',
        updatedAt: '2024-01-01T12:00:00Z',
      };

      (stateCache.getUserClaims as jest.Mock)
        .mockReturnValueOnce([cachedClaim])
        .mockReturnValueOnce([updatedClaim]);

      (ClaimService.getUserClaimsWithDetails as jest.Mock).mockResolvedValue({
        claims: [{
          id: 'claim-1',
          user_id: 'user-123',
          status: 'expired',
          claim_token: 'ABC123',
          promotion_id: 'promo-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T12:00:00Z',
        }],
        hasMore: false,
        total: 1,
      });

      await syncService.initialize('user-123');

      expect(mockFeedbackManager.showRejectedFeedback).toHaveBeenCalledWith(
        'claim-1',
        'This claim has expired'
      );
    });
  });

  describe('Manual Sync', () => {
    it('should allow manual sync trigger', async () => {
      // Set up mock to return claims
      (ClaimService.getUserClaimsWithDetails as jest.Mock).mockResolvedValue({
        claims: [],
        hasMore: false,
        total: 0,
      });

      (stateCache.getUserClaims as jest.Mock).mockReturnValue([]);

      await syncService.initialize('user-123');

      // Clear initial sync calls
      jest.clearAllMocks();

      const result = await syncService.manualSync();

      expect(ClaimService.getUserClaimsWithDetails).toHaveBeenCalledWith('user-123');
      expect(result.success).toBe(true);
    });

    it('should return error if no user ID is set', async () => {
      const result = await syncService.manualSync();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No user ID set');
    });
  });

  describe('State Queries', () => {
    it('should return online state', async () => {
      await syncService.initialize('user-123');

      // Simulate online state
      mockNetInfoListener({ isConnected: true });

      expect(syncService.isDeviceOnline()).toBe(true);
    });

    it('should return offline state', async () => {
      await syncService.initialize('user-123');

      // Simulate offline state
      mockNetInfoListener({ isConnected: false });

      expect(syncService.isDeviceOnline()).toBe(false);
    });

    it('should return last sync timestamp', async () => {
      await syncService.initialize('user-123');

      const timestamp = syncService.getLastSyncTimestamp();

      expect(timestamp).toBeGreaterThan(0);
    });
  });

  describe('Cleanup', () => {
    it('should clean up network listener on cleanup', async () => {
      const mockUnsubscribe = jest.fn();
      (NetInfo.addEventListener as jest.Mock).mockReturnValue(mockUnsubscribe);

      await syncService.initialize('user-123');
      syncService.cleanup();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('should reset state on cleanup', async () => {
      await syncService.initialize('user-123');
      syncService.cleanup();

      const result = await syncService.manualSync();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No user ID set');
    });
  });
});
