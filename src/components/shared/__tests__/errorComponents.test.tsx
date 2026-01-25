/**
 * Unit tests for error UI components
 * 
 * Tests Requirements 10.2, 10.3, 10.5:
 * - Error message display
 * - Stale data indicator
 * - Pull-to-refresh
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QueryErrorDisplay } from '../QueryErrorDisplay';
import { StaleDataIndicator } from '../StaleDataIndicator';
import { QueryRefreshControl } from '../QueryRefreshControl';
import { MutationErrorToast } from '../MutationErrorToast';

// Mock ThemeContext
jest.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        primary: '#007AFF',
        error: '#FF3B30',
        warning: '#FF9500',
        surface: '#FFFFFF',
        text: '#000000',
        textSecondary: '#666666',
        border: '#E5E5E5',
      },
    },
  }),
}));

describe('Error UI Components', () => {
  describe('QueryErrorDisplay (Requirement 10.2)', () => {
    it('should render error message', () => {
      const error = new Error('Failed to fetch data');
      const { getByText } = render(
        <QueryErrorDisplay error={error} />
      );

      expect(getByText('Unable to Load Data')).toBeTruthy();
      expect(getByText('Failed to fetch data')).toBeTruthy();
    });

    it('should render custom error message', () => {
      const error = new Error('Network error');
      const { getByText } = render(
        <QueryErrorDisplay error={error} message="Custom error message" />
      );

      expect(getByText('Custom error message')).toBeTruthy();
    });

    it('should render retry button when onRetry is provided', () => {
      const error = new Error('Failed to fetch');
      const onRetry = jest.fn();
      const { getByText } = render(
        <QueryErrorDisplay error={error} onRetry={onRetry} />
      );

      expect(getByText('Try Again')).toBeTruthy();
    });

    it('should call onRetry when retry button is pressed', () => {
      const error = new Error('Failed to fetch');
      const onRetry = jest.fn();
      const { getByText } = render(
        <QueryErrorDisplay error={error} onRetry={onRetry} />
      );

      fireEvent.press(getByText('Try Again'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should not render retry button when onRetry is not provided', () => {
      const error = new Error('Failed to fetch');
      const { queryByText } = render(
        <QueryErrorDisplay error={error} />
      );

      expect(queryByText('Try Again')).toBeNull();
    });

    it('should render default message when error is null', () => {
      const { getByText } = render(
        <QueryErrorDisplay error={null} />
      );

      expect(getByText('Something went wrong')).toBeTruthy();
    });
  });

  describe('StaleDataIndicator (Requirement 10.3)', () => {
    it('should render stale data message', () => {
      const { getByText } = render(
        <StaleDataIndicator />
      );

      expect(getByText('Data may be outdated')).toBeTruthy();
    });

    it('should render custom message', () => {
      const { getByText } = render(
        <StaleDataIndicator message="Custom stale message" />
      );

      expect(getByText('Custom stale message')).toBeTruthy();
    });

    it('should render refresh button when onRefresh is provided', () => {
      const onRefresh = jest.fn();
      const { getByText } = render(
        <StaleDataIndicator onRefresh={onRefresh} />
      );

      expect(getByText('Refresh')).toBeTruthy();
    });

    it('should call onRefresh when refresh button is pressed', () => {
      const onRefresh = jest.fn();
      const { getByText } = render(
        <StaleDataIndicator onRefresh={onRefresh} />
      );

      fireEvent.press(getByText('Refresh'));
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('should not render refresh button when onRefresh is not provided', () => {
      const { queryByText } = render(
        <StaleDataIndicator />
      );

      expect(queryByText('Refresh')).toBeNull();
    });
  });

  describe('QueryRefreshControl (Requirement 10.5)', () => {
    it('should render RefreshControl with correct props', () => {
      const onRefresh = jest.fn();
      const { UNSAFE_getByType } = render(
        <QueryRefreshControl isRefetching={false} onRefresh={onRefresh} />
      );

      const refreshControl = UNSAFE_getByType('RCTRefreshControl');
      expect(refreshControl).toBeTruthy();
    });

    it('should pass isRefetching as refreshing prop', () => {
      const onRefresh = jest.fn();
      const { UNSAFE_getByProps } = render(
        <QueryRefreshControl isRefetching={true} onRefresh={onRefresh} />
      );

      // RefreshControl should have refreshing prop set to true
      const refreshControl = UNSAFE_getByProps({ refreshing: true });
      expect(refreshControl).toBeTruthy();
    });

    it('should provide onRefresh callback', () => {
      const onRefresh = jest.fn();
      const { UNSAFE_getByProps } = render(
        <QueryRefreshControl isRefetching={false} onRefresh={onRefresh} />
      );

      // RefreshControl should have onRefresh prop
      const refreshControl = UNSAFE_getByProps({ onRefresh });
      expect(refreshControl).toBeTruthy();
    });
  });

  describe('MutationErrorToast (Requirement 10.2)', () => {
    it('should render error message when visible', () => {
      const error = new Error('Mutation failed');
      const { getByText } = render(
        <MutationErrorToast
          error={error}
          visible={true}
          onDismiss={jest.fn()}
        />
      );

      expect(getByText('Mutation failed')).toBeTruthy();
    });

    it('should not render when not visible', () => {
      const error = new Error('Mutation failed');
      const { queryByText } = render(
        <MutationErrorToast
          error={error}
          visible={false}
          onDismiss={jest.fn()}
        />
      );

      // Component should not be rendered initially when not visible
      expect(queryByText('Mutation failed')).toBeNull();
    });

    it('should call onDismiss when dismiss button is pressed', async () => {
      const error = new Error('Mutation failed');
      const onDismiss = jest.fn();
      const { getByText } = render(
        <MutationErrorToast
          error={error}
          visible={true}
          onDismiss={onDismiss}
        />
      );

      const dismissButton = getByText('✕');
      fireEvent.press(dismissButton);
      
      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 250));
      
      expect(onDismiss).toHaveBeenCalled();
    });

    it('should render default message when error is null', () => {
      const { getByText } = render(
        <MutationErrorToast
          error={null}
          visible={true}
          onDismiss={jest.fn()}
        />
      );

      expect(getByText('An error occurred')).toBeTruthy();
    });
  });
});
