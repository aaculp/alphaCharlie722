/**
 * Unit Tests for Claim Button State Derivation
 * Feature: venue-detail-claim-button
 */

import { deriveClaimButtonState } from '../claimButtonState';
import type { FlashOffer } from '../../types/flashOffer.types';
import type { FlashOfferClaim } from '../../types/flashOfferClaim.types';
import type { MutationState } from '../../types/claimButton.types';

// Helper function to create a mock flash offer
function createMockOffer(overrides: Partial<FlashOffer> = {}): FlashOffer {
  return {
    id: 'offer-123',
    venue_id: 'venue-456',
    title: 'Test Offer',
    description: 'Test Description',
    value_cap: '$10 off',
    max_claims: 50,
    claimed_count: 10,
    start_time: '2024-01-01T00:00:00Z',
    end_time: '2024-12-31T23:59:59Z',
    radius_miles: 1.0,
    target_favorites_only: false,
    status: 'active',
    push_sent: false,
    push_sent_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// Helper function to create a mock claim
function createMockClaim(overrides: Partial<FlashOfferClaim> = {}): FlashOfferClaim {
  return {
    id: 'claim-789',
    offer_id: 'offer-123',
    user_id: 'user-001',
    token: '123456',
    status: 'active',
    redeemed_at: null,
    redeemed_by_user_id: null,
    expires_at: '2024-12-31T23:59:59Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('deriveClaimButtonState', () => {
  describe('Priority 1: Loading state', () => {
    it('should return "loading" when mutation is in progress', () => {
      const offer = createMockOffer();
      const mutationState: MutationState = { isLoading: true };

      const result = deriveClaimButtonState(offer, null, true, mutationState);

      expect(result).toBe('loading');
    });

    it('should return "loading" even if user has already claimed', () => {
      const offer = createMockOffer();
      const claim = createMockClaim();
      const mutationState: MutationState = { isLoading: true };

      const result = deriveClaimButtonState(offer, claim, true, mutationState);

      expect(result).toBe('loading');
    });

    it('should return "loading" even if user is not checked in', () => {
      const offer = createMockOffer();
      const mutationState: MutationState = { isLoading: true };

      const result = deriveClaimButtonState(offer, null, false, mutationState);

      expect(result).toBe('loading');
    });

    it('should return "loading" even if offer is full', () => {
      const offer = createMockOffer({ status: 'full' });
      const mutationState: MutationState = { isLoading: true };

      const result = deriveClaimButtonState(offer, null, true, mutationState);

      expect(result).toBe('loading');
    });
  });

  describe('Priority 2: Claimed state', () => {
    it('should return "claimed" when user has a claim', () => {
      const offer = createMockOffer();
      const claim = createMockClaim();
      const mutationState: MutationState = { isLoading: false };

      const result = deriveClaimButtonState(offer, claim, true, mutationState);

      expect(result).toBe('claimed');
    });

    it('should return "claimed" even if user is not checked in', () => {
      const offer = createMockOffer();
      const claim = createMockClaim();
      const mutationState: MutationState = { isLoading: false };

      const result = deriveClaimButtonState(offer, claim, false, mutationState);

      expect(result).toBe('claimed');
    });

    it('should return "claimed" even if offer is full', () => {
      const offer = createMockOffer({ status: 'full' });
      const claim = createMockClaim();
      const mutationState: MutationState = { isLoading: false };

      const result = deriveClaimButtonState(offer, claim, true, mutationState);

      expect(result).toBe('claimed');
    });
  });

  describe('Priority 3: Not checked in state', () => {
    it('should return "not_checked_in" when user is not checked in', () => {
      const offer = createMockOffer();
      const mutationState: MutationState = { isLoading: false };

      const result = deriveClaimButtonState(offer, null, false, mutationState);

      expect(result).toBe('not_checked_in');
    });

    it('should return "not_checked_in" even if offer is full', () => {
      const offer = createMockOffer({ status: 'full' });
      const mutationState: MutationState = { isLoading: false };

      const result = deriveClaimButtonState(offer, null, false, mutationState);

      expect(result).toBe('not_checked_in');
    });

    it('should return "not_checked_in" even if offer is expired', () => {
      const offer = createMockOffer({ status: 'expired' });
      const mutationState: MutationState = { isLoading: false };

      const result = deriveClaimButtonState(offer, null, false, mutationState);

      expect(result).toBe('not_checked_in');
    });
  });

  describe('Priority 4: Full state', () => {
    it('should return "full" when offer status is full', () => {
      const offer = createMockOffer({ status: 'full' });
      const mutationState: MutationState = { isLoading: false };

      const result = deriveClaimButtonState(offer, null, true, mutationState);

      expect(result).toBe('full');
    });

    it('should return "full" when claimed_count equals max_claims', () => {
      const offer = createMockOffer({ claimed_count: 50, max_claims: 50 });
      const mutationState: MutationState = { isLoading: false };

      const result = deriveClaimButtonState(offer, null, true, mutationState);

      expect(result).toBe('full');
    });

    it('should return "full" when claimed_count exceeds max_claims', () => {
      const offer = createMockOffer({ claimed_count: 51, max_claims: 50 });
      const mutationState: MutationState = { isLoading: false };

      const result = deriveClaimButtonState(offer, null, true, mutationState);

      expect(result).toBe('full');
    });
  });

  describe('Priority 5: Expired state', () => {
    it('should return "expired" when offer status is expired', () => {
      const offer = createMockOffer({ status: 'expired' });
      const mutationState: MutationState = { isLoading: false };

      const result = deriveClaimButtonState(offer, null, true, mutationState);

      expect(result).toBe('expired');
    });

    it('should return "expired" when offer status is cancelled', () => {
      const offer = createMockOffer({ status: 'cancelled' });
      const mutationState: MutationState = { isLoading: false };

      const result = deriveClaimButtonState(offer, null, true, mutationState);

      expect(result).toBe('expired');
    });
  });

  describe('Priority 6: Claimable state', () => {
    it('should return "claimable" when all conditions are met', () => {
      const offer = createMockOffer({ status: 'active', claimed_count: 10, max_claims: 50 });
      const mutationState: MutationState = { isLoading: false };

      const result = deriveClaimButtonState(offer, null, true, mutationState);

      expect(result).toBe('claimable');
    });

    it('should return "claimable" when offer is scheduled but active', () => {
      const offer = createMockOffer({ status: 'scheduled' });
      const mutationState: MutationState = { isLoading: false };

      const result = deriveClaimButtonState(offer, null, true, mutationState);

      expect(result).toBe('claimable');
    });

    it('should return "claimable" when claimed_count is 0', () => {
      const offer = createMockOffer({ claimed_count: 0, max_claims: 50 });
      const mutationState: MutationState = { isLoading: false };

      const result = deriveClaimButtonState(offer, null, true, mutationState);

      expect(result).toBe('claimable');
    });

    it('should return "claimable" when claimed_count is just below max_claims', () => {
      const offer = createMockOffer({ claimed_count: 49, max_claims: 50 });
      const mutationState: MutationState = { isLoading: false };

      const result = deriveClaimButtonState(offer, null, true, mutationState);

      expect(result).toBe('claimable');
    });
  });

  describe('Edge cases', () => {
    it('should handle offer with 0 max_claims', () => {
      const offer = createMockOffer({ claimed_count: 0, max_claims: 0 });
      const mutationState: MutationState = { isLoading: false };

      const result = deriveClaimButtonState(offer, null, true, mutationState);

      expect(result).toBe('full');
    });

    it('should handle offer with 1 max_claim', () => {
      const offer = createMockOffer({ claimed_count: 0, max_claims: 1 });
      const mutationState: MutationState = { isLoading: false };

      const result = deriveClaimButtonState(offer, null, true, mutationState);

      expect(result).toBe('claimable');
    });

    it('should handle very large max_claims', () => {
      const offer = createMockOffer({ claimed_count: 500, max_claims: 1000 });
      const mutationState: MutationState = { isLoading: false };

      const result = deriveClaimButtonState(offer, null, true, mutationState);

      expect(result).toBe('claimable');
    });
  });
});
