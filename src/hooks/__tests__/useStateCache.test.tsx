/**
 * useStateCache Hook Tests
 * 
 * Tests for the useStateCache hook that provides access to StateCache
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { useStateCache } from '../useStateCache';
import { stateCache } from '../../utils/cache/StateCache';

// Mock the StateCache
jest.mock('../../utils/cache/StateCache', () => ({
  stateCache: {
    isInitialized: jest.fn(),
    initialize: jest.fn(),
  },
}));

describe('useStateCache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return cache instance and ready state', () => {
    (stateCache.isInitialized as jest.Mock).mockReturnValue(true);

    const { result } = renderHook(() => useStateCache());

    expect(result.current.cache).toBe(stateCache);
    expect(result.current.isReady).toBe(true);
  });

  it('should initialize cache if not already initialized', async () => {
    (stateCache.isInitialized as jest.Mock).mockReturnValue(false);
    (stateCache.initialize as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useStateCache());

    expect(result.current.isReady).toBe(false);

    await waitFor(() => {
      expect(stateCache.initialize).toHaveBeenCalled();
      expect(result.current.isReady).toBe(true);
    });
  });

  it('should not reinitialize if already initialized', () => {
    (stateCache.isInitialized as jest.Mock).mockReturnValue(true);

    renderHook(() => useStateCache());

    expect(stateCache.initialize).not.toHaveBeenCalled();
  });
});
