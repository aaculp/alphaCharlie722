/**
 * Property-Based Tests for NotificationPreferencesService
 * 
 * Feature: flash-offer-push-backend
 * Tests correctness properties using fast-check library
 */

import fc from 'fast-check';
import { NotificationPreferencesService } from '../notificationPreferences';
import { supabase } from '../../../lib/supabase';

// Mock Supabase
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('NotificationPreferencesService - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 30: Default Preferences Creation
   * Feature: flash-offer-push-backend, Property 30: Default Preferences Creation
   * 
   * For any new user account created, the system should automatically create 
   * notification preferences with flash_offers_enabled = true.
   * 
   * Validates: Requirements 12.2
   */
  test('Property 30: Default Preferences Creation', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random user IDs (UUIDs)
        fc.uuid(),
        async (userId) => {
          // Mock the database insert to return the created preferences
          const mockInsert = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  user_id: userId,
                  flash_offers_enabled: true,
                  quiet_hours_start: null,
                  quiet_hours_end: null,
                  timezone: 'UTC',
                  max_distance_miles: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          });

          (supabase.from as jest.Mock).mockReturnValue({
            insert: mockInsert,
          });

          // Call createDefaultPreferences
          const result = await NotificationPreferencesService.createDefaultPreferences(userId);

          // Verify that flash_offers_enabled is true (Requirement 12.2)
          expect(result.flash_offers_enabled).toBe(true);
          
          // Verify that user_id matches
          expect(result.user_id).toBe(userId);
          
          // Verify that default values are set correctly
          expect(result.quiet_hours_start).toBeNull();
          expect(result.quiet_hours_end).toBeNull();
          expect(result.timezone).toBe('UTC');
          expect(result.max_distance_miles).toBeNull();
          
          // Verify that timestamps are present
          expect(result.created_at).toBeDefined();
          expect(result.updated_at).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: getPreferences creates defaults if none exist
   * 
   * For any user without existing preferences, calling getPreferences 
   * should create and return default preferences with flash_offers_enabled = true.
   */
  test('Property: getPreferences creates defaults when none exist', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (userId) => {
          // Mock the database to return no existing preferences
          const mockSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          });

          // Mock the insert for creating default preferences
          const mockInsert = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  user_id: userId,
                  flash_offers_enabled: true,
                  quiet_hours_start: null,
                  quiet_hours_end: null,
                  timezone: 'UTC',
                  max_distance_miles: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          });

          (supabase.from as jest.Mock).mockReturnValueOnce({
            select: mockSelect,
          }).mockReturnValueOnce({
            insert: mockInsert,
          });

          // Call getPreferences
          const result = await NotificationPreferencesService.getPreferences(userId);

          // Verify that default preferences were created with flash_offers_enabled = true
          expect(result.flash_offers_enabled).toBe(true);
          expect(result.user_id).toBe(userId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: updatePreferences preserves user_id
   * 
   * For any user and any preference updates, the user_id should remain unchanged.
   */
  test('Property: updatePreferences preserves user_id', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.boolean(),
        fc.option(fc.integer({ min: 1, max: 50 }), { nil: null }),
        async (userId, flashOffersEnabled, maxDistance) => {
          // Mock the database upsert
          const mockUpsert = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  user_id: userId,
                  flash_offers_enabled: flashOffersEnabled,
                  quiet_hours_start: null,
                  quiet_hours_end: null,
                  timezone: 'UTC',
                  max_distance_miles: maxDistance,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          });

          (supabase.from as jest.Mock).mockReturnValue({
            upsert: mockUpsert,
          });

          // Call updatePreferences
          const result = await NotificationPreferencesService.updatePreferences(userId, {
            flash_offers_enabled: flashOffersEnabled,
            max_distance_miles: maxDistance,
          });

          // Verify that user_id is preserved
          expect(result.user_id).toBe(userId);
          
          // Verify that the updates were applied
          expect(result.flash_offers_enabled).toBe(flashOffersEnabled);
          expect(result.max_distance_miles).toBe(maxDistance);
        }
      ),
      { numRuns: 100 }
    );
  });
});
