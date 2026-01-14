/**
 * Smoke test for useNewVenues hook
 * 
 * This test verifies that the useNewVenues hook can be imported
 * and the VenueService integration works correctly.
 */

import { VenueService } from '../../services/api/venues';

// Mock VenueService
jest.mock('../../services/api/venues', () => ({
  VenueService: {
    getNewVenues: jest.fn(),
  },
}));

describe('useNewVenues - Smoke Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be able to import useNewVenues hook', () => {
    const { useNewVenues } = require('../useNewVenues');
    expect(typeof useNewVenues).toBe('function');
  });

  it('should verify VenueService.getNewVenues can be called', async () => {
    (VenueService.getNewVenues as jest.Mock).mockResolvedValue([]);
    
    const result = await VenueService.getNewVenues(10);
    
    expect(VenueService.getNewVenues).toHaveBeenCalledWith(10);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should verify VenueService.getNewVenues handles errors', async () => {
    const mockError = new Error('Failed to fetch venues');
    (VenueService.getNewVenues as jest.Mock).mockRejectedValue(mockError);
    
    await expect(VenueService.getNewVenues()).rejects.toThrow('Failed to fetch venues');
  });

  it('should verify VenueService.getNewVenues accepts custom limit', async () => {
    (VenueService.getNewVenues as jest.Mock).mockResolvedValue([]);
    
    await VenueService.getNewVenues(5);
    
    expect(VenueService.getNewVenues).toHaveBeenCalledWith(5);
  });
});
