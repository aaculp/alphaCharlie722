/**
 * Unit tests for ReconnectionStrategy
 * 
 * Tests exponential backoff logic, max retry limits, connection state tracking,
 * and reconnection behavior.
 */

import { ReconnectionStrategy, ReconnectionState } from '../ReconnectionStrategy';

describe('ReconnectionStrategy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('initialization', () => {
    it('should initialize with default settings', () => {
      const strategy = new ReconnectionStrategy();
      
      expect(strategy.getState()).toBe('idle');
      expect(strategy.getAttempts()).toBe(0);
      expect(strategy.getMaxAttempts()).toBe(3);
      expect(strategy.getLastAttemptTime()).toBe(0);
      expect(strategy.hasReachedMaxAttempts()).toBe(false);
    });

    it('should initialize with custom settings', () => {
      const strategy = new ReconnectionStrategy(5, 2000);
      
      expect(strategy.getMaxAttempts()).toBe(5);
    });
  });

  describe('exponential backoff timing', () => {
    it('should calculate correct delays for each attempt', () => {
      const strategy = new ReconnectionStrategy();
      
      // Attempt 1: 1000 * 2^0 = 1000ms (1s)
      expect(strategy.calculateDelay(1)).toBe(1000);
      
      // Attempt 2: 1000 * 2^1 = 2000ms (2s)
      expect(strategy.calculateDelay(2)).toBe(2000);
      
      // Attempt 3: 1000 * 2^2 = 4000ms (4s)
      expect(strategy.calculateDelay(3)).toBe(4000);
    });

    it('should calculate correct delays with custom base delay', () => {
      const strategy = new ReconnectionStrategy(3, 500);
      
      // Attempt 1: 500 * 2^0 = 500ms
      expect(strategy.calculateDelay(1)).toBe(500);
      
      // Attempt 2: 500 * 2^1 = 1000ms
      expect(strategy.calculateDelay(2)).toBe(1000);
      
      // Attempt 3: 500 * 2^2 = 2000ms
      expect(strategy.calculateDelay(3)).toBe(2000);
    });

    it('should use exponential backoff delays during reconnection', async () => {
      jest.useFakeTimers();
      
      const strategy = new ReconnectionStrategy();
      const mockConnect = jest.fn()
        .mockRejectedValueOnce(new Error('Attempt 1 failed'))
        .mockRejectedValueOnce(new Error('Attempt 2 failed'))
        .mockRejectedValueOnce(new Error('Attempt 3 failed'));
      
      const reconnectPromise = strategy.reconnect(mockConnect);
      
      // Fast-forward through all delays
      // Attempt 1 fails, wait 1s
      await jest.advanceTimersByTimeAsync(1000);
      
      // Attempt 2 fails, wait 2s
      await jest.advanceTimersByTimeAsync(2000);
      
      // Attempt 3 fails, no more retries
      await jest.advanceTimersByTimeAsync(4000);
      
      const result = await reconnectPromise;
      
      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3);
      expect(mockConnect).toHaveBeenCalledTimes(3);
      
      jest.useRealTimers();
    });
  });

  describe('max retry limit enforcement', () => {
    it('should stop after max attempts', async () => {
      const strategy = new ReconnectionStrategy();
      const mockConnect = jest.fn().mockRejectedValue(new Error('Connection failed'));
      
      const result = await strategy.reconnect(mockConnect);
      
      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3);
      expect(mockConnect).toHaveBeenCalledTimes(3);
      expect(strategy.hasReachedMaxAttempts()).toBe(true);
    });

    it('should respect custom max attempts', async () => {
      jest.useFakeTimers();
      
      const strategy = new ReconnectionStrategy(5);
      const mockConnect = jest.fn().mockRejectedValue(new Error('Connection failed'));
      
      const reconnectPromise = strategy.reconnect(mockConnect);
      
      // Fast-forward through all delays
      // Attempt 1 fails, wait 1s
      await jest.advanceTimersByTimeAsync(1000);
      // Attempt 2 fails, wait 2s
      await jest.advanceTimersByTimeAsync(2000);
      // Attempt 3 fails, wait 4s
      await jest.advanceTimersByTimeAsync(4000);
      // Attempt 4 fails, wait 8s
      await jest.advanceTimersByTimeAsync(8000);
      // Attempt 5 fails, no more retries
      await jest.advanceTimersByTimeAsync(16000);
      
      const result = await reconnectPromise;
      
      expect(result.success).toBe(false);
      expect(result.attempts).toBe(5);
      expect(mockConnect).toHaveBeenCalledTimes(5);
      
      jest.useRealTimers();
    });

    it('should return failed state after max attempts', async () => {
      const strategy = new ReconnectionStrategy();
      const mockConnect = jest.fn().mockRejectedValue(new Error('Connection failed'));
      
      const result = await strategy.reconnect(mockConnect);
      
      expect(result.state).toBe('failed');
      expect(strategy.getState()).toBe('failed');
    });
  });

  describe('successful reconnection', () => {
    it('should succeed on first attempt', async () => {
      const strategy = new ReconnectionStrategy();
      const mockConnect = jest.fn().mockResolvedValue(undefined);
      
      const result = await strategy.reconnect(mockConnect);
      
      expect(result.success).toBe(true);
      expect(result.attempts).toBe(0); // Reset on success
      expect(result.state).toBe('connected');
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    it('should succeed on second attempt', async () => {
      const strategy = new ReconnectionStrategy();
      const mockConnect = jest.fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(undefined);
      
      const result = await strategy.reconnect(mockConnect);
      
      expect(result.success).toBe(true);
      expect(result.attempts).toBe(0); // Reset on success
      expect(result.state).toBe('connected');
      expect(mockConnect).toHaveBeenCalledTimes(2);
    });

    it('should succeed on third attempt', async () => {
      const strategy = new ReconnectionStrategy();
      const mockConnect = jest.fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockRejectedValueOnce(new Error('Second attempt failed'))
        .mockResolvedValueOnce(undefined);
      
      const result = await strategy.reconnect(mockConnect);
      
      expect(result.success).toBe(true);
      expect(result.attempts).toBe(0); // Reset on success
      expect(result.state).toBe('connected');
      expect(mockConnect).toHaveBeenCalledTimes(3);
    });

    it('should reset attempt counter on success', async () => {
      const strategy = new ReconnectionStrategy();
      const mockConnect = jest.fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(undefined);
      
      await strategy.reconnect(mockConnect);
      
      expect(strategy.getAttempts()).toBe(0);
      expect(strategy.hasReachedMaxAttempts()).toBe(false);
    });
  });

  describe('connection state tracking', () => {
    it('should transition through states correctly on success', async () => {
      const strategy = new ReconnectionStrategy();
      const mockConnect = jest.fn().mockResolvedValue(undefined);
      
      expect(strategy.getState()).toBe('idle');
      
      const resultPromise = strategy.reconnect(mockConnect);
      
      // State should be 'connecting' during first attempt
      // (We can't easily test this without race conditions, so we'll check the final state)
      
      const result = await resultPromise;
      
      expect(result.state).toBe('connected');
      expect(strategy.getState()).toBe('connected');
    });

    it('should transition through states correctly on failure', async () => {
      const strategy = new ReconnectionStrategy();
      const mockConnect = jest.fn().mockRejectedValue(new Error('Connection failed'));
      
      expect(strategy.getState()).toBe('idle');
      
      const result = await strategy.reconnect(mockConnect);
      
      expect(result.state).toBe('failed');
      expect(strategy.getState()).toBe('failed');
    });

    it('should track last attempt time', async () => {
      const strategy = new ReconnectionStrategy();
      const mockConnect = jest.fn().mockResolvedValue(undefined);
      
      const beforeTime = Date.now();
      await strategy.reconnect(mockConnect);
      const afterTime = Date.now();
      
      const lastAttemptTime = strategy.getLastAttemptTime();
      expect(lastAttemptTime).toBeGreaterThanOrEqual(beforeTime);
      expect(lastAttemptTime).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('reset functionality', () => {
    it('should reset state to idle', async () => {
      const strategy = new ReconnectionStrategy();
      const mockConnect = jest.fn().mockRejectedValue(new Error('Connection failed'));
      
      await strategy.reconnect(mockConnect);
      
      expect(strategy.getState()).toBe('failed');
      expect(strategy.getAttempts()).toBe(3);
      
      strategy.reset();
      
      expect(strategy.getState()).toBe('idle');
      expect(strategy.getAttempts()).toBe(0);
      expect(strategy.getLastAttemptTime()).toBe(0);
      expect(strategy.hasReachedMaxAttempts()).toBe(false);
    });

    it('should allow fresh reconnection after reset', async () => {
      const strategy = new ReconnectionStrategy();
      const mockConnect = jest.fn()
        .mockRejectedValue(new Error('Connection failed'));
      
      // First reconnection attempt (fails)
      await strategy.reconnect(mockConnect);
      expect(strategy.getState()).toBe('failed');
      expect(mockConnect).toHaveBeenCalledTimes(3);
      
      // Reset and try again
      strategy.reset();
      mockConnect.mockResolvedValue(undefined);
      
      const result = await strategy.reconnect(mockConnect);
      
      expect(result.success).toBe(true);
      expect(result.state).toBe('connected');
      expect(mockConnect).toHaveBeenCalledTimes(4); // 3 from first attempt + 1 from second
    });
  });

  describe('error handling', () => {
    it('should handle Error objects', async () => {
      const strategy = new ReconnectionStrategy();
      const mockConnect = jest.fn().mockRejectedValue(new Error('Connection timeout'));
      
      const result = await strategy.reconnect(mockConnect);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection timeout');
    });

    it('should handle non-Error rejections', async () => {
      const strategy = new ReconnectionStrategy();
      const mockConnect = jest.fn().mockRejectedValue('String error');
      
      const result = await strategy.reconnect(mockConnect);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });

    it('should include error message in result', async () => {
      const strategy = new ReconnectionStrategy();
      const mockConnect = jest.fn().mockRejectedValue(new Error('Network unreachable'));
      
      const result = await strategy.reconnect(mockConnect);
      
      expect(result.error).toBe('Network unreachable');
    });
  });

  describe('edge cases', () => {
    it('should handle immediate success without delays', async () => {
      const strategy = new ReconnectionStrategy();
      const mockConnect = jest.fn().mockResolvedValue(undefined);
      
      const startTime = Date.now();
      await strategy.reconnect(mockConnect);
      const elapsed = Date.now() - startTime;
      
      // Should complete almost immediately (< 100ms)
      expect(elapsed).toBeLessThan(100);
    });

    it('should handle zero max attempts gracefully', async () => {
      const strategy = new ReconnectionStrategy(0);
      const mockConnect = jest.fn().mockResolvedValue(undefined);
      
      const result = await strategy.reconnect(mockConnect);
      
      // With 0 max attempts, should fail immediately
      expect(result.success).toBe(false);
      expect(result.attempts).toBe(0);
      expect(mockConnect).not.toHaveBeenCalled();
    });

    it('should handle single max attempt', async () => {
      const strategy = new ReconnectionStrategy(1);
      const mockConnect = jest.fn().mockRejectedValue(new Error('Failed'));
      
      const result = await strategy.reconnect(mockConnect);
      
      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('concurrent reconnection attempts', () => {
    it('should handle multiple concurrent reconnect calls', async () => {
      const strategy = new ReconnectionStrategy();
      const mockConnect = jest.fn().mockResolvedValue(undefined);
      
      // Start multiple reconnection attempts concurrently
      const results = await Promise.all([
        strategy.reconnect(mockConnect),
        strategy.reconnect(mockConnect),
        strategy.reconnect(mockConnect),
      ]);
      
      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      
      // Total calls should be 3 (one per concurrent attempt)
      expect(mockConnect).toHaveBeenCalledTimes(3);
    });
  });

  describe('state queries', () => {
    it('should correctly report hasReachedMaxAttempts', async () => {
      const strategy = new ReconnectionStrategy();
      const mockConnect = jest.fn().mockRejectedValue(new Error('Failed'));
      
      expect(strategy.hasReachedMaxAttempts()).toBe(false);
      
      await strategy.reconnect(mockConnect);
      
      expect(strategy.hasReachedMaxAttempts()).toBe(true);
    });

    it('should return correct max attempts', () => {
      const strategy1 = new ReconnectionStrategy();
      expect(strategy1.getMaxAttempts()).toBe(3);
      
      const strategy2 = new ReconnectionStrategy(7);
      expect(strategy2.getMaxAttempts()).toBe(7);
    });
  });
});
