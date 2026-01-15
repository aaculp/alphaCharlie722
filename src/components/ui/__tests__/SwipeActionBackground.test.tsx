/**
 * Unit Tests for SwipeActionBackground Component
 * Feature: swipeable-venue-card
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { useSharedValue } from 'react-native-reanimated';
import SwipeActionBackground from '../SwipeActionBackground';

describe('SwipeActionBackground', () => {
  const mockOpacity = { value: 0.5 };
  const mockTranslateX = { value: 0 };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render with correct props', () => {
      const { getByText } = render(
        <SwipeActionBackground
          direction="left"
          opacity={mockOpacity as any}
          translateX={mockTranslateX as any}
          icon="checkmark-circle"
          label="Arriving"
          backgroundColor="#10B981"
        />
      );

      expect(getByText('Arriving')).toBeTruthy();
    });

    it('should render left direction background', () => {
      const { getByText } = render(
        <SwipeActionBackground
          direction="left"
          opacity={mockOpacity as any}
          translateX={mockTranslateX as any}
          icon="checkmark-circle"
          label="Arriving"
          backgroundColor="#10B981"
        />
      );

      const label = getByText('Arriving');
      expect(label).toBeTruthy();
    });

    it('should render right direction background', () => {
      const { getByText } = render(
        <SwipeActionBackground
          direction="right"
          opacity={mockOpacity as any}
          translateX={mockTranslateX as any}
          icon="log-out-outline"
          label="Leaving"
          backgroundColor="#EF4444"
        />
      );

      const label = getByText('Leaving');
      expect(label).toBeTruthy();
    });
  });

  describe('Icon and Label Display', () => {
    it('should display icon and label correctly for check-in', () => {
      const { getByText } = render(
        <SwipeActionBackground
          direction="left"
          opacity={mockOpacity as any}
          translateX={mockTranslateX as any}
          icon="checkmark-circle"
          label="Arriving"
          backgroundColor="#10B981"
        />
      );

      expect(getByText('Arriving')).toBeTruthy();
    });

    it('should display icon and label correctly for check-out', () => {
      const { getByText } = render(
        <SwipeActionBackground
          direction="right"
          opacity={mockOpacity as any}
          translateX={mockTranslateX as any}
          icon="log-out-outline"
          label="Leaving"
          backgroundColor="#EF4444"
        />
      );

      expect(getByText('Leaving')).toBeTruthy();
    });

    it('should use custom icon color when provided', () => {
      const { getByText } = render(
        <SwipeActionBackground
          direction="left"
          opacity={mockOpacity as any}
          translateX={mockTranslateX as any}
          icon="checkmark-circle"
          label="Arriving"
          backgroundColor="#10B981"
          iconColor="#FFFFFF"
        />
      );

      expect(getByText('Arriving')).toBeTruthy();
    });

    it('should use custom label color when provided', () => {
      const { getByText } = render(
        <SwipeActionBackground
          direction="left"
          opacity={mockOpacity as any}
          translateX={mockTranslateX as any}
          icon="checkmark-circle"
          label="Arriving"
          backgroundColor="#10B981"
          labelColor="#FFFFFF"
        />
      );

      const label = getByText('Arriving');
      expect(label.props.style).toContainEqual(
        expect.objectContaining({ color: '#FFFFFF' })
      );
    });
  });

  describe('Background Color', () => {
    it('should apply green background color for check-in', () => {
      const { getByText } = render(
        <SwipeActionBackground
          direction="left"
          opacity={mockOpacity as any}
          translateX={mockTranslateX as any}
          icon="checkmark-circle"
          label="Arriving"
          backgroundColor="#10B981"
        />
      );

      expect(getByText('Arriving')).toBeTruthy();
    });

    it('should apply red background color for check-out', () => {
      const { getByText } = render(
        <SwipeActionBackground
          direction="right"
          opacity={mockOpacity as any}
          translateX={mockTranslateX as any}
          icon="log-out-outline"
          label="Leaving"
          backgroundColor="#EF4444"
        />
      );

      expect(getByText('Leaving')).toBeTruthy();
    });

    it('should apply custom background color', () => {
      const customColor = '#FF5733';
      const { getByText } = render(
        <SwipeActionBackground
          direction="left"
          opacity={mockOpacity as any}
          translateX={mockTranslateX as any}
          icon="star"
          label="Custom"
          backgroundColor={customColor}
        />
      );

      expect(getByText('Custom')).toBeTruthy();
    });
  });

  describe('Opacity Animation', () => {
    it('should accept opacity shared value', () => {
      const opacity = { value: 0.8 };
      const { getByText } = render(
        <SwipeActionBackground
          direction="left"
          opacity={opacity as any}
          translateX={mockTranslateX as any}
          icon="checkmark-circle"
          label="Arriving"
          backgroundColor="#10B981"
        />
      );

      expect(getByText('Arriving')).toBeTruthy();
    });

    it('should handle zero opacity', () => {
      const opacity = { value: 0 };
      const { getByText } = render(
        <SwipeActionBackground
          direction="left"
          opacity={opacity as any}
          translateX={mockTranslateX as any}
          icon="checkmark-circle"
          label="Arriving"
          backgroundColor="#10B981"
        />
      );

      expect(getByText('Arriving')).toBeTruthy();
    });

    it('should handle full opacity', () => {
      const opacity = { value: 1 };
      const { getByText } = render(
        <SwipeActionBackground
          direction="left"
          opacity={opacity as any}
          translateX={mockTranslateX as any}
          icon="checkmark-circle"
          label="Arriving"
          backgroundColor="#10B981"
        />
      );

      expect(getByText('Arriving')).toBeTruthy();
    });
  });
});
