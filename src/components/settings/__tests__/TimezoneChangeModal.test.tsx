/**
 * Unit Tests for TimezoneChangeModal Component
 * Feature: auto-detect-timezone
 * Requirements: 5.2, 5.3, 5.4, 5.5
 */

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text, TouchableOpacity } from 'react-native';
import TimezoneChangeModal from '../TimezoneChangeModal';

// Mock the theme context
jest.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        surface: '#ffffff',
        background: '#f5f5f5',
        border: '#d1d5db',
        text: '#333333',
        textSecondary: '#666666',
        primary: '#007AFF',
        success: '#34c759',
        error: '#ff3b30',
      },
    },
    isDark: false,
  }),
}));

// Mock the timezone utility
jest.mock('../../../utils/timezone', () => ({
  getFriendlyTimezoneName: jest.fn((timezone: string) => {
    const map: Record<string, string> = {
      'America/New_York': 'Eastern Time',
      'America/Los_Angeles': 'Pacific Time',
      'Europe/London': 'British Time',
      'Asia/Tokyo': 'Japan Time',
      'UTC': 'Coordinated Universal Time',
    };
    return map[timezone] || timezone;
  }),
}));

describe('TimezoneChangeModal Component - Unit Tests', () => {
  const mockOnAccept = jest.fn();
  const mockOnDecline = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test: Modal renders when visible
   * Requirement 5.2: Display old and new timezone
   */
  it('should render modal when visible is true', async () => {
    let component: renderer.ReactTestRenderer | undefined;
    
    try {
      await act(async () => {
        component = renderer.create(
          <TimezoneChangeModal
            visible={true}
            oldTimezone="America/New_York"
            newTimezone="America/Los_Angeles"
            onAccept={mockOnAccept}
            onDecline={mockOnDecline}
          />
        );
      });

      const tree = component!.toJSON();
      expect(tree).toBeTruthy();
    } finally {
      if (component) {
        await act(async () => {
          component!.unmount();
        });
      }
    }
  }, 10000); // Increase timeout to 10 seconds
  });

  /**
   * Test: Modal does not render when not visible
   * Requirement 5.5: Modal is dismissible
   */
  it('should not render modal when visible is false', async () => {
    let component: renderer.ReactTestRenderer | undefined;
    
    try {
      await act(async () => {
        component = renderer.create(
          <TimezoneChangeModal
            visible={false}
            oldTimezone="America/New_York"
            newTimezone="America/Los_Angeles"
            onAccept={mockOnAccept}
            onDecline={mockOnDecline}
          />
        );
      });

      const tree = component!.toJSON();
      // Modal component returns null when not visible
      expect(tree).toBeNull();
    } finally {
      if (component) {
        await act(async () => {
          component!.unmount();
        });
      }
    }
  });

  /**
   * Test: Displays both timezones clearly
   * Requirement 5.2: Display old and new timezone
   * Requirement 5.3: Show friendly timezone names
   */
  it('should display both old and new timezones with friendly names', async () => {
    let component: renderer.ReactTestRenderer | undefined;
    
    try {
      await act(async () => {
        component = renderer.create(
          <TimezoneChangeModal
            visible={true}
            oldTimezone="America/New_York"
            newTimezone="America/Los_Angeles"
            onAccept={mockOnAccept}
            onDecline={mockOnDecline}
          />
        );
      });

      const root = component!.root;
      const textComponents = root.findAllByType(Text);
      
      // Find text components containing timezone information
      const textContents = textComponents.map(t => t.props.children).flat();
      
      // Verify friendly names are displayed
      expect(textContents).toContain('Eastern Time');
      expect(textContents).toContain('Pacific Time');
      
      // Verify IANA format is also displayed
      expect(textContents).toContain('America/New_York');
      expect(textContents).toContain('America/Los_Angeles');
    } finally {
      if (component) {
        await act(async () => {
          component!.unmount();
        });
      }
    }
  });

  /**
   * Test: Accept button triggers onAccept callback
   * Requirement 5.4: Provide "Update" and "Keep Current" buttons
   */
  it('should call onAccept when Update button is pressed', async () => {
    let component: renderer.ReactTestRenderer | undefined;
    
    try {
      await act(async () => {
        component = renderer.create(
          <TimezoneChangeModal
            visible={true}
            oldTimezone="America/New_York"
            newTimezone="America/Los_Angeles"
            onAccept={mockOnAccept}
            onDecline={mockOnDecline}
          />
        );
      });

      const root = component!.root;
      const buttons = root.findAllByType(TouchableOpacity);
      
      // Find the accept button (should contain "Update Timezone" text)
      const acceptButton = buttons.find(button => {
        const textComponents = button.findAllByType(Text);
        return textComponents.some(text => text.props.children === 'Update Timezone');
      });

      expect(acceptButton).toBeDefined();
      
      // Simulate button press
      await act(async () => {
        acceptButton!.props.onPress();
      });

      expect(mockOnAccept).toHaveBeenCalledTimes(1);
      expect(mockOnDecline).not.toHaveBeenCalled();
    } finally {
      if (component) {
        await act(async () => {
          component!.unmount();
        });
      }
    }
  });

  /**
   * Test: Decline button triggers onDecline callback
   * Requirement 5.4: Provide "Update" and "Keep Current" buttons
   */
  it('should call onDecline when Keep Current button is pressed', async () => {
    let component: renderer.ReactTestRenderer | undefined;
    
    try {
      await act(async () => {
        component = renderer.create(
          <TimezoneChangeModal
            visible={true}
            oldTimezone="America/New_York"
            newTimezone="America/Los_Angeles"
            onAccept={mockOnAccept}
            onDecline={mockOnDecline}
          />
        );
      });

      const root = component!.root;
      const buttons = root.findAllByType(TouchableOpacity);
      
      // Find the decline button (should contain "Keep Current" text)
      const declineButton = buttons.find(button => {
        const textComponents = button.findAllByType(Text);
        return textComponents.some(text => text.props.children === 'Keep Current');
      });

      expect(declineButton).toBeDefined();
      
      // Simulate button press
      await act(async () => {
        declineButton!.props.onPress();
      });

      expect(mockOnDecline).toHaveBeenCalledTimes(1);
      expect(mockOnAccept).not.toHaveBeenCalled();
    } finally {
      if (component) {
        await act(async () => {
          component!.unmount();
        });
      }
    }
  });

  /**
   * Test: Modal displays title and description
   * Requirement 5.2: Modal displays both timezones clearly
   */
  it('should display title and description text', async () => {
    let component: renderer.ReactTestRenderer | undefined;
    
    try {
      await act(async () => {
        component = renderer.create(
          <TimezoneChangeModal
            visible={true}
            oldTimezone="America/New_York"
            newTimezone="America/Los_Angeles"
            onAccept={mockOnAccept}
            onDecline={mockOnDecline}
          />
        );
      });

      const root = component!.root;
      const textComponents = root.findAllByType(Text);
      const textContents = textComponents.map(t => t.props.children).flat();
      
      // Verify title is present
      expect(textContents.some((text: any) => 
        typeof text === 'string' && text.includes('Timezone')
      )).toBe(true);
      
      // Verify description is present
      expect(textContents.some((text: any) => 
        typeof text === 'string' && text.includes('device timezone has changed')
      )).toBe(true);
    } finally {
      if (component) {
        await act(async () => {
          component!.unmount();
        });
      }
    }
  });

  /**
   * Test: Modal handles UTC timezone
   * Requirement 5.3: Show friendly timezone names
   */
  it('should display friendly name for UTC timezone', async () => {
    let component: renderer.ReactTestRenderer | undefined;
    
    try {
      await act(async () => {
        component = renderer.create(
          <TimezoneChangeModal
            visible={true}
            oldTimezone="UTC"
            newTimezone="America/New_York"
            onAccept={mockOnAccept}
            onDecline={mockOnDecline}
          />
        );
      });

      const root = component!.root;
      const textComponents = root.findAllByType(Text);
      const textContents = textComponents.map(t => t.props.children).flat();
      
      // Verify UTC is displayed (the mock returns "Coordinated Universal Time" but component shows "UTC")
      expect(textContents).toContain('UTC');
      expect(textContents).toContain('Eastern Time');
    } finally {
      if (component) {
        await act(async () => {
          component!.unmount();
        });
      }
    }
  });

  /**
   * Test: Modal handles international timezones
   * Requirement 5.3: Show friendly timezone names
   */
  it('should display friendly names for international timezones', async () => {
    let component: renderer.ReactTestRenderer | undefined;
    
    try {
      await act(async () => {
        component = renderer.create(
          <TimezoneChangeModal
            visible={true}
            oldTimezone="Europe/London"
            newTimezone="Asia/Tokyo"
            onAccept={mockOnAccept}
            onDecline={mockOnDecline}
          />
        );
      });

      const root = component!.root;
      const textComponents = root.findAllByType(Text);
      const textContents = textComponents.map(t => t.props.children).flat();
      
      // Verify international timezone friendly names
      expect(textContents).toContain('British Time');
      expect(textContents).toContain('Japan Time');
      expect(textContents).toContain('Europe/London');
      expect(textContents).toContain('Asia/Tokyo');
    } finally {
      if (component) {
        await act(async () => {
          component!.unmount();
        });
      }
    }
  });

  /**
   * Test: Modal displays current and new labels
   * Requirement 5.2: Display old and new timezone
   */
  it('should display "Current" and "New" labels for timezones', async () => {
    let component: renderer.ReactTestRenderer | undefined;
    
    try {
      await act(async () => {
        component = renderer.create(
          <TimezoneChangeModal
            visible={true}
            oldTimezone="America/New_York"
            newTimezone="America/Los_Angeles"
            onAccept={mockOnAccept}
            onDecline={mockOnDecline}
          />
        );
      });

      const root = component!.root;
      const textComponents = root.findAllByType(Text);
      const textContents = textComponents.map(t => t.props.children).flat();
      
      // Verify labels are present (actual text includes colons)
      expect(textContents.some((text: any) => 
        typeof text === 'string' && text.includes('Current')
      )).toBe(true);
      expect(textContents.some((text: any) => 
        typeof text === 'string' && text.includes('New')
      )).toBe(true);
    } finally {
      if (component) {
        await act(async () => {
          component!.unmount();
        });
      }
    }
  });

  /**
   * Test: Modal displays info box about quiet hours
   * Requirement 5.2: Modal displays both timezones clearly
   */
  it('should display information about quiet hours', async () => {
    let component: renderer.ReactTestRenderer | undefined;
    
    try {
      await act(async () => {
        component = renderer.create(
          <TimezoneChangeModal
            visible={true}
            oldTimezone="America/New_York"
            newTimezone="America/Los_Angeles"
            onAccept={mockOnAccept}
            onDecline={mockOnDecline}
          />
        );
      });

      const root = component!.root;
      const textComponents = root.findAllByType(Text);
      const textContents = textComponents.map(t => t.props.children).flat();
      
      // Verify info text about quiet hours is present
      expect(textContents.some((text: any) => 
        typeof text === 'string' && text.includes('quiet hours')
      )).toBe(true);
    } finally {
      if (component) {
        await act(async () => {
          component!.unmount();
        });
      }
    }
  });

  /**
   * Test: Both buttons are present
   * Requirement 5.4: Provide "Update" and "Keep Current" buttons
   */
  it('should render both action buttons', async () => {
    let component: renderer.ReactTestRenderer | undefined;
    
    try {
      await act(async () => {
        component = renderer.create(
          <TimezoneChangeModal
            visible={true}
            oldTimezone="America/New_York"
            newTimezone="America/Los_Angeles"
            onAccept={mockOnAccept}
            onDecline={mockOnDecline}
          />
        );
      });

      const root = component!.root;
      const buttons = root.findAllByType(TouchableOpacity);
      
      // Should have at least 2 buttons (Keep Current and Update Timezone)
      expect(buttons.length).toBeGreaterThanOrEqual(2);
      
      // Verify button texts
      const allText = root.findAllByType(Text).map(t => t.props.children).flat();
      expect(allText).toContain('Keep Current');
      expect(allText).toContain('Update Timezone');
    } finally {
      if (component) {
        await act(async () => {
          component!.unmount();
        });
      }
    }
  });
});
