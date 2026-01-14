/**
 * Error Handling Tests for NewVenuesSpotlightCarousel
 * 
 * Tests Requirements: 4.5, 10.1, 10.2, 10.3, 10.4, 10.5
 */

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text, TouchableOpacity, Image } from 'react-native';
import NewVenuesSpotlightCarousel from '../NewVenuesSpotlightCarousel';

// Mock the theme context
jest.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        primary: '#007AFF',
        surface: '#FFFFFF',
        border: '#E5E5E5',
        text: '#000000',
        textSecondary: '#666666',
      },
    },
  }),
}));

// Mock the skeleton loader
jest.mock('../../social/SkeletonLoaders', () => ({
  CarouselSkeleton: () => null,
}));

// Mock the venue formatting utilities
jest.mock('../../../utils/formatting/venue', () => ({
  calculateDaysSinceSignup: jest.fn(() => 5),
  formatSignupText: jest.fn(() => 'Joined 5 days ago'),
}));

describe('NewVenuesSpotlightCarousel - Error Handling', () => {
  const mockOnVenuePress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Requirement 4.5, 10.1, 10.2: Error state handling', () => {
    it('should return null when error prop is provided', async () => {
      const error = new Error('Failed to fetch venues');
      
      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={[]}
              onVenuePress={mockOnVenuePress}
              error={error}
            />
          );
        });

        const tree = component!.toJSON();

        // Component should render nothing (null)
        expect(tree).toBeNull();
      } finally {
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
      }
    });

    it('should render normally when error is null', async () => {
      const mockVenue = {
        id: '1',
        name: 'Test Venue',
        category: 'Bar',
        location: 'Test Location',
        rating: 4.5,
        image_url: 'https://example.com/image.jpg',
        latitude: 0,
        longitude: 0,
      };

      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={[mockVenue as any]}
              onVenuePress={mockOnVenuePress}
              error={null}
            />
          );
        });

        const root = component!.root;
        const textComponents = root.findAllByType(Text);
        
        // Find the "New Venues" header text
        const headerText = textComponents.find(
          text => text.props.children === 'New Venues'
        );
        
        expect(headerText).toBeTruthy();
      } finally {
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
      }
    });
  });

  describe('Requirement 10.3, 10.4: Defensive rendering with missing data', () => {
    it('should use defaults for missing venue fields', async () => {
      const incompleteVenue = {
        id: '1',
        // Missing: name, category, location, image_url
      };

      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={[incompleteVenue as any]}
              onVenuePress={mockOnVenuePress}
            />
          );
        });

        const root = component!.root;
        const textComponents = root.findAllByType(Text);
        
        // Find default texts
        const unnamedVenue = textComponents.find(
          text => text.props.children === 'Unnamed Venue'
        );
        const generalCategory = textComponents.find(
          text => text.props.children === 'General'
        );
        const locationNotSpecified = textComponents.find(
          text => text.props.children === 'Location not specified'
        );
        
        expect(unnamedVenue).toBeTruthy();
        expect(generalCategory).toBeTruthy();
        expect(locationNotSpecified).toBeTruthy();
      } finally {
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
      }
    });

    it('should handle null rating gracefully', async () => {
      const venueWithoutRating = {
        id: '1',
        name: 'Test Venue',
        category: 'Bar',
        location: 'Test Location',
        rating: null,
        image_url: 'https://example.com/image.jpg',
      };

      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={[venueWithoutRating as any]}
              onVenuePress={mockOnVenuePress}
            />
          );
        });

        const root = component!.root;
        const textComponents = root.findAllByType(Text);
        
        const noRatingText = textComponents.find(
          text => text.props.children === 'New - No ratings yet'
        );
        
        expect(noRatingText).toBeTruthy();
      } finally {
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
      }
    });

    it('should handle zero rating gracefully', async () => {
      const venueWithZeroRating = {
        id: '1',
        name: 'Test Venue',
        category: 'Bar',
        location: 'Test Location',
        rating: 0,
        image_url: 'https://example.com/image.jpg',
      };

      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={[venueWithZeroRating as any]}
              onVenuePress={mockOnVenuePress}
            />
          );
        });

        const root = component!.root;
        const textComponents = root.findAllByType(Text);
        
        const noRatingText = textComponents.find(
          text => text.props.children === 'New - No ratings yet'
        );
        
        expect(noRatingText).toBeTruthy();
      } finally {
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
      }
    });

    it('should use placeholder image when image_url is missing', async () => {
      const venueWithoutImage = {
        id: '1',
        name: 'Test Venue',
        category: 'Bar',
        location: 'Test Location',
        // Missing: image_url
      };

      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={[venueWithoutImage as any]}
              onVenuePress={mockOnVenuePress}
            />
          );
        });

        const root = component!.root;
        const images = root.findAllByType(Image);
        
        // Find the venue image (not the icon)
        const venueImage = images.find(
          img => img.props.source?.uri === 'https://via.placeholder.com/300x150'
        );
        
        expect(venueImage).toBeTruthy();
      } finally {
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
      }
    });
  });

  describe('Requirement 10.5: Navigation validation', () => {
    it('should not call onVenuePress when venue ID is missing', async () => {
      const venueWithoutId = {
        name: 'Test Venue',
        category: 'Bar',
        location: 'Test Location',
      };

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={[venueWithoutId as any]}
              onVenuePress={mockOnVenuePress}
            />
          );
        });

        const root = component!.root;
        const touchables = root.findAllByType(TouchableOpacity);
        
        // Find the venue card touchable (not the header)
        const venueCard = touchables.find(
          t => t.props.accessibilityLabel === 'Test Venue, new venue'
        );
        
        expect(venueCard).toBeTruthy();
        
        // Simulate press
        venueCard!.props.onPress();

        expect(mockOnVenuePress).not.toHaveBeenCalled();
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'Cannot navigate: venue ID is missing',
          venueWithoutId
        );
      } finally {
        consoleWarnSpy.mockRestore();
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
      }
    });
  });
});
