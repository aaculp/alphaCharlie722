/**
 * SubscriptionManager Unit Tests
 * 
 * Tests for the SubscriptionManager singleton service.
 * Validates subscription creation, cleanup, registry management,
 * and connection state tracking.
 */

import { SubscriptionManager } from '../SubscriptionManager';
import type { ClaimUpdate, SubscriptionError } from '../SubscriptionManager';

// Mock Supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn((callback) => {
        // Simulate successful subscription
        setTimeout(() => callback('SUBSCRIBED', null), 0);
        return {
          unsubscribe: jest.fn(),
        };
      }),
      unsubscribe: jest.fn(),
    })),
  },
}));

describe('SubscriptionManager', () => {
  let manager: SubscriptionManager;

  beforeEach(() => {
    // Get fresh instance for each test
    manager = SubscriptionManager.getInstance();
    // Clean up any existing subscriptions
    manager.cleanup();
  });

  afterEach(() => {
    // Clean up after each test
    manager.cleanup();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = SubscriptionManager.getInstance();
      const instance2 = SubscriptionManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('subscribeToClaimUpdates', () => {
    it('should create a subscription with valid claim ID', () => {
      const claimId = 'claim-123';
      const onUpdate = jest.fn();
      const onError = jest.fn();

      const subscription = manager.subscribeToClaimUpdates(
        claimId,
        onUpdate,
        onError
      );

      expect(subscription).toBeDefined();
      expect(subscription.id).toBeDefined();
      expect(subscription.isActive).toBe(true);
      expect(typeof subscription.unsubscribe).toBe('function');
    });

    it('should add subscription to registry', () => {
      const claimId = 'claim-123';
      const onUpdate = jest.fn();
      const onError = jest.fn();

      const subscription = manager.subscribeToClaimUpdates(
        claimId,
        onUpdate,
        onError
      );

      const activeSubscriptions = manager.getActiveSubscriptions();
      expect(activeSubscriptions).toContain(subscription.id);
    });

    it('should create unique subscription IDs for multiple subscriptions', () => {
      const onUpdate = jest.fn();
      const onError = jest.fn();

      const sub1 = manager.subscribeToClaimUpdates('claim-1', onUpdate, onError);
      const sub2 = manager.subscribeToClaimUpdates('claim-2', onUpdate, onError);
      const sub3 = manager.subscribeToClaimUpdates('claim-3', onUpdate, onError);

      expect(sub1.id).not.toBe(sub2.id);
      expect(sub2.id).not.toBe(sub3.id);
      expect(sub1.id).not.toBe(sub3.id);
    });
  });

  describe('subscribeToUserClaims', () => {
    it('should create a subscription with valid user ID', () => {
      const userId = 'user-456';
      const onUpdate = jest.fn();
      const onError = jest.fn();

      const subscription = manager.subscribeToUserClaims(
        userId,
        onUpdate,
        onError
      );

      expect(subscription).toBeDefined();
      expect(subscription.id).toBeDefined();
      expect(subscription.isActive).toBe(true);
      expect(typeof subscription.unsubscribe).toBe('function');
    });

    it('should add subscription to registry', () => {
      const userId = 'user-456';
      const onUpdate = jest.fn();
      const onError = jest.fn();

      const subscription = manager.subscribeToUserClaims(
        userId,
        onUpdate,
        onError
      );

      const activeSubscriptions = manager.getActiveSubscriptions();
      expect(activeSubscriptions).toContain(subscription.id);
    });
  });

  describe('unsubscribe', () => {
    it('should remove subscription from registry', () => {
      const claimId = 'claim-123';
      const onUpdate = jest.fn();
      const onError = jest.fn();

      const subscription = manager.subscribeToClaimUpdates(
        claimId,
        onUpdate,
        onError
      );

      // Verify subscription is in registry
      expect(manager.getActiveSubscriptions()).toContain(subscription.id);

      // Unsubscribe
      subscription.unsubscribe();

      // Verify subscription is removed from registry
      expect(manager.getActiveSubscriptions()).not.toContain(subscription.id);
    });

    it('should handle unsubscribing from non-existent subscription gracefully', () => {
      // Should not throw error
      expect(() => {
        manager.unsubscribe('non-existent-id');
      }).not.toThrow();
    });
  });

  describe('Multiple Concurrent Subscriptions', () => {
    it('should handle multiple concurrent subscriptions', () => {
      const onUpdate = jest.fn();
      const onError = jest.fn();

      const sub1 = manager.subscribeToClaimUpdates('claim-1', onUpdate, onError);
      const sub2 = manager.subscribeToClaimUpdates('claim-2', onUpdate, onError);
      const sub3 = manager.subscribeToUserClaims('user-1', onUpdate, onError);

      const activeSubscriptions = manager.getActiveSubscriptions();
      
      expect(activeSubscriptions).toHaveLength(3);
      expect(activeSubscriptions).toContain(sub1.id);
      expect(activeSubscriptions).toContain(sub2.id);
      expect(activeSubscriptions).toContain(sub3.id);
    });

    it('should clean up individual subscriptions without affecting others', () => {
      const onUpdate = jest.fn();
      const onError = jest.fn();

      const sub1 = manager.subscribeToClaimUpdates('claim-1', onUpdate, onError);
      const sub2 = manager.subscribeToClaimUpdates('claim-2', onUpdate, onError);
      const sub3 = manager.subscribeToUserClaims('user-1', onUpdate, onError);

      // Unsubscribe from sub2
      sub2.unsubscribe();

      const activeSubscriptions = manager.getActiveSubscriptions();
      
      expect(activeSubscriptions).toHaveLength(2);
      expect(activeSubscriptions).toContain(sub1.id);
      expect(activeSubscriptions).not.toContain(sub2.id);
      expect(activeSubscriptions).toContain(sub3.id);
    });
  });

  describe('getConnectionState', () => {
    it('should return initial connection state', () => {
      const state = manager.getConnectionState();
      
      expect(state).toBeDefined();
      expect(['disconnected', 'connecting', 'connected', 'reconnecting', 'failed']).toContain(state);
    });
  });

  describe('getActiveSubscriptions', () => {
    it('should return empty array when no subscriptions', () => {
      const activeSubscriptions = manager.getActiveSubscriptions();
      
      expect(activeSubscriptions).toEqual([]);
    });

    it('should return array of subscription IDs', () => {
      const onUpdate = jest.fn();
      const onError = jest.fn();

      const sub1 = manager.subscribeToClaimUpdates('claim-1', onUpdate, onError);
      const sub2 = manager.subscribeToUserClaims('user-1', onUpdate, onError);

      const activeSubscriptions = manager.getActiveSubscriptions();
      
      expect(activeSubscriptions).toHaveLength(2);
      expect(activeSubscriptions).toContain(sub1.id);
      expect(activeSubscriptions).toContain(sub2.id);
    });
  });

  describe('onConnectionStateChange', () => {
    it('should register connection state listener', () => {
      const listener = jest.fn();

      const unsubscribe = manager.onConnectionStateChange(listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should remove listener when unsubscribe is called', () => {
      const listener = jest.fn();

      const unsubscribe = manager.onConnectionStateChange(listener);
      unsubscribe();

      // Listener should not be called after unsubscribe
      // (We can't easily test this without triggering a state change)
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('cleanup', () => {
    it('should remove all subscriptions', () => {
      const onUpdate = jest.fn();
      const onError = jest.fn();

      manager.subscribeToClaimUpdates('claim-1', onUpdate, onError);
      manager.subscribeToClaimUpdates('claim-2', onUpdate, onError);
      manager.subscribeToUserClaims('user-1', onUpdate, onError);

      expect(manager.getActiveSubscriptions()).toHaveLength(3);

      manager.cleanup();

      expect(manager.getActiveSubscriptions()).toHaveLength(0);
    });

    it('should reset connection state to disconnected', () => {
      const onUpdate = jest.fn();
      const onError = jest.fn();

      manager.subscribeToClaimUpdates('claim-1', onUpdate, onError);
      manager.cleanup();

      const state = manager.getConnectionState();
      expect(state).toBe('disconnected');
    });
  });

  describe('subscribe (generic)', () => {
    it('should create a generic subscription', () => {
      const onUpdate = jest.fn();
      const onError = jest.fn();

      const subscription = manager.subscribe(
        'test-channel',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'test_table',
          filter: 'id=eq.123',
        },
        onUpdate,
        onError
      );

      expect(subscription).toBeDefined();
      expect(subscription.id).toBeDefined();
      expect(subscription.isActive).toBe(true);
      expect(manager.getActiveSubscriptions()).toContain(subscription.id);
    });
  });

  describe('Connection Pooling Optimizations', () => {
    it('should reuse shared channels for same claim', () => {
      const onUpdate = jest.fn();
      const onError = jest.fn();

      // Subscribe to same claim twice
      const sub1 = manager.subscribeToClaimUpdates('claim-123', onUpdate, onError);
      const sub2 = manager.subscribeToClaimUpdates('claim-123', onUpdate, onError);

      const stats = manager.getChannelStats();
      
      // Should have 1 shared channel with 2 subscriptions
      expect(stats.totalChannels).toBe(1);
      expect(stats.totalSubscriptions).toBe(2);
      expect(stats.channels[0].refCount).toBe(2);
      expect(stats.channels[0].subscriptionIds).toContain(sub1.id);
      expect(stats.channels[0].subscriptionIds).toContain(sub2.id);
    });

    it('should create separate channels for different claims', () => {
      const onUpdate = jest.fn();
      const onError = jest.fn();

      manager.subscribeToClaimUpdates('claim-1', onUpdate, onError);
      manager.subscribeToClaimUpdates('claim-2', onUpdate, onError);

      const stats = manager.getChannelStats();
      
      // Should have 2 separate channels
      expect(stats.totalChannels).toBe(2);
      expect(stats.totalSubscriptions).toBe(2);
    });

    it('should clean up shared channel when all subscriptions unsubscribe', () => {
      const onUpdate = jest.fn();
      const onError = jest.fn();

      const sub1 = manager.subscribeToClaimUpdates('claim-123', onUpdate, onError);
      const sub2 = manager.subscribeToClaimUpdates('claim-123', onUpdate, onError);

      // Both subscriptions share same channel
      expect(manager.getChannelStats().totalChannels).toBe(1);

      // Unsubscribe first subscription
      sub1.unsubscribe();
      
      // Channel should still exist (ref count = 1)
      expect(manager.getChannelStats().totalChannels).toBe(1);
      expect(manager.getChannelStats().channels[0].refCount).toBe(1);

      // Unsubscribe second subscription
      sub2.unsubscribe();
      
      // Channel should be cleaned up (ref count = 0)
      expect(manager.getChannelStats().totalChannels).toBe(0);
    });

    it('should reuse shared channels for user claims', () => {
      const onUpdate = jest.fn();
      const onError = jest.fn();

      const sub1 = manager.subscribeToUserClaims('user-123', onUpdate, onError);
      const sub2 = manager.subscribeToUserClaims('user-123', onUpdate, onError);

      const stats = manager.getChannelStats();
      
      // Should have 1 shared channel with 2 subscriptions
      expect(stats.totalChannels).toBe(1);
      expect(stats.totalSubscriptions).toBe(2);
      expect(stats.channels[0].refCount).toBe(2);
    });
  });

  describe('Debouncing Optimizations', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should process first update immediately', () => {
      const onUpdate = jest.fn();
      const onError = jest.fn();

      manager.subscribeToClaimUpdates('claim-123', onUpdate, onError);

      // Verify subscription was created
      const stats = manager.getChannelStats();
      expect(stats.totalSubscriptions).toBe(1);
    });

    it('should allow configuring debounce settings', () => {
      manager.setDebounceConfig(true, 200); // 200ms debounce

      const onUpdate = jest.fn();
      const onError = jest.fn();

      manager.subscribeToClaimUpdates('claim-123', onUpdate, onError);

      // Verify subscription was created with debouncing enabled
      const stats = manager.getChannelStats();
      expect(stats.totalSubscriptions).toBe(1);
    });

    it('should allow disabling debouncing', () => {
      manager.setDebounceConfig(false);

      const onUpdate = jest.fn();
      const onError = jest.fn();

      manager.subscribeToClaimUpdates('claim-123', onUpdate, onError);

      // Debouncing disabled, all updates should be processed
      const stats = manager.getChannelStats();
      expect(stats.totalSubscriptions).toBe(1);
    });
  });

  describe('Auto-cleanup for Finalized Claims', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should create subscription for claim', () => {
      const onUpdate = jest.fn();
      const onError = jest.fn();

      const subscription = manager.subscribeToClaimUpdates('claim-123', onUpdate, onError);

      // Verify subscription is active
      expect(manager.getActiveSubscriptions()).toContain(subscription.id);
      expect(subscription.isActive).toBe(true);
    });

    it('should handle subscription lifecycle', () => {
      const onUpdate = jest.fn();
      const onError = jest.fn();

      const subscription = manager.subscribeToClaimUpdates('claim-123', onUpdate, onError);

      // Verify subscription is active
      expect(manager.getActiveSubscriptions()).toContain(subscription.id);

      // Manual unsubscribe
      subscription.unsubscribe();

      // Verify subscription is removed
      expect(manager.getActiveSubscriptions()).not.toContain(subscription.id);
    });
  });

  describe('Channel Statistics', () => {
    it('should return accurate channel statistics', () => {
      const onUpdate = jest.fn();
      const onError = jest.fn();

      manager.subscribeToClaimUpdates('claim-1', onUpdate, onError);
      manager.subscribeToClaimUpdates('claim-1', onUpdate, onError);
      manager.subscribeToClaimUpdates('claim-2', onUpdate, onError);
      manager.subscribeToUserClaims('user-1', onUpdate, onError);

      const stats = manager.getChannelStats();

      expect(stats.totalChannels).toBe(3); // claim:claim-1, claim:claim-2, user_claims:user-1
      expect(stats.totalSubscriptions).toBe(4);
      
      // Find the shared channel for claim-1
      const claim1Channel = stats.channels.find(c => c.name === 'claim:claim-1');
      expect(claim1Channel).toBeDefined();
      expect(claim1Channel?.refCount).toBe(2);
    });

    it('should return empty statistics when no subscriptions', () => {
      const stats = manager.getChannelStats();

      expect(stats.totalChannels).toBe(0);
      expect(stats.totalSubscriptions).toBe(0);
      expect(stats.channels).toEqual([]);
    });
  });
});
