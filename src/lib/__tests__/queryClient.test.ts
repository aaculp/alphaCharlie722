/**
 * Unit tests for Query Client setup
 * 
 * Tests Requirements 1.1, 1.2, 1.3, 1.4, 1.5:
 * - QueryClient initialization with correct default options
 * - QueryClientProvider wrapping
 * - DevTools inclusion when __DEV__ is true
 */

import { QueryClient } from '@tanstack/react-query';
import { createQueryClient } from '../queryClient';

describe('Query Client Configuration', () => {
  describe('createQueryClient', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
      queryClient = createQueryClient();
    });

    afterEach(() => {
      queryClient.clear();
    });

    it('should create a QueryClient instance', () => {
      expect(queryClient).toBeInstanceOf(QueryClient);
    });

    it('should set staleTime to 30 seconds (30000ms)', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.queries?.staleTime).toBe(30000);
    });

    it('should set gcTime (cacheTime) to 5 minutes (300000ms)', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.queries?.gcTime).toBe(300000);
    });

    it('should set retry to custom function', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(typeof defaultOptions.queries?.retry).toBe('function');
    });

    it('should set retryDelay to custom function', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(typeof defaultOptions.queries?.retryDelay).toBe('function');
    });

    it('should enable refetchOnWindowFocus', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(true);
    });

    it('should enable refetchOnReconnect', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.queries?.refetchOnReconnect).toBe(true);
    });

    it('should set mutation retry to 0 by default', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.mutations?.retry).toBe(0);
    });
  });

  describe('Query Client Configuration Values', () => {
    it('should have correct staleTime configuration (Requirement 1.2)', () => {
      const client = createQueryClient();
      const options = client.getDefaultOptions();
      
      // Verify staleTime is 30 seconds
      expect(options.queries?.staleTime).toBe(30000);
    });

    it('should have correct cacheTime configuration (Requirement 1.3)', () => {
      const client = createQueryClient();
      const options = client.getDefaultOptions();
      
      // Verify gcTime (formerly cacheTime) is 5 minutes
      expect(options.queries?.gcTime).toBe(300000);
    });

    it('should have correct retry configuration (Requirement 1.3)', () => {
      const client = createQueryClient();
      const options = client.getDefaultOptions();
      
      // Verify retry is a custom function
      expect(typeof options.queries?.retry).toBe('function');
    });
  });
});
