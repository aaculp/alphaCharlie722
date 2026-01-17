/**
 * Tests for Flash Offer Claim Flow
 * Feature: flash-offers-mvp
 * Task: 16.2 Test claim flow
 * 
 * Tests cover:
 * - Claiming offers while checked in
 * - Token generation
 * - Duplicate claim prevention
 * - Claim limit enforcement
 * - Expiration handling
 */

import { ClaimService } from '../flashOfferClaims';
import { supabase } from '../../../lib/supabase';
import { generateFlashOfferToken } from '../../../utils/tokenGenerator';
import { FlashOfferAnalyticsService } from '../flashOfferAnalytics';

// Mock Supabase
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn()
  }
}));

// Mock token generator
jest.mock('../../../utils/tokenGenerator', () => ({
  generateFlashOfferToken: jest.fn()
}));

// Mock FlashOfferAnalyticsService
jest.mock('../flashOfferAnalytics', () => ({
  FlashOfferAnalyticsService: {
    trackClaim: jest.fn(),
    trackRedeem: jest.fn()
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
    cacheUserClaims: jest.fn(),
    getCachedUserClaims: jest.fn()
  }
}));

describe('ClaimService - Claim Flow (Task 16.2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (generateFlashOfferToken as jest.Mock).mockResolvedValue('123456');
  });

  describe('Claim offer while checked in', () => {
    it('should successfully claim an offer when user is checked in', async () => {
      const offerId = 'offer-123';
      const userId = 'user-123';
      const venueId = 'venue-123';

      // Mock validation - user is eligible
      const mockOffer = {
        id: offerId,
        venue_id: venueId,
        status: 'active',
        end_time: new Date(Date.now() + 3600000).toISOString(),
        claimed_count: 5,
        max_claims: 10,
        venues: { id: venueId }
      };

      const mockCheckIn = {
        id: 'checkin-123',
        user_id: userId,
        venue_id: venueId,
        is_active: true
      };

      const mockClaim = {
        id: 'claim-123',
        offer_id: offerId,
        user_id: userId,
        token: '123456',
        status: 'active',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        redeemed_at: null,
        redeemed_by_user_id: null
      };

      // Mock the validation query chain
      const mockOfferQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockOffer, error: null })
      };

      const mockExistingClaimQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      };

      const mockCheckInQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCheckIn, error: null })
      };

      // Mock the atomic claim RPC
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: [mockClaim],
        error: null
      });

      // Setup from() to return different mocks based on table
      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'flash_offers') {
          return mockOfferQuery;
        } else if (table === 'flash_offer_claims') {
          callCount++;
          if (callCount === 1) {
            return mockExistingClaimQuery; // First call checks for existing claim
          }
        } else if (table === 'check_ins') {
          return mockCheckInQuery;
        }
        return mockOfferQuery;
      });

      const result = await ClaimService.claimOffer(offerId, userId);

      expect(result).toEqual(mockClaim);
      expect(result.token).toBe('123456');
      expect(result.status).toBe('active');
      expect(FlashOfferAnalyticsService.trackClaim).toHaveBeenCalledWith(
        offerId,
        userId,
        mockClaim.id
      );
    });

    it('should reject claim when user is not checked in', async () => {
      const offerId = 'offer-123';
      const userId = 'user-123';
      const venueId = 'venue-123';

      const mockOffer = {
        id: offerId,
        venue_id: venueId,
        status: 'active',
        end_time: new Date(Date.now() + 3600000).toISOString(),
        claimed_count: 5,
        max_claims: 10,
        venues: { id: venueId }
      };

      const mockOfferQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockOffer, error: null })
      };

      const mockExistingClaimQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      };

      const mockCheckInQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      };

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'flash_offers') {
          return mockOfferQuery;
        } else if (table === 'flash_offer_claims') {
          callCount++;
          if (callCount === 1) {
            return mockExistingClaimQuery;
          }
        } else if (table === 'check_ins') {
          return mockCheckInQuery;
        }
        return mockOfferQuery;
      });

      await expect(ClaimService.claimOffer(offerId, userId)).rejects.toThrow(
        'You must be checked in to this venue to claim this offer'
      );
    });
  });

  describe('Token generation', () => {
    it('should generate a valid 6-digit token', async () => {
      const offerId = 'offer-123';
      const userId = 'user-123';
      const venueId = 'venue-123';

      const mockOffer = {
        id: offerId,
        venue_id: venueId,
        status: 'active',
        end_time: new Date(Date.now() + 3600000).toISOString(),
        claimed_count: 5,
        max_claims: 10,
        venues: { id: venueId }
      };

      const mockCheckIn = {
        id: 'checkin-123',
        user_id: userId,
        venue_id: venueId,
        is_active: true
      };

      const mockClaim = {
        id: 'claim-123',
        offer_id: offerId,
        user_id: userId,
        token: '004219',
        status: 'active',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        redeemed_at: null,
        redeemed_by_user_id: null
      };

      (generateFlashOfferToken as jest.Mock).mockResolvedValue('004219');

      const mockOfferQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockOffer, error: null })
      };

      const mockExistingClaimQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      };

      const mockCheckInQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCheckIn, error: null })
      };

      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: [mockClaim],
        error: null
      });

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'flash_offers') {
          return mockOfferQuery;
        } else if (table === 'flash_offer_claims') {
          callCount++;
          if (callCount === 1) {
            return mockExistingClaimQuery;
          }
        } else if (table === 'check_ins') {
          return mockCheckInQuery;
        }
        return mockOfferQuery;
      });

      const result = await ClaimService.claimOffer(offerId, userId);

      expect(generateFlashOfferToken).toHaveBeenCalledWith(offerId);
      expect(result.token).toBe('004219');
      expect(result.token).toMatch(/^\d{6}$/);
    });
  });

  describe('Duplicate claim prevention', () => {
    it('should prevent user from claiming the same offer twice', async () => {
      const offerId = 'offer-123';
      const userId = 'user-123';
      const venueId = 'venue-123';

      const mockOffer = {
        id: offerId,
        venue_id: venueId,
        status: 'active',
        end_time: new Date(Date.now() + 3600000).toISOString(),
        claimed_count: 5,
        max_claims: 10,
        venues: { id: venueId }
      };

      const mockExistingClaim = {
        id: 'existing-claim-123'
      };

      const mockOfferQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockOffer, error: null })
      };

      const mockExistingClaimQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockExistingClaim, error: null })
      };

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'flash_offers') {
          return mockOfferQuery;
        } else if (table === 'flash_offer_claims') {
          callCount++;
          if (callCount === 1) {
            return mockExistingClaimQuery;
          }
        }
        return mockOfferQuery;
      });

      await expect(ClaimService.claimOffer(offerId, userId)).rejects.toThrow(
        'You have already claimed this offer'
      );
    });

    it('should handle duplicate claim error from database', async () => {
      const offerId = 'offer-123';
      const userId = 'user-123';
      const venueId = 'venue-123';

      const mockOffer = {
        id: offerId,
        venue_id: venueId,
        status: 'active',
        end_time: new Date(Date.now() + 3600000).toISOString(),
        claimed_count: 5,
        max_claims: 10,
        venues: { id: venueId }
      };

      const mockCheckIn = {
        id: 'checkin-123',
        user_id: userId,
        venue_id: venueId,
        is_active: true
      };

      const mockOfferQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockOffer, error: null })
      };

      const mockExistingClaimQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      };

      const mockCheckInQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCheckIn, error: null })
      };

      // Mock RPC to return duplicate claim error
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'User has already claimed this offer' }
      });

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'flash_offers') {
          return mockOfferQuery;
        } else if (table === 'flash_offer_claims') {
          callCount++;
          if (callCount === 1) {
            return mockExistingClaimQuery;
          }
        } else if (table === 'check_ins') {
          return mockCheckInQuery;
        }
        return mockOfferQuery;
      });

      await expect(ClaimService.claimOffer(offerId, userId)).rejects.toThrow(
        'You have already claimed this offer'
      );
    });
  });

  describe('Claim limit enforcement', () => {
    it('should prevent claiming when offer is full', async () => {
      const offerId = 'offer-123';
      const userId = 'user-123';
      const venueId = 'venue-123';

      const mockOffer = {
        id: offerId,
        venue_id: venueId,
        status: 'active',
        end_time: new Date(Date.now() + 3600000).toISOString(),
        claimed_count: 10,
        max_claims: 10,
        venues: { id: venueId }
      };

      const mockOfferQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockOffer, error: null })
      };

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'flash_offers') {
          return mockOfferQuery;
        }
        return mockOfferQuery;
      });

      await expect(ClaimService.claimOffer(offerId, userId)).rejects.toThrow(
        'This offer has reached its maximum claims'
      );
    });

    it('should handle race condition when offer fills up during claim', async () => {
      const offerId = 'offer-123';
      const userId = 'user-123';
      const venueId = 'venue-123';

      const mockOffer = {
        id: offerId,
        venue_id: venueId,
        status: 'active',
        end_time: new Date(Date.now() + 3600000).toISOString(),
        claimed_count: 9,
        max_claims: 10,
        venues: { id: venueId }
      };

      const mockCheckIn = {
        id: 'checkin-123',
        user_id: userId,
        venue_id: venueId,
        is_active: true
      };

      const mockOfferQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockOffer, error: null })
      };

      const mockExistingClaimQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      };

      const mockCheckInQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCheckIn, error: null })
      };

      // Mock RPC to return max claims error
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Offer has reached maximum claims' }
      });

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'flash_offers') {
          return mockOfferQuery;
        } else if (table === 'flash_offer_claims') {
          callCount++;
          if (callCount === 1) {
            return mockExistingClaimQuery;
          }
        } else if (table === 'check_ins') {
          return mockCheckInQuery;
        }
        return mockOfferQuery;
      });

      await expect(ClaimService.claimOffer(offerId, userId)).rejects.toThrow(
        'This offer has reached its maximum claims'
      );
    });
  });

  describe('Expiration handling', () => {
    it('should prevent claiming expired offer', async () => {
      const offerId = 'offer-123';
      const userId = 'user-123';
      const venueId = 'venue-123';

      const mockOffer = {
        id: offerId,
        venue_id: venueId,
        status: 'active',
        end_time: new Date(Date.now() - 3600000).toISOString(), // Expired 1 hour ago
        claimed_count: 5,
        max_claims: 10,
        venues: { id: venueId }
      };

      const mockOfferQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockOffer, error: null })
      };

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'flash_offers') {
          return mockOfferQuery;
        }
        return mockOfferQuery;
      });

      await expect(ClaimService.claimOffer(offerId, userId)).rejects.toThrow(
        'This offer has expired'
      );
    });

    it('should prevent claiming offer with expired status', async () => {
      const offerId = 'offer-123';
      const userId = 'user-123';
      const venueId = 'venue-123';

      const mockOffer = {
        id: offerId,
        venue_id: venueId,
        status: 'expired',
        end_time: new Date(Date.now() - 3600000).toISOString(),
        claimed_count: 5,
        max_claims: 10,
        venues: { id: venueId }
      };

      const mockOfferQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockOffer, error: null })
      };

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'flash_offers') {
          return mockOfferQuery;
        }
        return mockOfferQuery;
      });

      await expect(ClaimService.claimOffer(offerId, userId)).rejects.toThrow(
        'This offer is not currently active'
      );
    });

    it('should set expiration time 24 hours from claim', async () => {
      const offerId = 'offer-123';
      const userId = 'user-123';
      const venueId = 'venue-123';

      const mockOffer = {
        id: offerId,
        venue_id: venueId,
        status: 'active',
        end_time: new Date(Date.now() + 3600000).toISOString(),
        claimed_count: 5,
        max_claims: 10,
        venues: { id: venueId }
      };

      const mockCheckIn = {
        id: 'checkin-123',
        user_id: userId,
        venue_id: venueId,
        is_active: true
      };

      const now = new Date();
      const expectedExpiration = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const mockClaim = {
        id: 'claim-123',
        offer_id: offerId,
        user_id: userId,
        token: '123456',
        status: 'active',
        expires_at: expectedExpiration.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        redeemed_at: null,
        redeemed_by_user_id: null
      };

      const mockOfferQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockOffer, error: null })
      };

      const mockExistingClaimQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      };

      const mockCheckInQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCheckIn, error: null })
      };

      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: [mockClaim],
        error: null
      });

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'flash_offers') {
          return mockOfferQuery;
        } else if (table === 'flash_offer_claims') {
          callCount++;
          if (callCount === 1) {
            return mockExistingClaimQuery;
          }
        } else if (table === 'check_ins') {
          return mockCheckInQuery;
        }
        return mockOfferQuery;
      });

      const result = await ClaimService.claimOffer(offerId, userId);

      const expiresAt = new Date(result.expires_at);
      const createdAt = new Date(result.created_at);
      const hoursDiff = (expiresAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      expect(hoursDiff).toBeCloseTo(24, 0);
    });

  });

  describe('Redemption flow (Task 16.3)', () => {
    it('should successfully redeem a valid token', async () => {
      const claimId = 'claim-123';
      const staffUserId = 'staff-123';
      const offerId = 'offer-123';
      const userId = 'user-123';

      const mockActiveClaim = {
        id: claimId,
        offer_id: offerId,
        user_id: userId,
        token: '123456',
        status: 'active',
        expires_at: new Date(Date.now() + 86400000).toISOString(), // Valid for 24 hours
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        redeemed_at: null,
        redeemed_by_user_id: null
      };

      const mockRedeemedClaim = {
        ...mockActiveClaim,
        status: 'redeemed',
        redeemed_at: new Date().toISOString(),
        redeemed_by_user_id: staffUserId
      };

      const mockFetchQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockActiveClaim, error: null })
      };

      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockRedeemedClaim, error: null })
      };

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'flash_offer_claims') {
          callCount++;
          if (callCount === 1) {
            return mockFetchQuery; // First call fetches the claim
          } else {
            return mockUpdateQuery; // Second call updates the claim
          }
        }
        return mockFetchQuery;
      });

      const result = await ClaimService.redeemClaim(claimId, staffUserId);

      expect(result.status).toBe('redeemed');
      expect(result.redeemed_by_user_id).toBe(staffUserId);
      expect(result.redeemed_at).toBeTruthy();
      expect(FlashOfferAnalyticsService.trackRedeem).toHaveBeenCalledWith(
        offerId,
        userId,
        claimId,
        staffUserId
      );
    });

    it('should handle invalid token (token not found)', async () => {
      const venueId = 'venue-123';
      const invalidToken = '999999';

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { code: 'PGRST116' } // Not found error
        })
      };

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'flash_offer_claims') {
          return mockQuery;
        }
        return mockQuery;
      });

      const result = await ClaimService.getClaimByToken(venueId, invalidToken);

      expect(result).toBeNull();
    });

    it('should handle invalid token (wrong venue)', async () => {
      const venueId = 'venue-123';
      const wrongVenueId = 'venue-456';
      const token = '123456';

      // Token exists but for a different venue
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { code: 'PGRST116' } // Not found due to venue filter
        })
      };

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'flash_offer_claims') {
          return mockQuery;
        }
        return mockQuery;
      });

      const result = await ClaimService.getClaimByToken(wrongVenueId, token);

      expect(result).toBeNull();
    });

    it('should prevent redeeming expired claim', async () => {
      const claimId = 'claim-123';
      const staffUserId = 'staff-123';

      const mockExpiredClaim = {
        id: claimId,
        offer_id: 'offer-123',
        user_id: 'user-123',
        token: '123456',
        status: 'active',
        expires_at: new Date(Date.now() - 3600000).toISOString(), // Expired 1 hour ago
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        redeemed_at: null,
        redeemed_by_user_id: null
      };

      const mockClaimQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockExpiredClaim, error: null })
      };

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'flash_offer_claims') {
          return mockClaimQuery;
        }
        return mockClaimQuery;
      });

      await expect(ClaimService.redeemClaim(claimId, staffUserId)).rejects.toThrow(
        'This claim has expired'
      );
    });

    it('should prevent redeeming claim with expired status', async () => {
      const claimId = 'claim-123';
      const staffUserId = 'staff-123';

      const mockExpiredClaim = {
        id: claimId,
        offer_id: 'offer-123',
        user_id: 'user-123',
        token: '123456',
        status: 'expired',
        expires_at: new Date(Date.now() - 3600000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        redeemed_at: null,
        redeemed_by_user_id: null
      };

      const mockClaimQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockExpiredClaim, error: null })
      };

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'flash_offer_claims') {
          return mockClaimQuery;
        }
        return mockClaimQuery;
      });

      await expect(ClaimService.redeemClaim(claimId, staffUserId)).rejects.toThrow(
        'This claim has expired'
      );
    });

    it('should prevent redeeming already redeemed claim', async () => {
      const claimId = 'claim-123';
      const staffUserId = 'staff-123';

      const mockRedeemedClaim = {
        id: claimId,
        offer_id: 'offer-123',
        user_id: 'user-123',
        token: '123456',
        status: 'redeemed',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        redeemed_at: new Date().toISOString(),
        redeemed_by_user_id: 'other-staff-123'
      };

      const mockClaimQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockRedeemedClaim, error: null })
      };

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'flash_offer_claims') {
          return mockClaimQuery;
        }
        return mockClaimQuery;
      });

      await expect(ClaimService.redeemClaim(claimId, staffUserId)).rejects.toThrow(
        'This claim has already been redeemed'
      );
    });

    it('should verify redemption updates claim status and timestamps', async () => {
      const claimId = 'claim-123';
      const staffUserId = 'staff-123';
      const offerId = 'offer-123';
      const userId = 'user-123';

      const mockActiveClaim = {
        id: claimId,
        offer_id: offerId,
        user_id: userId,
        token: '123456',
        status: 'active',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        redeemed_at: null,
        redeemed_by_user_id: null
      };

      const redemptionTime = new Date().toISOString();
      const mockRedeemedClaim = {
        ...mockActiveClaim,
        status: 'redeemed',
        redeemed_at: redemptionTime,
        redeemed_by_user_id: staffUserId
      };

      const mockFetchQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockActiveClaim, error: null })
      };

      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockRedeemedClaim, error: null })
      };

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'flash_offer_claims') {
          callCount++;
          if (callCount === 1) {
            return mockFetchQuery;
          } else {
            return mockUpdateQuery;
          }
        }
        return mockFetchQuery;
      });

      const result = await ClaimService.redeemClaim(claimId, staffUserId);

      // Verify status changed from active to redeemed
      expect(result.status).toBe('redeemed');
      
      // Verify redeemed_at timestamp was set
      expect(result.redeemed_at).toBeTruthy();
      expect(result.redeemed_at).toBe(redemptionTime);
      
      // Verify redeemed_by_user_id was set to staff user
      expect(result.redeemed_by_user_id).toBe(staffUserId);
      
      // Verify update was called with correct parameters
      expect(mockUpdateQuery.update).toHaveBeenCalledWith({
        status: 'redeemed',
        redeemed_at: expect.any(String),
        redeemed_by_user_id: staffUserId,
      });
    });
  });

  /**
   * Edge Case Tests (Task 16.4)
   * Tests for edge cases that can occur during the claim flow:
   * - Offer expires during claim
   * - Offer fills up during claim
   * - User checks out during claim
   * - Network interruption during claim
   */
  describe('Edge Cases (Task 16.4)', () => {
    describe('Offer expires during claim', () => {
      it('should reject claim when offer expires between validation and claim', async () => {
        const offerId = 'offer-123';
        const userId = 'user-123';
        const venueId = 'venue-123';

        // Offer is active during validation but expires before claim
        const mockOffer = {
          id: offerId,
          venue_id: venueId,
          status: 'active',
          end_time: new Date(Date.now() + 100).toISOString(), // Expires in 100ms
          claimed_count: 5,
          max_claims: 10,
          venues: { id: venueId }
        };

        const mockCheckIn = {
          id: 'checkin-123',
          user_id: userId,
          venue_id: venueId,
          is_active: true
        };

        const mockOfferQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockOffer, error: null })
        };

        const mockExistingClaimQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
        };

        const mockCheckInQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockCheckIn, error: null })
        };

        // Mock RPC to return expired error (simulating expiration during claim)
        (supabase.rpc as jest.Mock).mockResolvedValue({
          data: null,
          error: { message: 'Offer is not active' }
        });

        let callCount = 0;
        (supabase.from as jest.Mock).mockImplementation((table: string) => {
          if (table === 'flash_offers') {
            return mockOfferQuery;
          } else if (table === 'flash_offer_claims') {
            callCount++;
            if (callCount === 1) {
              return mockExistingClaimQuery;
            }
          } else if (table === 'check_ins') {
            return mockCheckInQuery;
          }
          return mockOfferQuery;
        });

        await expect(ClaimService.claimOffer(offerId, userId)).rejects.toThrow(
          'This offer is not currently active'
        );
      });

      it('should handle offer status change from active to expired during claim', async () => {
        const offerId = 'offer-123';
        const userId = 'user-123';
        const venueId = 'venue-123';

        const mockOffer = {
          id: offerId,
          venue_id: venueId,
          status: 'active',
          end_time: new Date(Date.now() + 50).toISOString(), // Very short time
          claimed_count: 5,
          max_claims: 10,
          venues: { id: venueId }
        };

        const mockCheckIn = {
          id: 'checkin-123',
          user_id: userId,
          venue_id: venueId,
          is_active: true
        };

        const mockOfferQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockOffer, error: null })
        };

        const mockExistingClaimQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
        };

        const mockCheckInQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockCheckIn, error: null })
        };

        // Simulate the offer expiring during the atomic claim
        (supabase.rpc as jest.Mock).mockImplementation(async () => {
          // Wait for offer to expire
          await new Promise(resolve => setTimeout(resolve, 100));
          return {
            data: null,
            error: { message: 'Offer is not active' }
          };
        });

        let callCount = 0;
        (supabase.from as jest.Mock).mockImplementation((table: string) => {
          if (table === 'flash_offers') {
            return mockOfferQuery;
          } else if (table === 'flash_offer_claims') {
            callCount++;
            if (callCount === 1) {
              return mockExistingClaimQuery;
            }
          } else if (table === 'check_ins') {
            return mockCheckInQuery;
          }
          return mockOfferQuery;
        });

        await expect(ClaimService.claimOffer(offerId, userId)).rejects.toThrow(
          'This offer is not currently active'
        );
      });
    });

    describe('Offer fills up during claim', () => {
      it('should handle race condition when last claim is taken by another user', async () => {
        const offerId = 'offer-123';
        const userId = 'user-123';
        const venueId = 'venue-123';

        // Offer has 1 claim left
        const mockOffer = {
          id: offerId,
          venue_id: venueId,
          status: 'active',
          end_time: new Date(Date.now() + 3600000).toISOString(),
          claimed_count: 9,
          max_claims: 10,
          venues: { id: venueId }
        };

        const mockCheckIn = {
          id: 'checkin-123',
          user_id: userId,
          venue_id: venueId,
          is_active: true
        };

        const mockOfferQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockOffer, error: null })
        };

        const mockExistingClaimQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
        };

        const mockCheckInQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockCheckIn, error: null })
        };

        // Mock RPC to return max claims error (another user got the last claim)
        (supabase.rpc as jest.Mock).mockResolvedValue({
          data: null,
          error: { message: 'Offer has reached maximum claims' }
        });

        let callCount = 0;
        (supabase.from as jest.Mock).mockImplementation((table: string) => {
          if (table === 'flash_offers') {
            return mockOfferQuery;
          } else if (table === 'flash_offer_claims') {
            callCount++;
            if (callCount === 1) {
              return mockExistingClaimQuery;
            }
          } else if (table === 'check_ins') {
            return mockCheckInQuery;
          }
          return mockOfferQuery;
        });

        await expect(ClaimService.claimOffer(offerId, userId)).rejects.toThrow(
          'This offer has reached its maximum claims'
        );
      });

      it('should handle concurrent claims for the same offer', async () => {
        const offerId = 'offer-123';
        const userId1 = 'user-123';
        const userId2 = 'user-456';
        const venueId = 'venue-123';

        // Offer has 1 claim left
        const mockOffer = {
          id: offerId,
          venue_id: venueId,
          status: 'active',
          end_time: new Date(Date.now() + 3600000).toISOString(),
          claimed_count: 9,
          max_claims: 10,
          venues: { id: venueId }
        };

        const mockCheckIn1 = {
          id: 'checkin-123',
          user_id: userId1,
          venue_id: venueId,
          is_active: true
        };

        const mockCheckIn2 = {
          id: 'checkin-456',
          user_id: userId2,
          venue_id: venueId,
          is_active: true
        };

        const mockClaim = {
          id: 'claim-123',
          offer_id: offerId,
          user_id: userId1,
          token: '123456',
          status: 'active',
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          redeemed_at: null,
          redeemed_by_user_id: null
        };

        // First user succeeds, second user fails
        let rpcCallCount = 0;
        (supabase.rpc as jest.Mock).mockImplementation(() => {
          rpcCallCount++;
          if (rpcCallCount === 1) {
            return Promise.resolve({ data: [mockClaim], error: null });
          } else {
            return Promise.resolve({
              data: null,
              error: { message: 'Offer has reached maximum claims' }
            });
          }
        });

        const mockOfferQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockOffer, error: null })
        };

        const mockExistingClaimQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
        };

        let fromCallCount = 0;
        (supabase.from as jest.Mock).mockImplementation((table: string) => {
          if (table === 'flash_offers') {
            return mockOfferQuery;
          } else if (table === 'flash_offer_claims') {
            fromCallCount++;
            return mockExistingClaimQuery;
          } else if (table === 'check_ins') {
            // Return appropriate check-in based on call count
            const checkInData = fromCallCount <= 3 ? mockCheckIn1 : mockCheckIn2;
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({ data: checkInData, error: null })
            };
          }
          return mockOfferQuery;
        });

        // First claim should succeed
        const result1 = await ClaimService.claimOffer(offerId, userId1);
        expect(result1).toEqual(mockClaim);

        // Second claim should fail
        await expect(ClaimService.claimOffer(offerId, userId2)).rejects.toThrow(
          'This offer has reached its maximum claims'
        );
      });
    });

    describe('User checks out during claim', () => {
      it('should reject claim when user checks out between validation and claim', async () => {
        const offerId = 'offer-123';
        const userId = 'user-123';
        const venueId = 'venue-123';

        const mockOffer = {
          id: offerId,
          venue_id: venueId,
          status: 'active',
          end_time: new Date(Date.now() + 3600000).toISOString(),
          claimed_count: 5,
          max_claims: 10,
          venues: { id: venueId }
        };

        // User is checked in during validation
        const mockCheckIn = {
          id: 'checkin-123',
          user_id: userId,
          venue_id: venueId,
          is_active: true
        };

        const mockOfferQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockOffer, error: null })
        };

        const mockExistingClaimQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
        };

        // First check-in query returns active, but user checks out before claim
        let checkInCallCount = 0;
        const mockCheckInQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockImplementation(() => {
            checkInCallCount++;
            if (checkInCallCount === 1) {
              return Promise.resolve({ data: mockCheckIn, error: null });
            } else {
              // User has checked out
              return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
            }
          })
        };

        // Mock RPC to fail because user is no longer checked in
        (supabase.rpc as jest.Mock).mockResolvedValue({
          data: null,
          error: { message: 'User must be checked in to claim offer' }
        });

        let callCount = 0;
        (supabase.from as jest.Mock).mockImplementation((table: string) => {
          if (table === 'flash_offers') {
            return mockOfferQuery;
          } else if (table === 'flash_offer_claims') {
            callCount++;
            if (callCount === 1) {
              return mockExistingClaimQuery;
            }
          } else if (table === 'check_ins') {
            return mockCheckInQuery;
          }
          return mockOfferQuery;
        });

        await expect(ClaimService.claimOffer(offerId, userId)).rejects.toThrow();
      });

      it('should handle check-in becoming inactive during claim process', async () => {
        const offerId = 'offer-123';
        const userId = 'user-123';
        const venueId = 'venue-123';

        const mockOffer = {
          id: offerId,
          venue_id: venueId,
          status: 'active',
          end_time: new Date(Date.now() + 3600000).toISOString(),
          claimed_count: 5,
          max_claims: 10,
          venues: { id: venueId }
        };

        // Check-in exists but becomes inactive
        const mockInactiveCheckIn = {
          id: 'checkin-123',
          user_id: userId,
          venue_id: venueId,
          is_active: false
        };

        const mockOfferQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockOffer, error: null })
        };

        const mockExistingClaimQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
        };

        const mockCheckInQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockInactiveCheckIn, error: null })
        };

        let callCount = 0;
        (supabase.from as jest.Mock).mockImplementation((table: string) => {
          if (table === 'flash_offers') {
            return mockOfferQuery;
          } else if (table === 'flash_offer_claims') {
            callCount++;
            if (callCount === 1) {
              return mockExistingClaimQuery;
            }
          } else if (table === 'check_ins') {
            return mockCheckInQuery;
          }
          return mockOfferQuery;
        });

        await expect(ClaimService.claimOffer(offerId, userId)).rejects.toThrow(
          'Failed to claim offer: User must be checked in to claim offer'
        );
      });
    });

    describe('Network interruption during claim', () => {
      it('should handle network error during claim validation', async () => {
        const offerId = 'offer-123';
        const userId = 'user-123';

        const mockOfferQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockRejectedValue(new Error('Network request failed'))
        };

        (supabase.from as jest.Mock).mockImplementation((table: string) => {
          if (table === 'flash_offers') {
            return mockOfferQuery;
          }
          return mockOfferQuery;
        });

        await expect(ClaimService.claimOffer(offerId, userId)).rejects.toThrow(
          'An error occurred while validating eligibility'
        );
      });

      it('should handle network error during atomic claim creation', async () => {
        const offerId = 'offer-123';
        const userId = 'user-123';
        const venueId = 'venue-123';

        const mockOffer = {
          id: offerId,
          venue_id: venueId,
          status: 'active',
          end_time: new Date(Date.now() + 3600000).toISOString(),
          claimed_count: 5,
          max_claims: 10,
          venues: { id: venueId }
        };

        const mockCheckIn = {
          id: 'checkin-123',
          user_id: userId,
          venue_id: venueId,
          is_active: true
        };

        const mockOfferQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockOffer, error: null })
        };

        const mockExistingClaimQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
        };

        const mockCheckInQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockCheckIn, error: null })
        };

        // Mock RPC to fail with network error
        (supabase.rpc as jest.Mock).mockRejectedValue(new Error('Network request failed'));

        let callCount = 0;
        (supabase.from as jest.Mock).mockImplementation((table: string) => {
          if (table === 'flash_offers') {
            return mockOfferQuery;
          } else if (table === 'flash_offer_claims') {
            callCount++;
            if (callCount === 1) {
              return mockExistingClaimQuery;
            }
          } else if (table === 'check_ins') {
            return mockCheckInQuery;
          }
          return mockOfferQuery;
        });

        await expect(ClaimService.claimOffer(offerId, userId)).rejects.toThrow(
          'Network request failed'
        );
      });

      it('should handle timeout during claim process', async () => {
        const offerId = 'offer-123';
        const userId = 'user-123';
        const venueId = 'venue-123';

        const mockOffer = {
          id: offerId,
          venue_id: venueId,
          status: 'active',
          end_time: new Date(Date.now() + 3600000).toISOString(),
          claimed_count: 5,
          max_claims: 10,
          venues: { id: venueId }
        };

        const mockCheckIn = {
          id: 'checkin-123',
          user_id: userId,
          venue_id: venueId,
          is_active: true
        };

        const mockOfferQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockOffer, error: null })
        };

        const mockExistingClaimQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
        };

        const mockCheckInQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockCheckIn, error: null })
        };

        // Mock RPC to timeout
        (supabase.rpc as jest.Mock).mockImplementation(() => {
          return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 100);
          });
        });

        let callCount = 0;
        (supabase.from as jest.Mock).mockImplementation((table: string) => {
          if (table === 'flash_offers') {
            return mockOfferQuery;
          } else if (table === 'flash_offer_claims') {
            callCount++;
            if (callCount === 1) {
              return mockExistingClaimQuery;
            }
          } else if (table === 'check_ins') {
            return mockCheckInQuery;
          }
          return mockOfferQuery;
        });

        await expect(ClaimService.claimOffer(offerId, userId)).rejects.toThrow(
          'Request timeout'
        );
      });

      it('should handle partial network failure with retry', async () => {
        const offerId = 'offer-123';
        const userId = 'user-123';
        const venueId = 'venue-123';

        const mockOffer = {
          id: offerId,
          venue_id: venueId,
          status: 'active',
          end_time: new Date(Date.now() + 3600000).toISOString(),
          claimed_count: 5,
          max_claims: 10,
          venues: { id: venueId }
        };

        const mockCheckIn = {
          id: 'checkin-123',
          user_id: userId,
          venue_id: venueId,
          is_active: true
        };

        const mockClaim = {
          id: 'claim-123',
          offer_id: offerId,
          user_id: userId,
          token: '123456',
          status: 'active',
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          redeemed_at: null,
          redeemed_by_user_id: null
        };

        const mockOfferQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockOffer, error: null })
        };

        const mockExistingClaimQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
        };

        const mockCheckInQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockCheckIn, error: null })
        };

        // Mock RPC to fail first time, succeed second time (simulating retry)
        let rpcAttempts = 0;
        (supabase.rpc as jest.Mock).mockImplementation(() => {
          rpcAttempts++;
          if (rpcAttempts === 1) {
            return Promise.reject(new Error('Network request failed'));
          } else {
            return Promise.resolve({ data: [mockClaim], error: null });
          }
        });

        let callCount = 0;
        (supabase.from as jest.Mock).mockImplementation((table: string) => {
          if (table === 'flash_offers') {
            return mockOfferQuery;
          } else if (table === 'flash_offer_claims') {
            callCount++;
            if (callCount === 1) {
              return mockExistingClaimQuery;
            }
          } else if (table === 'check_ins') {
            return mockCheckInQuery;
          }
          return mockOfferQuery;
        });

        // First attempt should fail
        await expect(ClaimService.claimOffer(offerId, userId)).rejects.toThrow(
          'Network request failed'
        );

        // Reset call count for second attempt
        callCount = 0;

        // Second attempt should succeed (simulating user retry)
        const result = await ClaimService.claimOffer(offerId, userId);
        expect(result).toEqual(mockClaim);
      });
    });
  });
});
