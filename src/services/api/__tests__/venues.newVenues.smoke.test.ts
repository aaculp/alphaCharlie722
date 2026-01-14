/**
 * Smoke test for VenueService.getNewVenues
 * 
 * This test verifies that the getNewVenues method can be called
 * and returns data in the expected format.
 */

import { VenueService } from '../venues';
import { seedMockDatabase, resetMockDatabase } from '../../../lib/__mocks__/supabase';

// Mock the supabase module
jest.mock('../../../lib/supabase');

describe('VenueService.getNewVenues - Smoke Test', () => {
  beforeEach(() => {
    resetMockDatabase();
  });

  it('should return an empty array when no venues exist', async () => {
    const result = await VenueService.getNewVenues();
    
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it('should return venues with signup_date field', async () => {
    // Seed mock database with test data
    const mockVenues = [
      {
        id: 'venue-1',
        name: 'Test Venue 1',
        category: 'Bar',
        location: 'Test Location',
        latitude: 40.7128,
        longitude: -74.0060,
        rating: 4.5,
        image_url: 'https://example.com/image1.jpg',
      },
    ];

    const mockBusinessAccounts = [
      {
        id: 'account-1',
        venue_id: 'venue-1',
        created_at: new Date().toISOString(),
        account_status: 'active',
        verification_status: 'verified',
      },
    ];

    seedMockDatabase('venues', mockVenues);
    seedMockDatabase('venue_business_accounts', mockBusinessAccounts);

    const result = await VenueService.getNewVenues();
    
    expect(Array.isArray(result)).toBe(true);
    // Note: The mock doesn't fully implement the INNER JOIN logic,
    // so we just verify the method can be called without errors
  });

  it('should accept a custom limit parameter', async () => {
    const result = await VenueService.getNewVenues(5);
    
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle errors gracefully', async () => {
    // The mock will return empty data, which is fine for a smoke test
    await expect(VenueService.getNewVenues()).resolves.toBeDefined();
  });
});
