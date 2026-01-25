/**
 * Unit tests for network connectivity monitoring
 * 
 * Tests Requirement 10.4:
 * - Network connectivity detection
 * - Resume paused mutations when online
 * - Invalidate queries when connectivity restored
 */

import { QueryClient } from '@tanstack/react-query';

// Mock NetInfo before importing
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn(),
}));

import NetInfo from '@react-native-community/netinfo';
import { setupNetworkSync, getNetworkState, isConnected } from '../networkSync';

describe('Network Connectivity Monitoring', () => {
  let queryClient: QueryClient;
  let mockUnsubscribe: jest.Mock;

  beforeEach(() => {
    queryClient = new QueryClient();
    mockUnsubscribe = jest.fn();

    // Mock NetInfo.addEventListener
    (NetInfo.addEventListener as jest.Mock).mockReturnValue(mockUnsubscribe);

    // Mock NetInfo.fetch
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    });

    // Spy on queryClient methods
    jest.spyOn(queryClient, 'resumePausedMutations');
    jest.spyOn(queryClient, 'invalidateQueries');
  });

  afterEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  describe('setupNetworkSync (Requirement 10.4)', () => {
    it('should subscribe to network state changes', () => {
      setupNetworkSync(queryClient);

      expect(NetInfo.addEventListener).toHaveBeenCalledTimes(1);
      expect(NetInfo.addEventListener).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should return cleanup function', () => {
      const cleanup = setupNetworkSync(queryClient);

      expect(typeof cleanup).toBe('function');
    });

    it('should unsubscribe when cleanup is called', () => {
      const cleanup = setupNetworkSync(queryClient);
      cleanup();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('should resume paused mutations when device comes online', () => {
      setupNetworkSync(queryClient);

      // Get the callback function passed to addEventListener
      const callback = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0];

      // Simulate device coming online
      callback({ isConnected: true });

      expect(queryClient.resumePausedMutations).toHaveBeenCalledTimes(1);
    });

    it('should invalidate all queries when device comes online', () => {
      setupNetworkSync(queryClient);

      // Get the callback function passed to addEventListener
      const callback = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0];

      // Simulate device coming online
      callback({ isConnected: true });

      expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    });

    it('should not resume mutations when device is offline', () => {
      setupNetworkSync(queryClient);

      // Get the callback function passed to addEventListener
      const callback = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0];

      // Simulate device going offline
      callback({ isConnected: false });

      expect(queryClient.resumePausedMutations).not.toHaveBeenCalled();
      expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
    });
  });

  describe('getNetworkState', () => {
    it('should fetch current network state', async () => {
      const state = await getNetworkState();

      expect(NetInfo.fetch).toHaveBeenCalledTimes(1);
      expect(state).toEqual({
        isConnected: true,
        isInternetReachable: true,
      });
    });
  });

  describe('isConnected', () => {
    it('should return true when device is connected', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: true,
      });

      const connected = await isConnected();

      expect(connected).toBe(true);
    });

    it('should return false when device is not connected', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: false,
      });

      const connected = await isConnected();

      expect(connected).toBe(false);
    });

    it('should return false when isConnected is null', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: null,
      });

      const connected = await isConnected();

      expect(connected).toBe(false);
    });
  });
});
