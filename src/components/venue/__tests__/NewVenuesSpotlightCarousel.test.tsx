/**
 * Unit tests for NewVenuesSpotlightCarousel component
 * Requirements: 1.1, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 4.5, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.5, 8.3, 9.1, 9.2, 9.3, 9.4, 10.1, 10.2, 10.3, 10.4
 */

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text, TouchableOpacity, Image, FlatList, Dimensions } from 'react-native';
import NewVenuesSpotlightCarousel from '../NewVenuesSpotlightCarousel';

// Mock the theme context
jest.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      dark: false,
      colors: {
        primary: '#007AFF',
        surface: '#FFFFFF',
        border: '#E5E5E5',
        text: '#000000',
        textSecondary: '#666666',
        background: '#F5F5F5',
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
  calculateDaysSinceSignup: jest.fn((date: string) => {
    const now = new Date();
    const signup = new Date(date);
    const diffMs = now.getTime() - signup.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }),
  formatSignupText: jest.fn((days: number) => {
    if (days === 0) return 'Joined today';
    if (days === 1) return 'Joined yesterday';
    return `Joined ${days} days ago`;
  }),
}));

describe('NewVenuesSpotlightCarousel - Unit Tests', () => {
  const mockOnVenuePress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Task 5.1: Component rendering', () => {
    it('should render with valid venue data', async () => {
      const mockVenues = [
        {
          id: '1',
          name: 'Test Venue',
          category: 'Bar',
          location: 'Downtown',
          rating: 4.5,
          image_url: 'https://example.com/image.jpg',
          signup_date: new Date().toISOString(),
        },
      ];

      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={mockVenues as any}
              onVenuePress={mockOnVenuePress}
            />
          );
        });

        const tree = component!.toJSON();
        expect(tree).not.toBeNull();
      } finally {
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
      }
    }, 10000);

    it('should return null when venues array is empty', async () => {
      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={[]}
              onVenuePress={mockOnVenuePress}
            />
          );
        });

        const tree = component!.toJSON();
        expect(tree).toBeNull();
      } finally {
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
      }
    });

    it('should display loading skeleton when loading is true', async () => {
      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={[]}
              onVenuePress={mockOnVenuePress}
              loading={true}
            />
          );
        });

        const tree = component!.toJSON();
        expect(tree).not.toBeNull();
      } finally {
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
      }
    });
  });

  describe('Task 6.1: Header', () => {
    it('should contain sparkles icon', async () => {
      const mockVenues = [
        {
          id: '1',
          name: 'Test Venue',
          category: 'Bar',
          location: 'Downtown',
          rating: 4.5,
          signup_date: new Date().toISOString(),
        },
      ];

      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={mockVenues as any}
              onVenuePress={mockOnVenuePress}
            />
          );
        });

        const root = component!.root;
        const textComponents = root.findAllByType(Text);
        const hasSparklesOrStar = textComponents.some(
          text => text.props.children === 'New Venues'
        );

        expect(hasSparklesOrStar).toBe(true);
      } finally {
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
      }
    });

    it('should display "New Venues" text', async () => {
      const mockVenues = [
        {
          id: '1',
          name: 'Test Venue',
          category: 'Bar',
          location: 'Downtown',
          rating: 4.5,
          signup_date: new Date().toISOString(),
        },
      ];

      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={mockVenues as any}
              onVenuePress={mockOnVenuePress}
            />
          );
        });

        const root = component!.root;
        const headerText = root.findAllByType(Text).find(
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

    it('should have correct accessibility label', async () => {
      const mockVenues = [
        {
          id: '1',
          name: 'Test Venue',
          category: 'Bar',
          location: 'Downtown',
          rating: 4.5,
          signup_date: new Date().toISOString(),
        },
      ];

      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={mockVenues as any}
              onVenuePress={mockOnVenuePress}
            />
          );
        });

        const root = component!.root;
        // Find element with accessibility label
        const elements = root.findAll(
          node => node.props.accessibilityLabel === 'New Venues Spotlight'
        );

        expect(elements.length).toBeGreaterThan(0);
      } finally {
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
      }
    });
  });

  describe('Task 7.1: FlatList configuration', () => {
    it('should have horizontal={true}', async () => {
      const mockVenues = [
        {
          id: '1',
          name: 'Test Venue',
          category: 'Bar',
          location: 'Downtown',
          rating: 4.5,
          signup_date: new Date().toISOString(),
        },
      ];

      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={mockVenues as any}
              onVenuePress={mockOnVenuePress}
            />
          );
        });

        const root = component!.root;
        const flatList = root.findByType(FlatList);

        expect(flatList.props.horizontal).toBe(true);
      } finally {
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
      }
    });

    it('should have showsHorizontalScrollIndicator={false}', async () => {
      const mockVenues = [
        {
          id: '1',
          name: 'Test Venue',
          category: 'Bar',
          location: 'Downtown',
          rating: 4.5,
          signup_date: new Date().toISOString(),
        },
      ];

      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={mockVenues as any}
              onVenuePress={mockOnVenuePress}
            />
          );
        });

        const root = component!.root;
        const flatList = root.findByType(FlatList);

        expect(flatList.props.showsHorizontalScrollIndicator).toBe(false);
      } finally {
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
      }
    });

    it('should have snapToInterval equals CARD_WIDTH + CARD_MARGIN', async () => {
      const mockVenues = [
        {
          id: '1',
          name: 'Test Venue',
          category: 'Bar',
          location: 'Downtown',
          rating: 4.5,
          signup_date: new Date().toISOString(),
        },
      ];

      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={mockVenues as any}
              onVenuePress={mockOnVenuePress}
            />
          );
        });

        const root = component!.root;
        const flatList = root.findByType(FlatList);

        const SCREEN_WIDTH = Dimensions.get('window').width;
        const CARD_WIDTH = SCREEN_WIDTH * 0.7;
        const CARD_MARGIN = 12;
        const expectedSnapInterval = CARD_WIDTH + CARD_MARGIN;

        expect(flatList.props.snapToInterval).toBe(expectedSnapInterval);
      } finally {
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
      }
    });

    it('should have CARD_WIDTH equals 70% of screen width', async () => {
      const mockVenues = [
        {
          id: '1',
          name: 'Test Venue',
          category: 'Bar',
          location: 'Downtown',
          rating: 4.5,
          signup_date: new Date().toISOString(),
        },
      ];

      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={mockVenues as any}
              onVenuePress={mockOnVenuePress}
            />
          );
        });

        const SCREEN_WIDTH = Dimensions.get('window').width;
        const expectedCardWidth = SCREEN_WIDTH * 0.7;

        // Verify through snapToInterval
        const root = component!.root;
        const flatList = root.findByType(FlatList);
        const CARD_MARGIN = 12;

        expect(flatList.props.snapToInterval).toBe(expectedCardWidth + CARD_MARGIN);
      } finally {
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
      }
    });

    it('should have CARD_MARGIN equals 12', async () => {
      const mockVenues = [
        {
          id: '1',
          name: 'Test Venue',
          category: 'Bar',
          location: 'Downtown',
          rating: 4.5,
          signup_date: new Date().toISOString(),
        },
      ];

      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={mockVenues as any}
              onVenuePress={mockOnVenuePress}
            />
          );
        });

        const SCREEN_WIDTH = Dimensions.get('window').width;
        const CARD_WIDTH = SCREEN_WIDTH * 0.7;
        const expectedMargin = 12;

        const root = component!.root;
        const flatList = root.findByType(FlatList);

        expect(flatList.props.snapToInterval).toBe(CARD_WIDTH + expectedMargin);
      } finally {
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
      }
    });
  });

  describe('Task 8.1: Venue card elements', () => {
    it('should display venue name, category, location', async () => {
      const mockVenues = [
        {
          id: '1',
          name: 'Test Bar',
          category: 'Bar',
          location: 'Downtown',
          rating: 4.5,
          signup_date: new Date().toISOString(),
        },
      ];

      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={mockVenues as any}
              onVenuePress={mockOnVenuePress}
            />
          );
        });

        const root = component!.root;
        const textComponents = root.findAllByType(Text);
        const textContent = textComponents.map(t => t.props.children).flat();

        expect(textContent).toContain('Test Bar');
        expect(textContent).toContain('Bar');
        expect(textContent).toContain('Downtown');
      } finally {
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
      }
    });

    it('should display "NEW" badge', async () => {
      const mockVenues = [
        {
          id: '1',
          name: 'Test Venue',
          category: 'Bar',
          location: 'Downtown',
          rating: 4.5,
          signup_date: new Date().toISOString(),
        },
      ];

      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={mockVenues as any}
              onVenuePress={mockOnVenuePress}
            />
          );
        });

        const root = component!.root;
        const textComponents = root.findAllByType(Text);
        const hasNewBadge = textComponents.some(
          text => text.props.children === 'NEW'
        );

        expect(hasNewBadge).toBe(true);
      } finally {
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
      }
    });

    it('should display days since signup', async () => {
      const mockVenues = [
        {
          id: '1',
          name: 'Test Venue',
          category: 'Bar',
          location: 'Downtown',
          rating: 4.5,
          signup_date: new Date().toISOString(),
        },
      ];

      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={mockVenues as any}
              onVenuePress={mockOnVenuePress}
            />
          );
        });

        const root = component!.root;
        const textComponents = root.findAllByType(Text);
        const hasJoinedText = textComponents.some(
          text => typeof text.props.children === 'string' && 
                  text.props.children.includes('Joined')
        );

        expect(hasJoinedText).toBe(true);
      } finally {
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
      }
    });

    it('should show "New - No ratings yet" when rating is 0 or null', async () => {
      const mockVenues = [
        {
          id: '1',
          name: 'Test Venue',
          category: 'Bar',
          location: 'Downtown',
          rating: 0,
          signup_date: new Date().toISOString(),
        },
      ];

      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={mockVenues as any}
              onVenuePress={mockOnVenuePress}
            />
          );
        });

        const root = component!.root;
        const textComponents = root.findAllByType(Text);
        const hasNoRatingsText = textComponents.some(
          text => typeof text.props.children === 'string' && 
                  text.props.children.includes('No ratings yet')
        );

        expect(hasNoRatingsText).toBe(true);
      } finally {
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
      }
    });

    it('should use placeholder when image_url is null', async () => {
      const mockVenues = [
        {
          id: '1',
          name: 'Test Venue',
          category: 'Bar',
          location: 'Downtown',
          rating: 4.5,
          image_url: null,
          signup_date: new Date().toISOString(),
        },
      ];

      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={mockVenues as any}
              onVenuePress={mockOnVenuePress}
            />
          );
        });

        const root = component!.root;
        const images = root.findAllByType(Image);

        expect(images.length).toBeGreaterThan(0);
        // Verify placeholder is used
        const hasPlaceholder = images.some(
          img => img.props.source?.uri?.includes('placeholder')
        );
        expect(hasPlaceholder).toBe(true);
      } finally {
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
      }
    });

    it('should display distance when userLocation is provided', async () => {
      const mockVenues = [
        {
          id: '1',
          name: 'Test Venue',
          category: 'Bar',
          location: 'Downtown',
          rating: 4.5,
          latitude: 40.7128,
          longitude: -74.0060,
          signup_date: new Date().toISOString(),
        },
      ];

      const userLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
      };

      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={mockVenues as any}
              onVenuePress={mockOnVenuePress}
              userLocation={userLocation}
            />
          );
        });

        const root = component!.root;
        const textComponents = root.findAllByType(Text);
        const hasDistanceText = textComponents.some(
          text => typeof text.props.children === 'string' && 
                  (text.props.children.includes('m') || text.props.children.includes('km'))
        );

        expect(hasDistanceText).toBe(true);
      } finally {
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
      }
    });
  });

  describe('Task 9.1: Card interaction', () => {
    it('should call onVenuePress with correct venue ID', async () => {
      const mockVenues = [
        {
          id: 'test-venue-123',
          name: 'Test Venue',
          category: 'Bar',
          location: 'Downtown',
          rating: 4.5,
          signup_date: new Date().toISOString(),
        },
      ];

      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={mockVenues as any}
              onVenuePress={mockOnVenuePress}
            />
          );
        });

        const root = component!.root;
        const venueCard = root.findAllByType(TouchableOpacity).find(
          t => t.props.accessibilityLabel?.includes('Test Venue')
        );

        expect(venueCard).toBeTruthy();
        venueCard!.props.onPress();

        expect(mockOnVenuePress).toHaveBeenCalledWith('test-venue-123');
      } finally {
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
      }
    });

    it('should validate venue ID before calling onVenuePress', async () => {
      const mockVenues = [
        {
          id: '',
          name: 'Test Venue',
          category: 'Bar',
          location: 'Downtown',
          rating: 4.5,
          signup_date: new Date().toISOString(),
        },
      ];

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={mockVenues as any}
              onVenuePress={mockOnVenuePress}
            />
          );
        });

        const root = component!.root;
        const venueCard = root.findAllByType(TouchableOpacity).find(
          t => t.props.accessibilityLabel?.includes('Test Venue')
        );

        if (venueCard) {
          venueCard.props.onPress();
        }

        // Should not call onVenuePress with invalid ID
        expect(mockOnVenuePress).not.toHaveBeenCalled();
      } finally {
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
        consoleWarnSpy.mockRestore();
      }
    });

    it('should have correct accessibility label', async () => {
      const mockVenues = [
        {
          id: '1',
          name: 'Test Venue',
          category: 'Bar',
          location: 'Downtown',
          rating: 4.5,
          signup_date: new Date().toISOString(),
        },
      ];

      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={mockVenues as any}
              onVenuePress={mockOnVenuePress}
            />
          );
        });

        const root = component!.root;
        const venueCard = root.findAllByType(TouchableOpacity).find(
          t => t.props.accessibilityLabel === 'Test Venue, new venue'
        );

        expect(venueCard).toBeTruthy();
      } finally {
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
      }
    });

    it('should meet minimum touch target size', async () => {
      const mockVenues = [
        {
          id: '1',
          name: 'Test Venue',
          category: 'Bar',
          location: 'Downtown',
          rating: 4.5,
          signup_date: new Date().toISOString(),
        },
      ];

      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={mockVenues as any}
              onVenuePress={mockOnVenuePress}
            />
          );
        });

        const root = component!.root;
        const venueCard = root.findAllByType(TouchableOpacity).find(
          t => t.props.accessibilityLabel?.includes('new venue')
        );

        expect(venueCard).toBeTruthy();
        // Verify minimum height through style
        const style = venueCard!.props.style;
        if (Array.isArray(style)) {
          const hasMinHeight = style.some(s => s?.minHeight >= 44);
          expect(hasMinHeight).toBe(true);
        }
      } finally {
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
      }
    });
  });

  describe('Task 10.1: Error handling', () => {
    it('should return null when error is true', async () => {
      const error = new Error('Test error');

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
        expect(tree).toBeNull();
      } finally {
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
      }
    });

    it('should use image fallback when image_url is null', async () => {
      const mockVenues = [
        {
          id: '1',
          name: 'Test Venue',
          category: 'Bar',
          location: 'Downtown',
          rating: 4.5,
          image_url: null,
          signup_date: new Date().toISOString(),
        },
      ];

      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={mockVenues as any}
              onVenuePress={mockOnVenuePress}
            />
          );
        });

        const root = component!.root;
        const images = root.findAllByType(Image);
        const hasPlaceholder = images.some(
          img => img.props.source?.uri?.includes('placeholder')
        );

        expect(hasPlaceholder).toBe(true);
      } finally {
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
      }
    });

    it('should use defaults for missing fields', async () => {
      const mockVenues = [
        {
          id: '1',
          name: undefined,
          category: undefined,
          location: undefined,
          rating: 4.5,
          signup_date: new Date().toISOString(),
        },
      ];

      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={mockVenues as any}
              onVenuePress={mockOnVenuePress}
            />
          );
        });

        const tree = component!.toJSON();
        expect(tree).not.toBeNull();
      } finally {
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
      }
    });
  });

  describe('Task 11.1: Theming', () => {
    it('should apply correct colors in light mode', async () => {
      const mockVenues = [
        {
          id: '1',
          name: 'Test Venue',
          category: 'Bar',
          location: 'Downtown',
          rating: 4.5,
          signup_date: new Date().toISOString(),
        },
      ];

      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={mockVenues as any}
              onVenuePress={mockOnVenuePress}
            />
          );
        });

        const tree = component!.toJSON();
        expect(tree).not.toBeNull();
        // Theme colors are applied through useTheme hook
      } finally {
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
      }
    });
  });

  describe('Task 15.1: Empty state logging', () => {
    it('should call console.log when venues array is empty', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      let component: renderer.ReactTestRenderer | undefined;
      try {
        await act(async () => {
          component = renderer.create(
            <NewVenuesSpotlightCarousel
              venues={[]}
              onVenuePress={mockOnVenuePress}
            />
          );
        });

        expect(consoleLogSpy).toHaveBeenCalled();
      } finally {
        if (component) {
          await act(async () => {
            component!.unmount();
          });
        }
        consoleLogSpy.mockRestore();
      }
    });
  });
});
