/**
 * Unit Tests for FCMTokenService
 * Task: 1.4 Write unit tests for Firebase setup
 * 
 * Tests FCM initialization, token generation, and permission handling
 */

import { FCMTokenService } from '../FCMTokenService';
import { DeviceTokenManager } from '../DeviceTokenManager';
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

// Mock DeviceTokenManager
jest.mock('../DeviceTokenManager', () => ({
  DeviceTokenManager: {
    storeToken: jest.fn(),
    updateLastUsed: jest.fn(),
  },
}));

describe('FCMTokenService', () => {
  const mockMessaging = messaging();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should request permission and succeed when authorized', async () => {
      (mockMessaging.requestPermission as jest.Mock).mockResolvedValue(
        messaging.AuthorizationStatus.AUTHORIZED
      );

      await expect(FCMTokenService.initialize()).resolves.not.toThrow();
      expect(mockMessaging.requestPermission).toHaveBeenCalled();
    });

    it('should request permission and succeed when provisional', async () => {
      (mockMessaging.requestPermission as jest.Mock).mockResolvedValue(
        messaging.AuthorizationStatus.PROVISIONAL
      );

      await expect(FCMTokenService.initialize()).resolves.not.toThrow();
      expect(mockMessaging.requestPermission).toHaveBeenCalled();
    });

    it('should handle denied permission gracefully', async () => {
      (mockMessaging.requestPermission as jest.Mock).mockResolvedValue(
        messaging.AuthorizationStatus.DENIED
      );

      await expect(FCMTokenService.initialize()).resolves.not.toThrow();
      expect(mockMessaging.requestPermission).toHaveBeenCalled();
    });

    it('should throw error when permission request fails', async () => {
      (mockMessaging.requestPermission as jest.Mock).mockRejectedValue(
        new Error('Permission request failed')
      );

      await expect(FCMTokenService.initialize()).rejects.toThrow(
        'Failed to initialize FCM'
      );
    });
  });

  describe('generateAndStoreToken', () => {
    const mockUserId = 'test-user-123';
    const mockToken = 'mock-fcm-token-abc123';

    it('should generate token and store it in database', async () => {
      (mockMessaging.getToken as jest.Mock).mockResolvedValue(mockToken);
      (DeviceTokenManager.storeToken as jest.Mock).mockResolvedValue(undefined);

      const result = await FCMTokenService.generateAndStoreToken(mockUserId);

      expect(result).toBe(mockToken);
      expect(mockMessaging.getToken).toHaveBeenCalled();
      expect(DeviceTokenManager.storeToken).toHaveBeenCalledWith(
        mockUserId,
        mockToken,
        Platform.OS
      );
    });

    it('should throw error when token generation fails', async () => {
      (mockMessaging.getToken as jest.Mock).mockResolvedValue(null);

      await expect(
        FCMTokenService.generateAndStoreToken(mockUserId)
      ).rejects.toThrow('Failed to generate and store FCM token');
    });

    it('should throw error when token storage fails', async () => {
      (mockMessaging.getToken as jest.Mock).mockResolvedValue(mockToken);
      (DeviceTokenManager.storeToken as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        FCMTokenService.generateAndStoreToken(mockUserId)
      ).rejects.toThrow('Failed to generate and store FCM token');
    });
  });

  describe('setupTokenRefreshListener', () => {
    const mockUserId = 'test-user-123';
    const mockToken = 'refreshed-token-xyz789';

    it('should set up token refresh listener', () => {
      const mockUnsubscribe = jest.fn();
      (mockMessaging.onTokenRefresh as jest.Mock).mockReturnValue(mockUnsubscribe);

      FCMTokenService.setupTokenRefreshListener(mockUserId);

      expect(mockMessaging.onTokenRefresh).toHaveBeenCalled();
    });

    it('should remove existing listener before setting up new one', () => {
      const mockUnsubscribe1 = jest.fn();
      const mockUnsubscribe2 = jest.fn();
      (mockMessaging.onTokenRefresh as jest.Mock)
        .mockReturnValueOnce(mockUnsubscribe1)
        .mockReturnValueOnce(mockUnsubscribe2);

      FCMTokenService.setupTokenRefreshListener(mockUserId);
      FCMTokenService.setupTokenRefreshListener(mockUserId);

      expect(mockUnsubscribe1).toHaveBeenCalled();
    });

    it('should store refreshed token when callback is triggered', async () => {
      let refreshCallback: ((token: string) => void) | null = null;
      (mockMessaging.onTokenRefresh as jest.Mock).mockImplementation((callback) => {
        refreshCallback = callback;
        return jest.fn();
      });
      (DeviceTokenManager.storeToken as jest.Mock).mockResolvedValue(undefined);

      FCMTokenService.setupTokenRefreshListener(mockUserId);

      // Trigger the refresh callback
      if (refreshCallback) {
        await refreshCallback(mockToken);
      }

      expect(DeviceTokenManager.storeToken).toHaveBeenCalledWith(
        mockUserId,
        mockToken,
        Platform.OS
      );
    });
  });

  describe('removeTokenRefreshListener', () => {
    it('should remove token refresh listener', () => {
      const mockUnsubscribe = jest.fn();
      (mockMessaging.onTokenRefresh as jest.Mock).mockReturnValue(mockUnsubscribe);

      FCMTokenService.setupTokenRefreshListener('test-user');
      FCMTokenService.removeTokenRefreshListener();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should handle removing listener when none exists', () => {
      expect(() => {
        FCMTokenService.removeTokenRefreshListener();
      }).not.toThrow();
    });
  });

  describe('getCurrentToken', () => {
    it('should return current FCM token', async () => {
      const mockToken = 'current-token-123';
      (mockMessaging.getToken as jest.Mock).mockResolvedValue(mockToken);

      const result = await FCMTokenService.getCurrentToken();

      expect(result).toBe(mockToken);
      expect(mockMessaging.getToken).toHaveBeenCalled();
    });

    it('should return null when token retrieval fails', async () => {
      (mockMessaging.getToken as jest.Mock).mockRejectedValue(
        new Error('Token retrieval failed')
      );

      const result = await FCMTokenService.getCurrentToken();

      expect(result).toBeNull();
    });
  });

  describe('deleteToken', () => {
    it('should delete FCM token', async () => {
      (mockMessaging.deleteToken as jest.Mock).mockResolvedValue(undefined);

      await expect(FCMTokenService.deleteToken()).resolves.not.toThrow();
      expect(mockMessaging.deleteToken).toHaveBeenCalled();
    });

    it('should throw error when token deletion fails', async () => {
      (mockMessaging.deleteToken as jest.Mock).mockRejectedValue(
        new Error('Deletion failed')
      );

      await expect(FCMTokenService.deleteToken()).rejects.toThrow(
        'Failed to delete FCM token'
      );
    });
  });

  describe('updateTokenLastUsed', () => {
    it('should update last used timestamp', async () => {
      const mockToken = 'test-token-123';
      (DeviceTokenManager.updateLastUsed as jest.Mock).mockResolvedValue(undefined);

      await expect(
        FCMTokenService.updateTokenLastUsed(mockToken)
      ).resolves.not.toThrow();
      expect(DeviceTokenManager.updateLastUsed).toHaveBeenCalledWith(mockToken);
    });

    it('should not throw when update fails', async () => {
      const mockToken = 'test-token-123';
      (DeviceTokenManager.updateLastUsed as jest.Mock).mockRejectedValue(
        new Error('Update failed')
      );

      await expect(
        FCMTokenService.updateTokenLastUsed(mockToken)
      ).resolves.not.toThrow();
    });
  });
});
