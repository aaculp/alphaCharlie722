/**
 * ReviewCard Quality Badges Tests
 * 
 * Tests for quality badge display logic
 * 
 * Requirements:
 * - 16.1: "Detailed Review" badge for 200+ chars
 * - 16.2: "Top Review" badge for 10+ helpful votes
 * - 16.3: "Frequent Reviewer" badge for 10+ reviews
 * - 16.4: "Trusted Reviewer" badge for >70% helpful ratio
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import ReviewCard from '../ReviewCard';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import type { ReviewWithReviewer } from '../../../types';

// Mock theme provider
const MockThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

// Helper to create a mock review
const createMockReview = (overrides?: Partial<ReviewWithReviewer>): ReviewWithReviewer => ({
  id: '1',
  venue_id: 'venue-1',
  user_id: 'user-1',
  rating: 5,
  review_text: 'Great place!',
  is_verified: false,
  helpful_count: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  reviewer: {
    id: 'user-1',
    display_name: 'Test User',
  },
  ...overrides,
});

describe('ReviewCard - Quality Badges', () => {
  const mockOnHelpfulToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Requirement 16.1: Detailed Review Badge', () => {
    it('should display "Detailed Review" badge for reviews with 200+ characters', () => {
      const longText = 'a'.repeat(200);
      const review = createMockReview({ review_text: longText });

      const { getByText } = render(
        <MockThemeProvider>
          <ReviewCard
            review={review}
            onHelpfulToggle={mockOnHelpfulToggle}
            currentUserId="user-2"
          />
        </MockThemeProvider>
      );

      expect(getByText('Detailed Review')).toBeTruthy();
    });

    it('should NOT display "Detailed Review" badge for reviews with <200 characters', () => {
      const shortText = 'a'.repeat(199);
      const review = createMockReview({ review_text: shortText });

      const { queryByText } = render(
        <MockThemeProvider>
          <ReviewCard
            review={review}
            onHelpfulToggle={mockOnHelpfulToggle}
            currentUserId="user-2"
          />
        </MockThemeProvider>
      );

      expect(queryByText('Detailed Review')).toBeNull();
    });

    it('should NOT display "Detailed Review" badge when review_text is undefined', () => {
      const review = createMockReview({ review_text: undefined });

      const { queryByText } = render(
        <MockThemeProvider>
          <ReviewCard
            review={review}
            onHelpfulToggle={mockOnHelpfulToggle}
            currentUserId="user-2"
          />
        </MockThemeProvider>
      );

      expect(queryByText('Detailed Review')).toBeNull();
    });
  });

  describe('Requirement 16.2: Top Review Badge', () => {
    it('should display "Top Review" badge for reviews with 10+ helpful votes', () => {
      const review = createMockReview({ helpful_count: 10 });

      const { getByText } = render(
        <MockThemeProvider>
          <ReviewCard
            review={review}
            onHelpfulToggle={mockOnHelpfulToggle}
            currentUserId="user-2"
          />
        </MockThemeProvider>
      );

      expect(getByText('Top Review')).toBeTruthy();
    });

    it('should display "Top Review" badge for reviews with >10 helpful votes', () => {
      const review = createMockReview({ helpful_count: 25 });

      const { getByText } = render(
        <MockThemeProvider>
          <ReviewCard
            review={review}
            onHelpfulToggle={mockOnHelpfulToggle}
            currentUserId="user-2"
          />
        </MockThemeProvider>
      );

      expect(getByText('Top Review')).toBeTruthy();
    });

    it('should NOT display "Top Review" badge for reviews with <10 helpful votes', () => {
      const review = createMockReview({ helpful_count: 9 });

      const { queryByText } = render(
        <MockThemeProvider>
          <ReviewCard
            review={review}
            onHelpfulToggle={mockOnHelpfulToggle}
            currentUserId="user-2"
          />
        </MockThemeProvider>
      );

      expect(queryByText('Top Review')).toBeNull();
    });
  });

  describe('Requirement 16.3: Frequent Reviewer Badge', () => {
    it('should display "Frequent Reviewer" badge for reviewers with 10+ reviews', () => {
      const review = createMockReview({
        reviewer_stats: {
          total_reviews: 10,
          total_helpful_votes: 5,
          helpful_ratio: 50,
        },
      });

      const { getByText } = render(
        <MockThemeProvider>
          <ReviewCard
            review={review}
            onHelpfulToggle={mockOnHelpfulToggle}
            currentUserId="user-2"
          />
        </MockThemeProvider>
      );

      expect(getByText('Frequent Reviewer')).toBeTruthy();
    });

    it('should NOT display "Frequent Reviewer" badge for reviewers with <10 reviews', () => {
      const review = createMockReview({
        reviewer_stats: {
          total_reviews: 9,
          total_helpful_votes: 5,
          helpful_ratio: 50,
        },
      });

      const { queryByText } = render(
        <MockThemeProvider>
          <ReviewCard
            review={review}
            onHelpfulToggle={mockOnHelpfulToggle}
            currentUserId="user-2"
          />
        </MockThemeProvider>
      );

      expect(queryByText('Frequent Reviewer')).toBeNull();
    });

    it('should NOT display "Frequent Reviewer" badge when reviewer_stats is undefined', () => {
      const review = createMockReview({ reviewer_stats: undefined });

      const { queryByText } = render(
        <MockThemeProvider>
          <ReviewCard
            review={review}
            onHelpfulToggle={mockOnHelpfulToggle}
            currentUserId="user-2"
          />
        </MockThemeProvider>
      );

      expect(queryByText('Frequent Reviewer')).toBeNull();
    });
  });

  describe('Requirement 16.4: Trusted Reviewer Badge', () => {
    it('should display "Trusted Reviewer" badge for reviewers with >70% helpful ratio', () => {
      const review = createMockReview({
        reviewer_stats: {
          total_reviews: 10,
          total_helpful_votes: 8,
          helpful_ratio: 71,
        },
      });

      const { getByText } = render(
        <MockThemeProvider>
          <ReviewCard
            review={review}
            onHelpfulToggle={mockOnHelpfulToggle}
            currentUserId="user-2"
          />
        </MockThemeProvider>
      );

      expect(getByText('Trusted Reviewer')).toBeTruthy();
    });

    it('should NOT display "Trusted Reviewer" badge for reviewers with exactly 70% helpful ratio', () => {
      const review = createMockReview({
        reviewer_stats: {
          total_reviews: 10,
          total_helpful_votes: 7,
          helpful_ratio: 70,
        },
      });

      const { queryByText } = render(
        <MockThemeProvider>
          <ReviewCard
            review={review}
            onHelpfulToggle={mockOnHelpfulToggle}
            currentUserId="user-2"
          />
        </MockThemeProvider>
      );

      expect(queryByText('Trusted Reviewer')).toBeNull();
    });

    it('should NOT display "Trusted Reviewer" badge for reviewers with <70% helpful ratio', () => {
      const review = createMockReview({
        reviewer_stats: {
          total_reviews: 10,
          total_helpful_votes: 6,
          helpful_ratio: 60,
        },
      });

      const { queryByText } = render(
        <MockThemeProvider>
          <ReviewCard
            review={review}
            onHelpfulToggle={mockOnHelpfulToggle}
            currentUserId="user-2"
          />
        </MockThemeProvider>
      );

      expect(queryByText('Trusted Reviewer')).toBeNull();
    });
  });

  describe('Multiple Badges', () => {
    it('should display multiple badges when criteria are met', () => {
      const longText = 'a'.repeat(200);
      const review = createMockReview({
        review_text: longText,
        helpful_count: 15,
        reviewer_stats: {
          total_reviews: 20,
          total_helpful_votes: 50,
          helpful_ratio: 80,
        },
      });

      const { getByText } = render(
        <MockThemeProvider>
          <ReviewCard
            review={review}
            onHelpfulToggle={mockOnHelpfulToggle}
            currentUserId="user-2"
          />
        </MockThemeProvider>
      );

      // All 4 badges should be present
      expect(getByText('Detailed Review')).toBeTruthy();
      expect(getByText('Top Review')).toBeTruthy();
      expect(getByText('Frequent Reviewer')).toBeTruthy();
      expect(getByText('Trusted Reviewer')).toBeTruthy();
    });

    it('should display no badges when no criteria are met', () => {
      const review = createMockReview({
        review_text: 'Short review',
        helpful_count: 2,
        reviewer_stats: {
          total_reviews: 3,
          total_helpful_votes: 1,
          helpful_ratio: 33,
        },
      });

      const { queryByText } = render(
        <MockThemeProvider>
          <ReviewCard
            review={review}
            onHelpfulToggle={mockOnHelpfulToggle}
            currentUserId="user-2"
          />
        </MockThemeProvider>
      );

      expect(queryByText('Detailed Review')).toBeNull();
      expect(queryByText('Top Review')).toBeNull();
      expect(queryByText('Frequent Reviewer')).toBeNull();
      expect(queryByText('Trusted Reviewer')).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle exactly 200 characters for Detailed Review badge', () => {
      const exactText = 'a'.repeat(200);
      const review = createMockReview({ review_text: exactText });

      const { getByText } = render(
        <MockThemeProvider>
          <ReviewCard
            review={review}
            onHelpfulToggle={mockOnHelpfulToggle}
            currentUserId="user-2"
          />
        </MockThemeProvider>
      );

      expect(getByText('Detailed Review')).toBeTruthy();
    });

    it('should handle exactly 10 helpful votes for Top Review badge', () => {
      const review = createMockReview({ helpful_count: 10 });

      const { getByText } = render(
        <MockThemeProvider>
          <ReviewCard
            review={review}
            onHelpfulToggle={mockOnHelpfulToggle}
            currentUserId="user-2"
          />
        </MockThemeProvider>
      );

      expect(getByText('Top Review')).toBeTruthy();
    });

    it('should handle exactly 10 reviews for Frequent Reviewer badge', () => {
      const review = createMockReview({
        reviewer_stats: {
          total_reviews: 10,
          total_helpful_votes: 5,
          helpful_ratio: 50,
        },
      });

      const { getByText } = render(
        <MockThemeProvider>
          <ReviewCard
            review={review}
            onHelpfulToggle={mockOnHelpfulToggle}
            currentUserId="user-2"
          />
        </MockThemeProvider>
      );

      expect(getByText('Frequent Reviewer')).toBeTruthy();
    });
  });
});
