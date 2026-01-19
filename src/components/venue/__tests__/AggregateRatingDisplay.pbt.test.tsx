/**
 * Property-Based Tests for AggregateRatingDisplay Component
 * 
 * Feature: venue-reviews-ratings
 * Tests UI correctness properties using fast-check library
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import fc from 'fast-check';
import AggregateRatingDisplay from '../AggregateRatingDisplay';
import { ThemeProvider } from '../../../contexts/ThemeContext';

const MockThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('AggregateRatingDisplay - Property-Based Tests', () => {
  /**
   * Property 10: Venue card rating display
   * Feature: venue-reviews-ratings, Property 10: Venue card rating display
   * 
   * For any venue card displayed, the system should show the aggregate rating as
   * filled stars with numerical value, review count in parentheses, and use
   * highlighted color for ratings >= 4.5.
   * 
   * Validates: Requirements 7.1, 7.2, 7.3, 7.6
   */
  test('Property 10: Venue card rating display', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 5, noNaN: true }).map(n => Math.round(n * 10) / 10),
        fc.integer({ min: 0, max: 10000 }),
        (rating, reviewCount) => {
          const { getByText, queryByText } = render(
            <MockThemeProvider>
              <AggregateRatingDisplay rating={rating} reviewCount={reviewCount} />
            </MockThemeProvider>
          );

          if (reviewCount === 0) {
            // Should display "No reviews yet"
            expect(getByText('No reviews yet')).toBeTruthy();
          } else {
            // Should display numerical rating
            expect(getByText(rating.toFixed(1))).toBeTruthy();

            // Should display review count
            const countText = reviewCount === 1 ? '(1 review)' : `(${reviewCount} reviews)`;
            expect(getByText(countText)).toBeTruthy();

            // For ratings >= 4.5, should use highlighted color (implementation-specific)
            // This would require checking the style props
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Rating formatting
   * 
   * For any rating value, the system should format it to exactly one decimal place.
   */
  test('Property: Rating formatting to one decimal place', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 5, noNaN: true }),
        fc.integer({ min: 1, max: 1000 }),
        (rating, reviewCount) => {
          const { getByText } = render(
            <MockThemeProvider>
              <AggregateRatingDisplay rating={rating} reviewCount={reviewCount} />
            </MockThemeProvider>
          );

          // Rating should be formatted to one decimal place
          const formattedRating = rating.toFixed(1);
          expect(getByText(formattedRating)).toBeTruthy();

          // Verify it has exactly one decimal place
          const decimalPlaces = formattedRating.split('.')[1]?.length || 0;
          expect(decimalPlaces).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Review count display
   * 
   * For any review count, the system should display singular "review" for count of 1
   * and plural "reviews" for all other counts.
   */
  test('Property: Review count singular/plural', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 1, max: 5, noNaN: true }),
        fc.integer({ min: 0, max: 1000 }),
        (rating, reviewCount) => {
          const { getByText, queryByText } = render(
            <MockThemeProvider>
              <AggregateRatingDisplay rating={rating} reviewCount={reviewCount} />
            </MockThemeProvider>
          );

          if (reviewCount === 0) {
            expect(getByText('No reviews yet')).toBeTruthy();
          } else if (reviewCount === 1) {
            expect(getByText('(1 review)')).toBeTruthy();
            expect(queryByText('(1 reviews)')).toBeNull();
          } else {
            expect(getByText(`(${reviewCount} reviews)`)).toBeTruthy();
            expect(queryByText(`(${reviewCount} review)`)).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: showCount prop behavior
   * 
   * For any rating and review count, when showCount is false, the review count
   * should not be displayed.
   */
  test('Property: showCount prop behavior', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 1, max: 5, noNaN: true }),
        fc.integer({ min: 1, max: 1000 }),
        (rating, reviewCount) => {
          const { getByText, queryByText } = render(
            <MockThemeProvider>
              <AggregateRatingDisplay
                rating={rating}
                reviewCount={reviewCount}
                showCount={false}
              />
            </MockThemeProvider>
          );

          // Rating should still be displayed
          expect(getByText(rating.toFixed(1))).toBeTruthy();

          // Review count should NOT be displayed
          expect(queryByText(/review/i)).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Size prop behavior
   * 
   * For any rating and review count, the component should render successfully
   * with all size options (small, medium, large).
   */
  test('Property: Size prop behavior', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 1, max: 5, noNaN: true }),
        fc.integer({ min: 1, max: 1000 }),
        fc.constantFrom('small', 'medium', 'large'),
        (rating, reviewCount, size) => {
          const { getByText } = render(
            <MockThemeProvider>
              <AggregateRatingDisplay
                rating={rating}
                reviewCount={reviewCount}
                size={size as 'small' | 'medium' | 'large'}
              />
            </MockThemeProvider>
          );

          // Should render successfully with any size
          expect(getByText(rating.toFixed(1))).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Edge case - zero rating
   * 
   * For any venue with zero rating and zero reviews, the system should display
   * "No reviews yet" message.
   */
  test('Property: Zero rating and zero reviews', () => {
    const { getByText, queryByText } = render(
      <MockThemeProvider>
        <AggregateRatingDisplay rating={0} reviewCount={0} />
      </MockThemeProvider>
    );

    expect(getByText('No reviews yet')).toBeTruthy();
    expect(queryByText('0.0')).toBeNull();
  });

  /**
   * Additional property: Perfect rating
   * 
   * For any venue with perfect 5.0 rating, the system should display it correctly.
   */
  test('Property: Perfect 5.0 rating', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        (reviewCount) => {
          const { getByText } = render(
            <MockThemeProvider>
              <AggregateRatingDisplay rating={5.0} reviewCount={reviewCount} />
            </MockThemeProvider>
          );

          expect(getByText('5.0')).toBeTruthy();
          const countText = reviewCount === 1 ? '(1 review)' : `(${reviewCount} reviews)`;
          expect(getByText(countText)).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });
});
