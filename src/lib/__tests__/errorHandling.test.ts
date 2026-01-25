/**
 * Unit tests for error handling and retry logic
 * 
 * Tests Requirements 10.1, 10.2, 10.3, 10.4, 10.5:
 * - Retry configuration
 * - Error message display
 * - Stale data fallback
 * - Network reconnect refetch
 * - Pull-to-refresh
 */

import { QueryClient } from '@tanstack/react-query';
import { createQueryClient } from '../queryClient';

describe('Error Handling and Retry Logic', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createQueryClient();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Retry Configuration (Requirement 10.1)', () => {
    it('should have custom retry function', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(typeof defaultOptions.queries?.retry).toBe('function');
    });

    it('should not retry on 401 Unauthorized', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      const retryFn = defaultOptions.queries?.retry as (
        failureCount: number,
        error: unknown
      ) => boolean;

      const error = { status: 401 };
      const shouldRetry = retryFn(0, error);

      expect(shouldRetry).toBe(false);
    });

    it('should not retry on 403 Forbidden', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      const retryFn = defaultOptions.queries?.retry as (
        failureCount: number,
        error: unknown
      ) => boolean;

      const error = { status: 403 };
      const shouldRetry = retryFn(0, error);

      expect(shouldRetry).toBe(false);
    });

    it('should not retry on 404 Not Found', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      const retryFn = defaultOptions.queries?.retry as (
        failureCount: number,
        error: unknown
      ) => boolean;

      const error = { status: 404 };
      const shouldRetry = retryFn(0, error);

      expect(shouldRetry).toBe(false);
    });

    it('should retry on 500 Server Error', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      const retryFn = defaultOptions.queries?.retry as (
        failureCount: number,
        error: unknown
      ) => boolean;

      const error = { status: 500 };
      const shouldRetry = retryFn(0, error);

      expect(shouldRetry).toBe(true);
    });

    it('should retry on network errors', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      const retryFn = defaultOptions.queries?.retry as (
        failureCount: number,
        error: unknown
      ) => boolean;

      const error = new Error('Network request failed');
      const shouldRetry = retryFn(0, error);

      expect(shouldRetry).toBe(true);
    });

    it('should not retry after 3 attempts', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      const retryFn = defaultOptions.queries?.retry as (
        failureCount: number,
        error: unknown
      ) => boolean;

      const error = { status: 500 };
      const shouldRetry = retryFn(3, error);

      expect(shouldRetry).toBe(false);
    });

    it('should retry up to 3 times for 5xx errors', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      const retryFn = defaultOptions.queries?.retry as (
        failureCount: number,
        error: unknown
      ) => boolean;

      const error = { status: 503 };

      expect(retryFn(0, error)).toBe(true); // 1st attempt
      expect(retryFn(1, error)).toBe(true); // 2nd attempt
      expect(retryFn(2, error)).toBe(true); // 3rd attempt
      expect(retryFn(3, error)).toBe(false); // No 4th attempt
    });
  });

  describe('Exponential Backoff (Requirement 10.1)', () => {
    it('should have custom retryDelay function', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(typeof defaultOptions.queries?.retryDelay).toBe('function');
    });

    it('should use exponential backoff for retry delays', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      const retryDelayFn = defaultOptions.queries?.retryDelay as (
        attemptIndex: number
      ) => number;

      // 1st retry: 1 second (2^0 * 1000)
      expect(retryDelayFn(0)).toBe(1000);

      // 2nd retry: 2 seconds (2^1 * 1000)
      expect(retryDelayFn(1)).toBe(2000);

      // 3rd retry: 4 seconds (2^2 * 1000)
      expect(retryDelayFn(2)).toBe(4000);
    });

    it('should cap retry delay at 30 seconds', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      const retryDelayFn = defaultOptions.queries?.retryDelay as (
        attemptIndex: number
      ) => number;

      // Large attempt index should be capped at 30000ms
      expect(retryDelayFn(10)).toBe(30000);
      expect(retryDelayFn(20)).toBe(30000);
    });
  });

  describe('Query Configuration', () => {
    it('should enable refetchOnWindowFocus for automatic refetch', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(true);
    });

    it('should enable refetchOnReconnect for network recovery', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.queries?.refetchOnReconnect).toBe(true);
    });
  });

  describe('Mutation Configuration', () => {
    it('should not retry mutations by default', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.mutations?.retry).toBe(0);
    });
  });
});
