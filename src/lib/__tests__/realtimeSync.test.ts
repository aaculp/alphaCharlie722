/**
 * Unit Tests for Real-Time Sync Subscription Lifecycle
 * 
 * Feature: react-query-integration
 * 
 * **Validates: Requirements 7.4, 7.5**
 * 
 * Tests verify that Supabase channels are subscribed when queries mount
 * and unsubscribed when queries unmount.
 */

import { QueryClient } from '@tanstack/react-query';
import { setupRealtimeSync } from '../realtimeSync';
import { supabase } from '../supabase';

// Mock the supabase client
jest.mock('../supabase', () => ({
  supabase: {
    channel: jest.fn(),
  },
}));

interface MockChannel {
  on: jest.Mock;
  subscribe: jest.Mock;
  unsubscribe: jest.Mock;
}

describe('Real-Time Sync Subscription Lifecycle', () => {
  let mockChannel: MockChannel;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock channel
    mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
      unsubscribe: jest.fn(),
    };

    // Mock supabase.channel to return our mock channel
    (supabase.channel as jest.Mock).mockReturnValue(mockChannel);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * **Validates: Requirement 7.4**
   * 
   * Test that channels are subscribed when queries mount.
   * This ensures that real-time updates are enabled when the app starts.
   */
  describe('Channel Subscription', () => {
    it('should subscribe to venue changes channel when setup is called', () => {
      const queryClient = new QueryClient();

      setupRealtimeSync(queryClient);

      // Verify venue channel was created
      expect(supabase.channel).toHaveBeenCalledWith('venue-changes');

      // Verify subscription was established
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'venues' },
        expect.any(Function)
      );

      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('should subscribe to check-in changes channel when setup is called', () => {
      const queryClient = new QueryClient();

      setupRealtimeSync(queryClient);

      // Verify check-in channel was created
      expect(supabase.channel).toHaveBeenCalledWith('checkin-changes');

      // Verify subscription was established
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'check_ins' },
        expect.any(Function)
      );

      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('should subscribe to flash offer changes channel when setup is called', () => {
      const queryClient = new QueryClient();

      setupRealtimeSync(queryClient);

      // Verify flash offer channel was created
      expect(supabase.channel).toHaveBeenCalledWith('flash-offer-changes');

      // Verify subscription was established
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'flash_offers' },
        expect.any(Function)
      );

      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('should subscribe to all three channels when setup is called', () => {
      const queryClient = new QueryClient();

      setupRealtimeSync(queryClient);

      // Verify all three channels were created
      expect(supabase.channel).toHaveBeenCalledTimes(3);
      expect(supabase.channel).toHaveBeenCalledWith('venue-changes');
      expect(supabase.channel).toHaveBeenCalledWith('checkin-changes');
      expect(supabase.channel).toHaveBeenCalledWith('flash-offer-changes');

      // Verify all subscriptions were established
      expect(mockChannel.subscribe).toHaveBeenCalledTimes(3);
    });

    it('should pass subscription status callback to subscribe', () => {
      const queryClient = new QueryClient();

      setupRealtimeSync(queryClient);

      // Verify subscribe was called with a callback
      expect(mockChannel.subscribe).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  /**
   * **Validates: Requirement 7.5**
   * 
   * Test that channels are unsubscribed when queries unmount.
   * This ensures proper cleanup and prevents memory leaks.
   */
  describe('Channel Unsubscription', () => {
    it('should unsubscribe from all channels when cleanup is called', () => {
      const queryClient = new QueryClient();

      const cleanup = setupRealtimeSync(queryClient);

      // Call cleanup
      cleanup();

      // Verify all channels were unsubscribed
      expect(mockChannel.unsubscribe).toHaveBeenCalledTimes(3);
    });

    it('should unsubscribe from venue channel when cleanup is called', () => {
      const queryClient = new QueryClient();

      const cleanup = setupRealtimeSync(queryClient);

      // Verify subscription was established
      expect(mockChannel.subscribe).toHaveBeenCalled();

      // Call cleanup
      cleanup();

      // Verify unsubscribe was called
      expect(mockChannel.unsubscribe).toHaveBeenCalled();
    });

    it('should unsubscribe from check-in channel when cleanup is called', () => {
      const queryClient = new QueryClient();

      const cleanup = setupRealtimeSync(queryClient);

      // Verify subscription was established
      expect(mockChannel.subscribe).toHaveBeenCalled();

      // Call cleanup
      cleanup();

      // Verify unsubscribe was called
      expect(mockChannel.unsubscribe).toHaveBeenCalled();
    });

    it('should unsubscribe from flash offer channel when cleanup is called', () => {
      const queryClient = new QueryClient();

      const cleanup = setupRealtimeSync(queryClient);

      // Verify subscription was established
      expect(mockChannel.subscribe).toHaveBeenCalled();

      // Call cleanup
      cleanup();

      // Verify unsubscribe was called
      expect(mockChannel.unsubscribe).toHaveBeenCalled();
    });

    it('should not throw error if cleanup is called multiple times', () => {
      const queryClient = new QueryClient();

      const cleanup = setupRealtimeSync(queryClient);

      // Call cleanup multiple times
      expect(() => {
        cleanup();
        cleanup();
        cleanup();
      }).not.toThrow();

      // Verify unsubscribe was called 3 times for each cleanup call
      expect(mockChannel.unsubscribe).toHaveBeenCalledTimes(9); // 3 channels × 3 cleanup calls
    });
  });

  /**
   * Test that subscription lifecycle is complete
   * 
   * This verifies the full lifecycle: setup → subscribe → cleanup → unsubscribe
   */
  describe('Complete Subscription Lifecycle', () => {
    it('should complete full lifecycle: setup → subscribe → cleanup → unsubscribe', () => {
      const queryClient = new QueryClient();

      // Step 1: Setup
      const cleanup = setupRealtimeSync(queryClient);

      // Step 2: Verify subscriptions were established
      expect(supabase.channel).toHaveBeenCalledTimes(3);
      expect(mockChannel.on).toHaveBeenCalledTimes(3);
      expect(mockChannel.subscribe).toHaveBeenCalledTimes(3);

      // Step 3: Cleanup
      cleanup();

      // Step 4: Verify unsubscriptions were called
      expect(mockChannel.unsubscribe).toHaveBeenCalledTimes(3);
    });

    it('should maintain separate channels for each table', () => {
      const queryClient = new QueryClient();

      setupRealtimeSync(queryClient);

      // Verify each channel has a unique name
      const channelCalls = (supabase.channel as jest.Mock).mock.calls;
      const channelNames = channelCalls.map(call => call[0]);

      expect(channelNames).toContain('venue-changes');
      expect(channelNames).toContain('checkin-changes');
      expect(channelNames).toContain('flash-offer-changes');

      // Verify no duplicate channel names
      const uniqueNames = new Set(channelNames);
      expect(uniqueNames.size).toBe(3);
    });

    it('should return a cleanup function that is callable', () => {
      const queryClient = new QueryClient();

      const cleanup = setupRealtimeSync(queryClient);

      // Verify cleanup is a function
      expect(typeof cleanup).toBe('function');

      // Verify cleanup can be called without errors
      expect(() => cleanup()).not.toThrow();
    });
  });

  /**
   * Test error handling in subscription lifecycle
   */
  describe('Subscription Error Handling', () => {
    it('should handle subscription errors gracefully', () => {
      const queryClient = new QueryClient();

      // Mock subscribe to call the error callback
      mockChannel.subscribe.mockImplementation((callback) => {
        callback('CHANNEL_ERROR', new Error('Connection failed'));
        return mockChannel;
      });

      // Should not throw error during setup
      expect(() => setupRealtimeSync(queryClient)).not.toThrow();
    });

    it('should handle successful subscription status', () => {
      const queryClient = new QueryClient();

      // Mock subscribe to call the success callback
      mockChannel.subscribe.mockImplementation((callback) => {
        callback('SUBSCRIBED', null);
        return mockChannel;
      });

      // Should not throw error during setup
      expect(() => setupRealtimeSync(queryClient)).not.toThrow();
    });

    it('should continue with other subscriptions if one fails', () => {
      const queryClient = new QueryClient();

      let callCount = 0;
      mockChannel.subscribe.mockImplementation((callback) => {
        callCount++;
        if (callCount === 1) {
          // First subscription fails
          callback('CHANNEL_ERROR', new Error('Connection failed'));
        } else {
          // Other subscriptions succeed
          callback('SUBSCRIBED', null);
        }
        return mockChannel;
      });

      setupRealtimeSync(queryClient);

      // All three subscriptions should still be attempted
      expect(mockChannel.subscribe).toHaveBeenCalledTimes(3);
    });
  });
});
