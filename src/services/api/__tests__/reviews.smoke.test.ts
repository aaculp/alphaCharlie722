/**
 * ReviewService Smoke Tests
 * 
 * Basic tests to verify ReviewService compiles and has correct structure
 */

import { ReviewService } from '../reviews';

describe('ReviewService', () => {
  describe('Service Structure', () => {
    it('should have submitReview method', () => {
      expect(typeof ReviewService.submitReview).toBe('function');
    });

    it('should have updateReview method', () => {
      expect(typeof ReviewService.updateReview).toBe('function');
    });

    it('should have deleteReview method', () => {
      expect(typeof ReviewService.deleteReview).toBe('function');
    });

    it('should have getVenueReviews method', () => {
      expect(typeof ReviewService.getVenueReviews).toBe('function');
    });

    it('should have getUserReviewForVenue method', () => {
      expect(typeof ReviewService.getUserReviewForVenue).toBe('function');
    });

    it('should have toggleHelpfulVote method', () => {
      expect(typeof ReviewService.toggleHelpfulVote).toBe('function');
    });

    it('should have submitVenueResponse method', () => {
      expect(typeof ReviewService.submitVenueResponse).toBe('function');
    });

    it('should have updateVenueResponse method', () => {
      expect(typeof ReviewService.updateVenueResponse).toBe('function');
    });

    it('should have deleteVenueResponse method', () => {
      expect(typeof ReviewService.deleteVenueResponse).toBe('function');
    });

    it('should have reportReview method', () => {
      expect(typeof ReviewService.reportReview).toBe('function');
    });

    it('should have hasUserCheckedIn method', () => {
      expect(typeof ReviewService.hasUserCheckedIn).toBe('function');
    });
  });

  describe('Validation', () => {
    it('should reject review submission without authentication', async () => {
      await expect(
        ReviewService.submitReview({
          venueId: 'test-venue',
          userId: '',
          rating: 5,
        })
      ).rejects.toThrow('Authentication required');
    });

    it('should reject review with invalid rating (too low)', async () => {
      await expect(
        ReviewService.submitReview({
          venueId: 'test-venue',
          userId: 'test-user',
          rating: 0,
        })
      ).rejects.toThrow('Rating must be between 1 and 5');
    });

    it('should reject review with invalid rating (too high)', async () => {
      await expect(
        ReviewService.submitReview({
          venueId: 'test-venue',
          userId: 'test-user',
          rating: 6,
        })
      ).rejects.toThrow('Rating must be between 1 and 5');
    });

    it('should reject review with empty text', async () => {
      await expect(
        ReviewService.submitReview({
          venueId: 'test-venue',
          userId: 'test-user',
          rating: 5,
          reviewText: '   ',
        })
      ).rejects.toThrow('Review text cannot be empty or contain only spaces');
    });

    it('should reject review with text exceeding 500 characters', async () => {
      const longText = 'a'.repeat(501);
      await expect(
        ReviewService.submitReview({
          venueId: 'test-venue',
          userId: 'test-user',
          rating: 5,
          reviewText: longText,
        })
      ).rejects.toThrow('Review text cannot exceed 500 characters');
    });
  });
});
