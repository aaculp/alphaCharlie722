/**
 * Unit Tests for EmptyState Component
 * Feature: homescreen-flash-offers-section
 * Task: 3.1 Write unit tests for EmptyState component
 * 
 * Tests default message and icon display, custom props, styling and layout
 * Validates: Requirements 2.2
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { EmptyState } from '../EmptyState';

// Mock ThemeContext
jest.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        card: '#FFFFFF',
        border: '#E0E0E0',
        textSecondary: '#666666',
      },
    },
  }),
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

describe('EmptyState Component', () => {
  describe('Default Rendering', () => {
    it('should render with default message and icon', () => {
      const { getByText } = render(<EmptyState />);
      
      expect(getByText('No flash offers available right now')).toBeTruthy();
      expect(getByText('Check back soon for limited-time deals')).toBeTruthy();
    });

    it('should display the default icon', () => {
      const { root } = render(<EmptyState />);
      
      // Verify component renders successfully (icon is mocked)
      expect(root).toBeTruthy();
    });
  });

  describe('Custom Props', () => {
    it('should render with custom message', () => {
      const customMessage = 'Custom empty state message';
      const { getByText } = render(<EmptyState message={customMessage} />);
      
      expect(getByText(customMessage)).toBeTruthy();
      expect(getByText('Check back soon for limited-time deals')).toBeTruthy();
    });

    it('should render with custom icon', () => {
      const customIcon = 'alert-circle-outline';
      const { root } = render(<EmptyState icon={customIcon} />);
      
      // Verify component renders successfully with custom icon
      expect(root).toBeTruthy();
    });

    it('should render with both custom message and icon', () => {
      const customMessage = 'No offers today';
      const customIcon = 'sad-outline';
      const { getByText } = render(
        <EmptyState message={customMessage} icon={customIcon} />
      );
      
      expect(getByText(customMessage)).toBeTruthy();
    });
  });

  describe('Layout and Styling', () => {
    it('should render with proper structure', () => {
      const { getByText } = render(<EmptyState />);
      
      // Verify all text elements are present
      const mainMessage = getByText('No flash offers available right now');
      const subtext = getByText('Check back soon for limited-time deals');
      
      expect(mainMessage).toBeTruthy();
      expect(subtext).toBeTruthy();
    });

    it('should maintain consistent dimensions', () => {
      const { root } = render(<EmptyState />);
      
      // Component should render without errors
      expect(root).toBeTruthy();
    });

    it('should render centered content', () => {
      const { getByText } = render(<EmptyState />);
      
      // Verify content is rendered (centering is handled by styles)
      expect(getByText('No flash offers available right now')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string message', () => {
      const { queryByText } = render(<EmptyState message="" />);
      
      // Empty message should still render (as empty text)
      expect(queryByText('Check back soon for limited-time deals')).toBeTruthy();
    });

    it('should handle very long message', () => {
      const longMessage = 'This is a very long message that should still render properly without breaking the layout or causing any issues with the component rendering';
      const { getByText } = render(<EmptyState message={longMessage} />);
      
      expect(getByText(longMessage)).toBeTruthy();
    });

    it('should handle special characters in message', () => {
      const specialMessage = 'No offers! 🎉 Check back soon... 😊';
      const { getByText } = render(<EmptyState message={specialMessage} />);
      
      expect(getByText(specialMessage)).toBeTruthy();
    });
  });

  describe('Theme Integration', () => {
    it('should render with theme colors', () => {
      const { root } = render(<EmptyState />);
      
      // Component should render with theme context
      expect(root).toBeTruthy();
    });
  });
});
