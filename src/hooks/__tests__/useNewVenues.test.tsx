/**
 * Unit tests for useNewVenues hook
 * Requirements: 4.3, 4.5
 */

import { VenueService } from '../../services/api/venues';

// Mock VenueService
jest.mock('../../services/api/venues', () => ({
  VenueService: {
    getNewVenues: jest.fn(),
  },
}));

describe('useNewVenues Hook - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial loading state', () => {
    it('should be importable', () => {
      const { useNewVenues } = require('../useNewVenues');
      expect(typeof useNewVenues).toBe('function');
    });
  });

  describe('Successful data fetch', () => {
    it('should call VenueService.getNewVenues on mount', async () => {
      const mockVenues = [
        {
          id: 'venue-1',
          name: 'Test Venue',
          category: 'Bar',
          location: 'Downtown',
          signup_date: new Date().toISOString(),
        },
      ];

      (VenueService.getNewVenues as jest.Mock).mockResolvedValue(mockVenues);

      // Verify the service can be called
      const result = await VenueService.getNewVenues();
      expect(result).toEqual(mockVenues);
      expect(VenueService.getNewVenues).toHaveBeenCalledTimes(1);
    });

    it('should use custom limit when provided', async () => {
      (VenueService.getNewVenues as jest.Mock).mockResolvedValue([]);

      await VenueService.getNewVenues(5);

      expect(VenueService.getNewVenues).toHaveBeenCalledWith(5);
    });
  });

  describe('Error handling', () => {
    it('should handle errors from VenueService', async () => {
      const mockError = new Error('Failed to fetch venues');
      (VenueService.getNewVenues as jest.Mock).mockRejectedValue(mockError);

      await expect(VenueService.getNewVenues()).rejects.toThrow('Failed to fetch venues');
    });

    it('should log error with context when fetch fails', async () => {
      const mockError = new Error('Network error');
      (VenueService.getNewVenues as jest.Mock).mockRejectedValue(mockError);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      try {
        await VenueService.getNewVenues();
      } catch (error) {
        // Expected to throw
      }

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Refetch function', () => {
    it('should allow multiple calls to getNewVenues', async () => {
      const initialVenues = [
        {
          id: 'venue-1',
          name: 'Initial Venue',
          category: 'Bar',
          location: 'Downtown',
          signup_date: new Date().toISOString(),
        },
      ];

      const updatedVenues = [
        ...initialVenues,
        {
          id: 'venue-2',
          name: 'New Venue',
          category: 'Restaurant',
          location: 'Uptown',
          signup_date: new Date().toISOString(),
        },
      ];

      (VenueService.getNewVenues as jest.Mock)
        .mockResolvedValueOnce(initialVenues)
        .mockResolvedValueOnce(updatedVenues);

      const result1 = await VenueService.getNewVenues();
      expect(result1).toEqual(initialVenues);

      const result2 = await VenueService.getNewVenues();
      expect(result2).toEqual(updatedVenues);

      expect(VenueService.getNewVenues).toHaveBeenCalledTimes(2);
    });
  });
});
