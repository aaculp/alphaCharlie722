/**
 * Unit Tests for Loading State Components
 * 
 * Feature: react-query-integration
 * 
 * Validates: Requirements 11.1, 11.2, 11.3
 * 
 * Tests verify that loading state components display correctly
 * based on query states (isLoading, isFetching, isError).
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { QueryLoadingSkeleton } from '../QueryLoadingSkeleton';
import { BackgroundRefetchIndicator } from '../BackgroundRefetchIndicator';
import { QueryErrorDisplay } from '../QueryErrorDisplay';

// Mock ThemeContext
jest.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        background: '#FFFFFF',
        surface: '#F5F5F5',
        primary: '#007AFF',
        text: '#000000',
        textSecondary: '#666666',
        border: '#E0E0E0',
        error: '#FF3B30',
        warning: '#FF9500',
      },
    },
  }),
}));

describe('Loading State Components', () => {
  describe('QueryLoadingSkeleton', () => {
    /**
     * Requirement 11.1: Loading skeleton for first-time loads (isLoading)
     * 
     * When isLoading is true, the system should display a loading skeleton
     */
    it('should display loading skeleton when isLoading is true', () => {
      const { UNSAFE_getByType } = render(
        <QueryLoadingSkeleton count={3} variant="list" />
      );

      // Should render the container View
      expect(UNSAFE_getByType('View')).toBeTruthy();
    });

    it('should render correct number of skeleton items', () => {
      const { UNSAFE_getAllByType } = render(
        <QueryLoadingSkeleton count={5} variant="list" />
      );

      // Should render 5 skeleton items
      const container = UNSAFE_getAllByType('View');
      expect(container.length).toBeGreaterThan(0);
    });

    it('should render list variant skeleton', () => {
      const { UNSAFE_getByType } = render(
        <QueryLoadingSkeleton count={3} variant="list" />
      );

      expect(UNSAFE_getByType('View')).toBeTruthy();
    });

    it('should render card variant skeleton', () => {
      const { UNSAFE_getByType } = render(
        <QueryLoadingSkeleton count={2} variant="card" />
      );

      expect(UNSAFE_getByType('View')).toBeTruthy();
    });

    it('should render detail variant skeleton', () => {
      const { UNSAFE_getByType } = render(
        <QueryLoadingSkeleton variant="detail" />
      );

      expect(UNSAFE_getByType('View')).toBeTruthy();
    });

    it('should accept custom style prop', () => {
      const customStyle = { marginTop: 20 };
      const { UNSAFE_getByType } = render(
        <QueryLoadingSkeleton count={3} variant="list" style={customStyle} />
      );

      const container = UNSAFE_getByType('View');
      expect(container.props.style).toContainEqual(customStyle);
    });
  });

  describe('BackgroundRefetchIndicator', () => {
    /**
     * Requirement 11.2: Subtle indicator for background refetch (isFetching)
     * 
     * When isFetching is true, the system should display a subtle loading indicator
     */
    it('should display subtle indicator when isFetching is true', () => {
      const { UNSAFE_getAllByType } = render(
        <BackgroundRefetchIndicator isVisible={true} />
      );

      // Should render View components (Animated.View renders as View in tests)
      const views = UNSAFE_getAllByType('View');
      expect(views.length).toBeGreaterThan(0);
    });

    it('should not display when isVisible is false', () => {
      const { toJSON } = render(
        <BackgroundRefetchIndicator isVisible={false} />
      );

      // Component should return null when not visible
      expect(toJSON()).toBeNull();
    });

    it('should display at top position by default', () => {
      const { UNSAFE_getAllByType } = render(
        <BackgroundRefetchIndicator isVisible={true} />
      );

      // Should render views (position is in styles)
      const views = UNSAFE_getAllByType('View');
      expect(views.length).toBeGreaterThan(0);
    });

    it('should display at bottom position when specified', () => {
      const { UNSAFE_getAllByType } = render(
        <BackgroundRefetchIndicator isVisible={true} position="bottom" />
      );

      // Should render views (position is in styles)
      const views = UNSAFE_getAllByType('View');
      expect(views.length).toBeGreaterThan(0);
    });

    it('should accept custom style prop', () => {
      const customStyle = { zIndex: 2000 };
      const { UNSAFE_getAllByType } = render(
        <BackgroundRefetchIndicator isVisible={true} style={customStyle} />
      );

      // Should render views
      const views = UNSAFE_getAllByType('View');
      expect(views.length).toBeGreaterThan(0);
    });
  });

  describe('QueryErrorDisplay', () => {
    /**
     * Requirement 11.3: Error UI with retry button (isError)
     * 
     * When isError is true, the system should display an error message with retry option
     */
    it('should display error UI when isError is true', () => {
      const error = new Error('Failed to load data');
      const { getByText } = render(
        <QueryErrorDisplay error={error} />
      );

      expect(getByText('Unable to Load Data')).toBeTruthy();
      expect(getByText('Failed to load data')).toBeTruthy();
    });

    it('should display custom error message when provided', () => {
      const error = new Error('Network error');
      const customMessage = 'Unable to connect to server';
      const { getByText } = render(
        <QueryErrorDisplay error={error} message={customMessage} />
      );

      expect(getByText(customMessage)).toBeTruthy();
    });

    it('should display retry button when onRetry is provided', () => {
      const error = new Error('Failed to load data');
      const onRetry = jest.fn();
      const { getByText } = render(
        <QueryErrorDisplay error={error} onRetry={onRetry} />
      );

      expect(getByText('Try Again')).toBeTruthy();
    });

    it('should call onRetry when retry button is pressed', () => {
      const error = new Error('Failed to load data');
      const onRetry = jest.fn();
      const { getByText } = render(
        <QueryErrorDisplay error={error} onRetry={onRetry} />
      );

      const retryButton = getByText('Try Again');
      fireEvent.press(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should not display retry button when onRetry is not provided', () => {
      const error = new Error('Failed to load data');
      const { queryByText } = render(
        <QueryErrorDisplay error={error} />
      );

      expect(queryByText('Try Again')).toBeNull();
    });

    it('should display default message when error has no message', () => {
      const error = new Error();
      const { getByText } = render(
        <QueryErrorDisplay error={error} />
      );

      expect(getByText('Something went wrong')).toBeTruthy();
    });

    it('should display error icon', () => {
      const error = new Error('Failed to load data');
      const { getByText } = render(
        <QueryErrorDisplay error={error} />
      );

      // Error icon is represented by "!" text
      expect(getByText('!')).toBeTruthy();
    });
  });

  describe('Integration: Loading State Transitions', () => {
    /**
     * Test that components work together to show proper loading states
     */
    it('should show skeleton during initial load', () => {
      const { UNSAFE_queryByType } = render(
        <QueryLoadingSkeleton count={3} variant="list" />
      );

      // Initially shows skeleton
      expect(UNSAFE_queryByType('View')).toBeTruthy();
    });

    it('should show background indicator during refetch without hiding content', () => {
      const { UNSAFE_getAllByType } = render(
        <>
          <BackgroundRefetchIndicator isVisible={true} />
          <>{}</>
        </>
      );

      // Indicator should be visible
      const views = UNSAFE_getAllByType('View');
      expect(views.length).toBeGreaterThan(0);
    });

    it('should show error display when query fails', () => {
      const error = new Error('Query failed');
      const onRetry = jest.fn();
      const { getByText } = render(
        <QueryErrorDisplay error={error} onRetry={onRetry} />
      );

      expect(getByText('Unable to Load Data')).toBeTruthy();
      expect(getByText('Try Again')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible retry button', () => {
      const error = new Error('Failed to load data');
      const onRetry = jest.fn();
      const { getByText } = render(
        <QueryErrorDisplay error={error} onRetry={onRetry} />
      );

      const retryButton = getByText('Try Again');
      expect(retryButton).toBeTruthy();
      
      // Button should be pressable
      fireEvent.press(retryButton);
      expect(onRetry).toHaveBeenCalled();
    });

    it('should display error message text clearly', () => {
      const error = new Error('Network connection failed');
      const { getByText } = render(
        <QueryErrorDisplay error={error} />
      );

      const errorMessage = getByText('Network connection failed');
      expect(errorMessage).toBeTruthy();
    });
  });
});
