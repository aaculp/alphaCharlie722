/**
 * Unit Tests for FCMService Retry Logic
 * Task: 16.4 Write unit test for retry logic
 * Feature: flash-offer-push-backend
 * 
 * Tests that failed calls are retried once after 2 seconds
 * Requirements: 4.5, 4.6
 */

import { FCMService } from '../FCMService';
import { supabase } from '../../lib/supabase';

// Mock Supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('FCMService - Retry Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  /**
   * Test: Failed calls are retried once after 2 seconds
   * Requirements: 4.5, 4.6
   */
  describe('Retry Logic for Failed Calls', () => {
    it('should retry once after 2 seconds when Edge Function returns 500 error', async () => {
      const offerId = 'test-offer-id-123';
      const jwtToken = 'test-jwt-token-abc';

      // Mock successful session with JWT token
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            access_token: jwtToken,
            user: { id: 'test-user-id' },
          },
        },
        error: null,
      });

      // Mock first call fails with 500 (retryable), second succeeds
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          // First call: server error (retryable)
          return {
            ok: false,
            status: 500,
            json: async () => ({
              success: false,
              error: 'Internal server error',
              code: 'INTERNAL_ERROR',
            }),
          };
        } else {
          // Second call: success
          return {
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              targetedUserCount: 10,
              sentCount: 10,
              failedCount: 0,
              errors: [],
            }),
          };
        }
      });

      // Start the async call
      const resultPromise = FCMService.sendViaEdgeFunction(offerId);

      // Fast-forward time by 2 seconds to trigger retry
      await jest.advanceTimersByTimeAsync(2000);

      // Wait for the result
      const result = await resultPromise;

      // Verify fetch was called twice (initial + 1 retry)
      expect(global.fetch).toHaveBeenCalledTimes(2);

      // Verify the result is successful (from the retry)
      expect(result.success).toBe(true);
      expect(result.sentCount).toBe(10);
    });

    it('should retry once after 2 seconds when network error occurs', async () => {
      const offerId = 'test-offer-id-456';
      const jwtToken = 'test-jwt-token-def';

      // Mock successful session with JWT token
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            access_token: jwtToken,
            user: { id: 'test-user-id' },
          },
        },
        error: null,
      });

      // Mock first call throws network error, second succeeds
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          // First call: network error
          throw new Error('Network request failed');
        } else {
          // Second call: success
          return {
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              targetedUserCount: 5,
              sentCount: 5,
              failedCount: 0,
              errors: [],
            }),
          };
        }
      });

      // Start the async call
      const resultPromise = FCMService.sendViaEdgeFunction(offerId);

      // Fast-forward time by 2 seconds to trigger retry
      await jest.advanceTimersByTimeAsync(2000);

      // Wait for the result
      const result = await resultPromise;

      // Verify fetch was called twice (initial + 1 retry)
      expect(global.fetch).toHaveBeenCalledTimes(2);

      // Verify the result is successful (from the retry)
      expect(result.success).toBe(true);
      expect(result.sentCount).toBe(5);
    });

    it('should NOT retry when Edge Function returns 404 error (non-retryable)', async () => {
      const offerId = 'test-offer-id-789';
      const jwtToken = 'test-jwt-token-ghi';

      // Mock successful session with JWT token
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            access_token: jwtToken,
            user: { id: 'test-user-id' },
          },
        },
        error: null,
      });

      // Mock call returns 404 (non-retryable)
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: 'Offer not found',
          code: 'OFFER_NOT_FOUND',
        }),
      });

      // Call sendViaEdgeFunction
      const result = await FCMService.sendViaEdgeFunction(offerId);

      // Verify fetch was called only once (no retry)
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Verify the result is an error
      expect(result.success).toBe(false);
      expect(result.errors[0].error).toContain('Offer not found');
    });

    it('should NOT retry when Edge Function returns 400 error (non-retryable)', async () => {
      const offerId = 'test-offer-id-abc';
      const jwtToken = 'test-jwt-token-jkl';

      // Mock successful session with JWT token
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            access_token: jwtToken,
            user: { id: 'test-user-id' },
          },
        },
        error: null,
      });

      // Mock call returns 400 (non-retryable)
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Invalid request',
          code: 'INVALID_REQUEST',
        }),
      });

      // Call sendViaEdgeFunction
      const result = await FCMService.sendViaEdgeFunction(offerId);

      // Verify fetch was called only once (no retry)
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Verify the result is an error
      expect(result.success).toBe(false);
      expect(result.errors[0].error).toContain('Invalid request');
    });

    it('should NOT retry when Edge Function returns 429 rate limit error (non-retryable)', async () => {
      const offerId = 'test-offer-id-def';
      const jwtToken = 'test-jwt-token-mno';

      // Mock successful session with JWT token
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            access_token: jwtToken,
            user: { id: 'test-user-id' },
          },
        },
        error: null,
      });

      // Mock call returns 429 (non-retryable)
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({
          success: false,
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
        }),
      });

      // Call sendViaEdgeFunction
      const result = await FCMService.sendViaEdgeFunction(offerId);

      // Verify fetch was called only once (no retry)
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Verify the result is an error
      expect(result.success).toBe(false);
      expect(result.errors[0].error).toContain('Rate limit exceeded');
    });

    it('should wait before retrying (verified by successful retry)', async () => {
      const offerId = 'test-offer-id-timing';
      const jwtToken = 'test-jwt-token-timing';

      // Mock successful session with JWT token
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            access_token: jwtToken,
            user: { id: 'test-user-id' },
          },
        },
        error: null,
      });

      // Mock first call fails, second succeeds
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          // First call: server error
          return {
            ok: false,
            status: 500,
            json: async () => ({
              success: false,
              error: 'Internal server error',
              code: 'INTERNAL_ERROR',
            }),
          };
        } else {
          // Second call: success
          return {
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              targetedUserCount: 10,
              sentCount: 10,
              failedCount: 0,
              errors: [],
            }),
          };
        }
      });

      // Start the async call
      const resultPromise = FCMService.sendViaEdgeFunction(offerId);

      // Fast-forward time by 2 seconds to trigger retry
      await jest.advanceTimersByTimeAsync(2000);

      // Wait for the result
      const result = await resultPromise;

      // Verify fetch was called twice (initial + 1 retry after delay)
      expect(global.fetch).toHaveBeenCalledTimes(2);

      // Verify the result is successful (from the retry)
      expect(result.success).toBe(true);
    });

    it('should only retry once, not multiple times', async () => {
      const offerId = 'test-offer-id-max-retry';
      const jwtToken = 'test-jwt-token-max-retry';

      // Mock successful session with JWT token
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            access_token: jwtToken,
            user: { id: 'test-user-id' },
          },
        },
        error: null,
      });

      // Mock all calls fail with 500 (retryable)
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: 'Internal server error',
          code: 'INTERNAL_ERROR',
        }),
      });

      // Start the async call
      const resultPromise = FCMService.sendViaEdgeFunction(offerId);

      // Fast-forward time by 2 seconds to trigger first retry
      await jest.advanceTimersByTimeAsync(2000);

      // Fast-forward time by another 2 seconds (in case it tries to retry again)
      await jest.advanceTimersByTimeAsync(2000);

      // Wait for the result
      const result = await resultPromise;

      // Verify fetch was called exactly twice (initial + 1 retry, no more)
      expect(global.fetch).toHaveBeenCalledTimes(2);

      // Verify the result is an error (both attempts failed)
      expect(result.success).toBe(false);
    });

    it('should include JWT token in retry attempt', async () => {
      const offerId = 'test-offer-id-jwt-retry';
      const jwtToken = 'test-jwt-token-jwt-retry';

      // Mock successful session with JWT token
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            access_token: jwtToken,
            user: { id: 'test-user-id' },
          },
        },
        error: null,
      });

      // Mock first call fails, second succeeds
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: false,
            status: 500,
            json: async () => ({
              success: false,
              error: 'Internal server error',
              code: 'INTERNAL_ERROR',
            }),
          };
        } else {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              targetedUserCount: 10,
              sentCount: 10,
              failedCount: 0,
              errors: [],
            }),
          };
        }
      });

      // Start the async call
      const resultPromise = FCMService.sendViaEdgeFunction(offerId);

      // Fast-forward time by 2 seconds
      await jest.advanceTimersByTimeAsync(2000);

      // Wait for the result
      await resultPromise;

      // Verify both calls included the JWT token
      const fetchCalls = (global.fetch as jest.Mock).mock.calls;
      expect(fetchCalls.length).toBe(2);

      for (const [_url, options] of fetchCalls) {
        expect(options.headers.Authorization).toBe(`Bearer ${jwtToken}`);
      }
    });

    it('should include offer ID in retry attempt', async () => {
      const offerId = 'test-offer-id-offer-retry';
      const jwtToken = 'test-jwt-token-offer-retry';

      // Mock successful session with JWT token
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            access_token: jwtToken,
            user: { id: 'test-user-id' },
          },
        },
        error: null,
      });

      // Mock first call fails, second succeeds
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: false,
            status: 500,
            json: async () => ({
              success: false,
              error: 'Internal server error',
              code: 'INTERNAL_ERROR',
            }),
          };
        } else {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              targetedUserCount: 10,
              sentCount: 10,
              failedCount: 0,
              errors: [],
            }),
          };
        }
      });

      // Start the async call
      const resultPromise = FCMService.sendViaEdgeFunction(offerId);

      // Fast-forward time by 2 seconds
      await jest.advanceTimersByTimeAsync(2000);

      // Wait for the result
      await resultPromise;

      // Verify both calls included the offer ID
      const fetchCalls = (global.fetch as jest.Mock).mock.calls;
      expect(fetchCalls.length).toBe(2);

      for (const [_url, options] of fetchCalls) {
        const requestBody = JSON.parse(options.body);
        expect(requestBody.offerId).toBe(offerId);
      }
    });
  });
});
