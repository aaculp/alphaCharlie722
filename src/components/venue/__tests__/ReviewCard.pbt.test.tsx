/**
 * Property-Based Tests for ReviewCard Component
 * 
 * Feature: venue-reviews-ratings
 * Tests UI correctness properties using fast-check library
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import fc from 'fast-check';
import ReviewCard from '../ReviewCard';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import type { ReviewWithReviewer } from '../../../types';

const MockThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('ReviewCard - Property-Based Tests', () => {
  /**
   * Property 7: Review display completeness
   * Feature: venue-reviews-ratings, Property 7: Review display completeness
   * 
   * For any review displayed in the UI, the system should show all required fields:
   * reviewer name, profile picture, rating (as stars), review text (if present),
   * timestamp, helpful button with count, and verified badge (if applicable).
   * 
   * Validates: Requirements 3.6, 3.7, 5.1, 8.2
   */
  test('Property 7: Review display completeness', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          venue_id: fc.uuid(),
          user_id: fc.uuid(),
          rating: fc.integer({ min: 1, max: 5 }),
          review_text: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
          is_verified: fc.boolean(),
          helpful_count: fc.integer({ min: 0, max: 1000 }),
          created_at: fc.date().map(d => d.toISOString()),
          updated_at: fc.date().map(d => d.toISOString()),
          reviewer: fc.record({
            id: fc.uuid(),
            display_name: fc.string({ minLength: 1, maxLength: 50 }),
          }),
        }),
        (review) => {
          const mockOnHelpfulToggle = jest.fn();
          
          const { getByText, queryByText } = render(
            <MockThemeProvider>
              <ReviewCard
                review={review as ReviewWithReviewer}
                onHelpfulToggle={mockOnHelpfulToggle}
              />
            </MockThemeProvider>
          );

          // Reviewer name should be displayed
          expect(getByText(review.reviewer.display_name)).toBeTruthy();

          // Review text should be displayed if present
          if (review.review_text) {
            expect(getByText(review.review_text)).toBeTruthy();
          }

          // Helpful count should be displayed
          expect(getByText(new RegExp(review.helpful_count.toString()))).toBeTruthy();

          // Verified badge should be displayed if is_verified = true
          if (review.is_verified) {
            expect(queryByText(/Verified/i)).toBeTruthy();
          } else {
            expect(queryByText(/Verified/i)).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 27: Review quality badges
   * Feature: venue-reviews-ratings, Property 27: Review quality badges
   * 
   * For any review, the system should display a "Detailed Review" badge if review_text
   * length >= 200 characters, a "Top Review" badge if helpful_count >= 10, and should
   * display reviewer badges ("Frequent Reviewer" if user has 10+ reviews, "Trusted Reviewer"
   * if helpful vote ratio > 70%).
   * 
   * Validates: Requirements 16.1, 16.2, 16.3, 16.4
   */
  test('Property 27: Review quality badges', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          venue_id: fc.uuid(),
          user_id: fc.uuid(),
          rating: fc.integer({ min: 1, max: 5 }),
          review_text: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: undefined }),
          is_verified: fc.boolean(),
          helpful_count: fc.integer({ min: 0, max: 100 }),
          created_at: fc.date().map(d => d.toISOString()),
          updated_at: fc.date().map(d => d.toISOString()),
          reviewer: fc.record({
            id: fc.uuid(),
            display_name: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          reviewer_stats: fc.option(
            fc.record({
              total_reviews: fc.integer({ min: 0, max: 100 }),
              total_helpful_votes: fc.integer({ min: 0, max: 500 }),
              helpful_ratio: fc.integer({ min: 0, max: 100 }),
            }),
            { nil: undefined }
          ),
        }),
        (review) => {
          const mockOnHelpfulToggle = jest.fn();
          
          const { queryByText } = render(
            <MockThemeProvider>
              <ReviewCard
                review={review as ReviewWithReviewer}
                onHelpfulToggle={mockOnHelpfulToggle}
              />
            </MockThemeProvider>
          );

          // Detailed Review badge: review_text length >= 200
          const hasDetailedBadge = review.review_text && review.review_text.length >= 200;
          if (hasDetailedBadge) {
            expect(queryByText('Detailed Review')).toBeTruthy();
          } else {
            expect(queryByText('Detailed Review')).toBeNull();
          }

          // Top Review badge: helpful_count >= 10
          const hasTopBadge = review.helpful_count >= 10;
          if (hasTopBadge) {
            expect(queryByText('Top Review')).toBeTruthy();
          } else {
            expect(queryByText('Top Review')).toBeNull();
          }

          // Frequent Reviewer badge: total_reviews >= 10
          const hasFrequentBadge = review.reviewer_stats && review.reviewer_stats.total_reviews >= 10;
          if (hasFrequentBadge) {
            expect(queryByText('Frequent Reviewer')).toBeTruthy();
          } else {
            expect(queryByText('Frequent Reviewer')).toBeNull();
          }

          // Trusted Reviewer badge: helpful_ratio > 70
          const hasTrustedBadge = review.reviewer_stats && review.reviewer_stats.helpful_ratio > 70;
          if (hasTrustedBadge) {
            expect(queryByText('Trusted Reviewer')).toBeTruthy();
          } else {
            expect(queryByText('Trusted Reviewer')).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
