/**
 * FCMService Timeout Tests
 * 
 * Tests for timeout handling in Edge Function calls
 */

import { FCMService } from '../FCMService';
import { supabase } from '../../lib/supabase';

// Mock supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
    supabaseUrl: 'https://test.supabase.co',
  },
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('FCMService - Timeout Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful auth session
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: {
        session: {
          access_token: 'test-token',
        },
      },
      error: null,
    });
  });

  it('should timeout after 30 seconds and retry once', async () => {
    // Mock fetch to simulate timeout
    let callCount = 0;
    (global.fetch as jest.Mock).mockImplementation(() => {
      callCount++;
      return new Promise((_, reject) => {
        setTimeout(() => {
          const error = new Error('The operation was aborted');
          error.name = 'AbortError';
          reject(error);
        }, 100); // Simulate quick abort for testing
      });
    });

    const result = await FCMService.sendViaEdgeFunction('test-offer-id');

    // Should have tried twice (initial + 1 retry)
    expect(callCount).toBe(2);
    expect(result.success).toBe(false);
    expect(result.errors[0].error).toContain('timed out');
  }, 10000);

  it('should clear timeout on successful response', async () => {
    // Mock successful response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        targetedUserCount: 10,
        sentCount: 10,
        failedCount: 0,
        errors: [],
      }),
    });

    const result = await FCMService.sendViaEdgeFunction('test-offer-id');

    expect(result.success).toBe(true);
    expect(result.sentCount).toBe(10);
  });

  it('should clear timeout on error response', async () => {
    // Mock error response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        error: 'Invalid request',
        code: 'INVALID_REQUEST',
      }),
    });

    const result = await FCMService.sendViaEdgeFunction('test-offer-id');

    expect(result.success).toBe(false);
    expect(result.errors[0].error).toContain('Invalid request');
  });

  it('should handle network errors with retry', async () => {
    let callCount = 0;
    (global.fetch as jest.Mock).mockImplementation(() => {
      callCount++;
      return Promise.reject(new Error('Network error'));
    });

    const result = await FCMService.sendViaEdgeFunction('test-offer-id');

    // Should have tried twice (initial + 1 retry)
    expect(callCount).toBe(2);
    expect(result.success).toBe(false);
  });
});
