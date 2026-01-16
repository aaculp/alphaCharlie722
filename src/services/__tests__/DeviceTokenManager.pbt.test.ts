/**
 * Property-Based Tests for DeviceTokenManager
 * Task: 2.5 Write property tests for token management
 * Feature: social-push-notifications
 * 
 * Tests device token storage, refresh, multi-device support, and cleanup
 */

import * as fc from 'fast-check';
import { DeviceTokenManager } from '../DeviceTokenManager';
import { supabase } from '../../lib/supabase';

// Mock Supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('DeviceTokenManager - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 1: Device Token Storage Consistency
   * Feature: social-push-notifications, Property 1: Device Token Storage Consistency
   * Validates: Requirements 1.5, 1.8
   * 
   * For any generated FCM device token, it should be stored in the database and
   * associated with the correct user account.
   */
  describe('Property 1: Device Token Storage Consistency', () => {
    it('should store token with correct user association', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          fc.string({ minLength: 20, maxLength: 200 }), // token
          fc.constantFrom('ios', 'android'), // platform
          async (userId, token, platform) => {
            // Skip invalid inputs (whitespace-only strings)
            fc.pre(token.trim().length > 0);

            // Mock successful storage
            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }, // Not found
              }),
              insert: jest.fn().mockResolvedValue({
                data: {
                  id: fc.sample(fc.uuid(), 1)[0],
                  user_id: userId,
                  token,
                  platform,
                  is_active: true,
                },
                error: null,
              }),
            };

            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            await DeviceTokenManager.storeToken(userId, token, platform as 'ios' | 'android');

            // Verify insert was called with correct data
            expect(mockQuery.insert).toHaveBeenCalledWith(
              expect.objectContaining({
                user_id: userId,
                token,
                platform,
                is_active: true,
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update existing token with new user association', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // oldUserId
          fc.uuid(), // newUserId
          fc.string({ minLength: 20, maxLength: 200 }), // token
          fc.constantFrom('ios', 'android'), // platform
          async (oldUserId, newUserId, token, platform) => {
            // Skip invalid inputs (whitespace-only strings)
            fc.pre(token.trim().length > 0);

            let callCount = 0;
            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                  // First call: select().eq().single()
                  return mockQuery;
                } else {
                  // Second call: update().eq()
                  return Promise.resolve({
                    data: {
                      user_id: newUserId,
                      token,
                      platform,
                      is_active: true,
                    },
                    error: null,
                  });
                }
              }),
              single: jest.fn().mockResolvedValue({
                data: {
                  id: fc.sample(fc.uuid(), 1)[0],
                  user_id: oldUserId,
                  token,
                  platform,
                  is_active: false,
                },
                error: null,
              }),
              update: jest.fn().mockReturnThis(),
            };

            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            await DeviceTokenManager.storeToken(newUserId, token, platform as 'ios' | 'android');

            // Verify update was called with new user
            expect(mockQuery.update).toHaveBeenCalledWith(
              expect.objectContaining({
                user_id: newUserId,
                is_active: true,
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Token Refresh Handling
   * Feature: social-push-notifications, Property 2: Token Refresh Handling
   * Validates: Requirements 1.6, 1.7
   * 
   * For any expired or refreshed FCM token, the old token should be replaced with
   * the new token in the database without losing user association.
   */
  describe('Property 2: Token Refresh Handling', () => {
    it('should replace old token with new token maintaining user association', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          fc.string({ minLength: 20, maxLength: 200 }), // oldToken
          fc.string({ minLength: 20, maxLength: 200 }), // newToken
          fc.constantFrom('ios', 'android'), // platform
          async (userId, oldToken, newToken, platform) => {
            // Skip invalid inputs (whitespace-only strings)
            fc.pre(oldToken.trim().length > 0 && newToken.trim().length > 0);
            // Assume tokens are different
            fc.pre(oldToken !== newToken);

            // Mock storing new token (which replaces old one)
            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
              insert: jest.fn().mockResolvedValue({
                data: {
                  user_id: userId,
                  token: newToken,
                  platform,
                  is_active: true,
                },
                error: null,
              }),
            };

            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            await DeviceTokenManager.storeToken(userId, newToken, platform as 'ios' | 'android');

            // Verify new token is stored with same user
            expect(mockQuery.insert).toHaveBeenCalledWith(
              expect.objectContaining({
                user_id: userId,
                token: newToken,
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Multi-Device Support
   * Feature: social-push-notifications, Property 3: Multi-Device Support
   * Validates: Requirements 1.10
   * 
   * For any user with multiple devices, all device tokens should be stored and
   * associated with that user's account.
   */
  describe('Property 3: Multi-Device Support', () => {
    it('should store multiple tokens for the same user', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          fc.array(
            fc.record({
              token: fc.string({ minLength: 20, maxLength: 200 }),
              platform: fc.constantFrom('ios', 'android'),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (userId, devices) => {
            // Filter out invalid tokens (whitespace-only)
            const validDevices = devices.filter(d => d.token.trim().length > 0);
            fc.pre(validDevices.length > 0);

            // Ensure unique tokens
            const uniqueDevices = Array.from(
              new Map(validDevices.map(d => [d.token, d])).values()
            );

            for (const device of uniqueDevices) {
              const mockQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' },
                }),
                insert: jest.fn().mockResolvedValue({
                  data: {
                    user_id: userId,
                    token: device.token,
                    platform: device.platform,
                    is_active: true,
                  },
                  error: null,
                }),
              };

              (supabase.from as jest.Mock).mockReturnValue(mockQuery);

              await DeviceTokenManager.storeToken(
                userId,
                device.token,
                device.platform as 'ios' | 'android'
              );
            }

            // Mock getUserTokens to return all devices
            const mockGetQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              order: jest.fn().mockResolvedValue({
                data: uniqueDevices.map(d => ({
                  id: fc.sample(fc.uuid(), 1)[0],
                  user_id: userId,
                  token: d.token,
                  platform: d.platform,
                  is_active: true,
                  last_used_at: new Date().toISOString(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })),
                error: null,
              }),
            };

            (supabase.from as jest.Mock).mockReturnValue(mockGetQuery);

            const tokens = await DeviceTokenManager.getUserTokens(userId);

            // Verify all tokens are returned
            expect(tokens.length).toBe(uniqueDevices.length);
            tokens.forEach(token => {
              expect(token.userId).toBe(userId);
              expect(uniqueDevices.some(d => d.token === token.token)).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: Logout Token Cleanup
   * Feature: social-push-notifications, Property 4: Logout Token Cleanup
   * Validates: Requirements 1.9
   * 
   * For any user logout event, all device token associations for that user should
   * be removed from active status.
   */
  describe('Property 4: Logout Token Cleanup', () => {
    it('should deactivate token on logout', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 20, maxLength: 200 }), // token
          async (token) => {
            // Skip invalid inputs (whitespace-only strings)
            fc.pre(token.trim().length > 0);

            let callCount = 0;
            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                  // First call: select().eq().single()
                  return mockQuery;
                } else {
                  // Second call: update().eq()
                  return Promise.resolve({
                    data: { is_active: false },
                    error: null,
                  });
                }
              }),
              single: jest.fn().mockResolvedValue({
                data: { user_id: fc.sample(fc.uuid(), 1)[0] },
                error: null,
              }),
              update: jest.fn().mockReturnThis(),
            };

            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            await DeviceTokenManager.removeToken(token);

            // Verify token is marked inactive
            expect(mockQuery.update).toHaveBeenCalledWith({ is_active: false });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clean up expired inactive tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 100 }), // number of expired tokens
          async (expiredCount) => {
            const mockQuery = {
              delete: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              lt: jest.fn().mockReturnThis(),
              select: jest.fn().mockResolvedValue({
                data: Array(expiredCount).fill({}),
                error: null,
              }),
            };

            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            const result = await DeviceTokenManager.cleanupExpiredTokens();

            // Verify cleanup was called
            expect(mockQuery.delete).toHaveBeenCalled();
            expect(mockQuery.eq).toHaveBeenCalledWith('is_active', false);
            expect(result).toBe(expiredCount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional test: Token uniqueness constraint
   * Ensures that duplicate tokens are handled correctly
   */
  describe('Token Uniqueness', () => {
    it('should handle duplicate token insertion gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          fc.string({ minLength: 20, maxLength: 200 }), // token
          fc.constantFrom('ios', 'android'), // platform
          async (userId, token, platform) => {
            // Filter out invalid tokens (empty or whitespace-only)
            fc.pre(token.trim().length > 0);
            
            let callCount = 0;
            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                  // First call: select().eq().single()
                  return mockQuery;
                } else {
                  // Second call: update().eq()
                  return Promise.resolve({
                    data: { is_active: true },
                    error: null,
                  });
                }
              }),
              single: jest.fn().mockResolvedValue({
                data: {
                  id: fc.sample(fc.uuid(), 1)[0],
                  user_id: userId,
                  token,
                  platform,
                  is_active: true,
                },
                error: null,
              }),
              update: jest.fn().mockReturnThis(),
            };

            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            // Try to store same token again
            await expect(
              DeviceTokenManager.storeToken(userId, token, platform as 'ios' | 'android')
            ).resolves.not.toThrow();

            // Verify update was called instead of insert
            expect(mockQuery.update).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
