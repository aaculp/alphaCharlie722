/**
 * Tests for Flash Offer Creation Flow
 * Feature: flash-offers-mvp
 * 
 * Tests cover:
 * - Creating offers with various parameters
 * - Validation errors
 * - Offer status management
 * - Offer listing and retrieval
 */

import * as fc from 'fast-check';
import { FlashOfferService, CreateFlashOfferInput, FlashOfferStatus } from '../flashOffers';
import { supabase } from '../../../lib/supabase';

// Mock Supabase
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn()
  }
}));

// Mock NetworkErrorHandler
jest.mock('../../../utils/errors/NetworkErrorHandler', () => ({
  NetworkErrorHandler: {
    withRetry: jest.fn((fn) => fn()),
    isNetworkError: jest.fn(() => false)
  }
}));

// Mock FlashOfferCache
jest.mock('../../../utils/cache/FlashOfferCache', () => ({
  FlashOfferCache: {
    cacheActiveOffers: jest.fn(),
    updateLastSync: jest.fn(),
    getCachedActiveOffers: jest.fn(),
    getCachedOfferDetails: jest.fn().mockResolvedValue(null),
    cacheOfferDetails: jest.fn().mockResolvedValue(undefined)
  }
}));

describe('FlashOfferService - Offer Creation Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createFlashOffer', () => {
    it('should create an offer with valid parameters', async () => {
      const venueId = 'venue-123';
      const offerData: CreateFlashOfferInput = {
        title: 'Happy Hour Special',
        description: 'Get 50% off all drinks from 5-7pm',
        value_cap: '$20 off',
        max_claims: 50,
        start_time: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        end_time: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
        radius_miles: 2,
        target_favorites_only: false
      };

      const mockOffer = {
        id: 'offer-123',
        venue_id: venueId,
        ...offerData,
        claimed_count: 0,
        status: 'scheduled' as FlashOfferStatus,
        push_sent: false,
        push_sent_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockOffer,
          error: null
        })
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await FlashOfferService.createFlashOffer(venueId, offerData);

      expect(result).toEqual(mockOffer);
      expect(supabase.from).toHaveBeenCalledWith('flash_offers');
      expect(mockQuery.insert).toHaveBeenCalled();
    });

    it('should set status to active if start_time is now or in the past', async () => {
      const venueId = 'venue-123';
      const offerData: CreateFlashOfferInput = {
        title: 'Flash Sale',
        description: 'Limited time offer',
        max_claims: 10,
        start_time: new Date(Date.now() - 1000).toISOString(), // 1 second ago
        end_time: new Date(Date.now() + 3600000).toISOString()
      };

      const mockOffer = {
        id: 'offer-123',
        venue_id: venueId,
        title: offerData.title,
        description: offerData.description,
        value_cap: null,
        max_claims: offerData.max_claims,
        claimed_count: 0,
        start_time: offerData.start_time,
        end_time: offerData.end_time,
        radius_miles: 1.0,
        target_favorites_only: false,
        status: 'active' as FlashOfferStatus,
        push_sent: false,
        push_sent_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockOffer,
          error: null
        })
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await FlashOfferService.createFlashOffer(venueId, offerData);

      expect(result.status).toBe('active');
    });

    it('should handle creation errors', async () => {
      const venueId = 'venue-123';
      const offerData: CreateFlashOfferInput = {
        title: 'Test Offer',
        description: 'Test description',
        max_claims: 10,
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 3600000).toISOString()
      };

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      await expect(
        FlashOfferService.createFlashOffer(venueId, offerData)
      ).rejects.toThrow('Failed to create flash offer');
    });
  });

  describe('getVenueOffers', () => {
    it('should fetch all offers for a venue', async () => {
      const venueId = 'venue-123';
      const mockOffers = [
        {
          id: 'offer-1',
          venue_id: venueId,
          title: 'Offer 1',
          description: 'Description 1',
          value_cap: null,
          max_claims: 10,
          claimed_count: 5,
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 3600000).toISOString(),
          radius_miles: 1,
          target_favorites_only: false,
          status: 'active' as FlashOfferStatus,
          push_sent: true,
          push_sent_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockOffers,
          error: null,
          count: 1
        })
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await FlashOfferService.getVenueOffers(venueId);

      expect(result.offers).toEqual(mockOffers);
      expect(mockQuery.eq).toHaveBeenCalledWith('venue_id', venueId);
    });

    it('should filter offers by status', async () => {
      const venueId = 'venue-123';
      const status: FlashOfferStatus = 'active';
      const mockOffers = [
        {
          id: 'offer-1',
          venue_id: venueId,
          status: 'active' as FlashOfferStatus,
          title: 'Active Offer',
          description: 'Description',
          value_cap: null,
          max_claims: 10,
          claimed_count: 5,
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 3600000).toISOString(),
          radius_miles: 1,
          target_favorites_only: false,
          push_sent: true,
          push_sent_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Create a mock query that supports chaining and awaiting
      const createMockQuery = () => {
        const mockQuery: any = {
          select: jest.fn(),
          eq: jest.fn(),
          order: jest.fn(),
          range: jest.fn(),
          then: (resolve: any) => resolve({ data: mockOffers, error: null, count: 1 })
        };
        mockQuery.select.mockReturnValue(mockQuery);
        mockQuery.eq.mockReturnValue(mockQuery);
        mockQuery.order.mockReturnValue(mockQuery);
        mockQuery.range.mockReturnValue(mockQuery);
        return mockQuery;
      };

      (supabase.from as jest.Mock).mockReturnValue(createMockQuery());

      const result = await FlashOfferService.getVenueOffers(venueId, status);

      expect(result.offers).toEqual(mockOffers);
      expect(supabase.from).toHaveBeenCalledWith('flash_offers');
    });
  });

  describe('updateOfferStatus', () => {
    it('should update offer status', async () => {
      const offerId = 'offer-123';
      const newStatus: FlashOfferStatus = 'cancelled';

      const mockOffer = {
        id: offerId,
        venue_id: 'venue-123',
        title: 'Test Offer',
        description: 'Description',
        value_cap: null,
        max_claims: 10,
        claimed_count: 5,
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 3600000).toISOString(),
        radius_miles: 1,
        target_favorites_only: false,
        status: newStatus,
        push_sent: true,
        push_sent_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockOffer,
          error: null
        })
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await FlashOfferService.updateOfferStatus(offerId, newStatus);

      expect(result).toEqual(mockOffer);
      expect(mockQuery.update).toHaveBeenCalledWith({ status: newStatus });
      expect(mockQuery.eq).toHaveBeenCalledWith('id', offerId);
    });
  });

  describe('getOfferDetails', () => {
    it('should fetch offer with statistics', async () => {
      const offerId = 'offer-123';
      const mockOffer = {
        id: offerId,
        venue_id: 'venue-123',
        title: 'Test Offer',
        description: 'Description',
        value_cap: '$10 off',
        max_claims: 10,
        claimed_count: 5,
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 3600000).toISOString(),
        radius_miles: 1,
        target_favorites_only: false,
        status: 'active' as FlashOfferStatus,
        push_sent: true,
        push_sent_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const mockEvents = [
        { event_type: 'view' },
        { event_type: 'view' },
        { event_type: 'claim' },
        { event_type: 'claim' },
        { event_type: 'redeem' }
      ];

      const mockOfferQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockOffer,
          error: null
        })
      };

      const mockEventsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mockEvents,
          error: null
        })
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockOfferQuery)
        .mockReturnValueOnce(mockEventsQuery);

      const result = await FlashOfferService.getOfferDetails(offerId);

      expect(result.id).toBe(offerId);
      expect(result.views_count).toBe(2);
      expect(result.claims_count).toBe(2);
      expect(result.redemptions_count).toBe(1);
    });
  });
});

/**
 * Property-Based Tests for Flash Offer Creation
 */
describe('FlashOfferService - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property: Offer creation with random valid parameters should succeed
   */
  it('should create offers with any valid parameters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // venueId
        fc.string({ minLength: 3, maxLength: 100 }), // title
        fc.string({ minLength: 10, maxLength: 500 }), // description
        fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }), // value_cap
        fc.integer({ min: 1, max: 1000 }), // max_claims
        fc.integer({ min: 0, max: 7200000 }), // start offset (0-2 hours)
        fc.integer({ min: 3600000, max: 86400000 }), // duration (1-24 hours)
        fc.double({ min: 0.1, max: 50 }), // radius_miles
        fc.boolean(), // target_favorites_only
        async (venueId, title, description, valueCap, maxClaims, startOffset, duration, radius, targetFavorites) => {
          const startTime = new Date(Date.now() + startOffset).toISOString();
          const endTime = new Date(Date.now() + startOffset + duration).toISOString();

          const offerData: CreateFlashOfferInput = {
            title,
            description,
            value_cap: valueCap,
            max_claims: maxClaims,
            start_time: startTime,
            end_time: endTime,
            radius_miles: radius,
            target_favorites_only: targetFavorites
          };

          const mockOffer = {
            id: fc.sample(fc.uuid(), 1)[0],
            venue_id: venueId,
            ...offerData,
            claimed_count: 0,
            status: (startOffset === 0 ? 'active' : 'scheduled') as FlashOfferStatus,
            push_sent: false,
            push_sent_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const mockQuery = {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockOffer,
              error: null
            })
          };

          (supabase.from as jest.Mock).mockReturnValue(mockQuery);

          const result = await FlashOfferService.createFlashOffer(venueId, offerData);

          expect(result.venue_id).toBe(venueId);
          expect(result.title).toBe(title);
          expect(result.max_claims).toBe(maxClaims);
          expect(result.claimed_count).toBe(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Status should be 'active' if start_time <= now, 'scheduled' otherwise
   */
  it('should set correct initial status based on start_time', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: -3600000, max: 3600000 }), // start offset (-1 to +1 hour)
        async (venueId, startOffset) => {
          const startTime = new Date(Date.now() + startOffset).toISOString();
          const endTime = new Date(Date.now() + startOffset + 7200000).toISOString();

          const offerData: CreateFlashOfferInput = {
            title: 'Test Offer',
            description: 'Test description',
            max_claims: 10,
            start_time: startTime,
            end_time: endTime
          };

          const expectedStatus = startOffset <= 0 ? 'active' : 'scheduled';

          const mockOffer = {
            id: fc.sample(fc.uuid(), 1)[0],
            venue_id: venueId,
            title: offerData.title,
            description: offerData.description,
            value_cap: null,
            max_claims: offerData.max_claims,
            claimed_count: 0,
            start_time: startTime,
            end_time: endTime,
            radius_miles: 1.0,
            target_favorites_only: false,
            status: expectedStatus as FlashOfferStatus,
            push_sent: false,
            push_sent_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const mockQuery = {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockOffer,
              error: null
            })
          };

          (supabase.from as jest.Mock).mockReturnValue(mockQuery);

          const result = await FlashOfferService.createFlashOffer(venueId, offerData);

          expect(result.status).toBe(expectedStatus);
        }
      ),
      { numRuns: 50 }
    );
  });
});
