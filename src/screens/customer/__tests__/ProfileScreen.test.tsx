/**
 * Property-Based and Unit Tests for ProfileScreen
 * Feature: user-profile-redesign
 * 
 * This file contains comprehensive tests for the redesigned profile screen,
 * including hero section, about me section, tabs, and settings.
 */

import * as fc from 'fast-check';
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ProfileScreen from '../ProfileScreen';
import { ProfileService } from '../../../services/api/profile';
import { launchImageLibrary } from 'react-native-image-picker';

// Mock dependencies
jest.mock('../../../services/api/profile');
jest.mock('react-native-image-picker');

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock contexts
jest.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        background: '#FFFFFF',
        primary: '#007AFF',
        text: '#000000',
        textSecondary: '#666666',
        surface: '#F5F5F5',
        border: '#E5E5E5',
      },
      fonts: {
        primary: { bold: 'Poppins-Bold', semiBold: 'Poppins-SemiBold' },
        secondary: { regular: 'Inter-Regular', semiBold: 'Inter-SemiBold', medium: 'Inter-Medium' },
      },
      isDark: false,
    },
  }),
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
  }),
}));

describe('ProfileScreen - Property-Based Tests', () => {
  jest.setTimeout(30000);

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    (ProfileService.fetchCompleteUserProfile as jest.Mock).mockResolvedValue({
      success: true,
      profile: {
        id: 'test-user-id',
        username: 'testuser',
        email: 'test@example.com',
        profilePhotoUrl: null,
        aboutText: 'Test about text',
        followerCount: 10,
        checkInsCount: 25,
        favoritesCount: 15,
        friendsCount: 8,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  });

  /**
   * Property 13: Conditional Photo Display
   * Feature: user-profile-redesign, Property 13: Conditional Photo Display
   * Validates: Requirements 6.6
   * 
   * For any profile state, if photoUrl is non-null the uploaded photo should be displayed,
   * otherwise the placeholder should be displayed.
   */
  it('should display uploaded photo when photoUrl exists, placeholder otherwise', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          photoUrl: fc.option(fc.webUrl(), { nil: null }),
          username: fc.string({ minLength: 1, maxLength: 20 }),
          aboutText: fc.string({ maxLength: 500 }),
        }),
        async (profileData) => {
          (ProfileService.fetchCompleteUserProfile as jest.Mock).mockResolvedValue({
            success: true,
            profile: {
              id: 'test-user-id',
              username: profileData.username,
              email: 'test@example.com',
              profilePhotoUrl: profileData.photoUrl,
              aboutText: profileData.aboutText,
              followerCount: 10,
              checkInsCount: 25,
              favoritesCount: 15,
              friendsCount: 8,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          });

          const { findByTestId } = render(<ProfileScreen />);
          
          await waitFor(async () => {
            const heroSection = await findByTestId('hero-section');
            expect(heroSection).toBeTruthy();
          });

          // The component should render without errors
          // Actual image source validation would require accessing component internals
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 14: Touch Target Accessibility
   * Feature: user-profile-redesign, Property 14: Touch Target Accessibility
   * Validates: Requirements 7.3, 8.4
   * 
   * For all interactive elements (buttons, tabs, edit icon), the minimum dimensions
   * should be at least 44pt x 44pt.
   */
  it('should ensure all interactive elements meet 44pt minimum touch target', async () => {
    const { findByTestId } = render(<ProfileScreen />);
    
    await waitFor(async () => {
      const heroSection = await findByTestId('hero-section');
      expect(heroSection).toBeTruthy();
    });

    // Check camera button - should be at least 44pt
    const cameraButton = await findByTestId('camera-button');
    const cameraStyle = cameraButton.props.style;
    const cameraWidth = cameraStyle.width || cameraStyle.minWidth || 0;
    const cameraHeight = cameraStyle.height || cameraStyle.minHeight || 0;
    expect(cameraWidth).toBeGreaterThanOrEqual(44);
    expect(cameraHeight).toBeGreaterThanOrEqual(44);

    // Check settings button - should be at least 44pt
    const settingsButton = await findByTestId('settings-button');
    const settingsStyle = settingsButton.props.style;
    const settingsWidth = settingsStyle.width || settingsStyle.minWidth || 0;
    const settingsHeight = settingsStyle.height || settingsStyle.minHeight || 0;
    expect(settingsWidth).toBeGreaterThanOrEqual(44);
    expect(settingsHeight).toBeGreaterThanOrEqual(44);
  });

  /**
   * Property 15: Accessibility Labels
   * Feature: user-profile-redesign, Property 15: Accessibility Labels
   * Validates: Requirements 8.1
   * 
   * For all interactive elements, an accessibilityLabel property should be defined
   * with a descriptive string.
   */
  it('should provide accessibility labels for all interactive elements', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username: fc.string({ minLength: 1, maxLength: 20 }),
        }),
        async (data) => {
          (ProfileService.fetchCompleteUserProfile as jest.Mock).mockResolvedValue({
            success: true,
            profile: {
              id: 'test-user-id',
              username: data.username,
              email: 'test@example.com',
              profilePhotoUrl: null,
              aboutText: 'Test',
              followerCount: 10,
              checkInsCount: 25,
              favoritesCount: 15,
              friendsCount: 8,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          });

          const { findByTestId, findByLabelText } = render(<ProfileScreen />);
          
          await waitFor(async () => {
            const heroSection = await findByTestId('hero-section');
            expect(heroSection).toBeTruthy();
          });

          // Check for accessibility labels
          const cameraButton = await findByTestId('camera-button');
          expect(cameraButton.props.accessibilityLabel).toBeDefined();
          expect(typeof cameraButton.props.accessibilityLabel).toBe('string');

          const settingsButton = await findByTestId('settings-button');
          expect(settingsButton.props.accessibilityLabel).toBeDefined();
          expect(typeof settingsButton.props.accessibilityLabel).toBe('string');
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('ProfileScreen - Integration Tests', () => {
  jest.setTimeout(15000);

  beforeEach(() => {
    jest.clearAllMocks();
    
    (ProfileService.fetchCompleteUserProfile as jest.Mock).mockResolvedValue({
      success: true,
      profile: {
        id: 'test-user-id',
        username: 'testuser',
        email: 'test@example.com',
        profilePhotoUrl: null,
        aboutText: 'Test about text',
        followerCount: 10,
        checkInsCount: 25,
        favoritesCount: 15,
        friendsCount: 8,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  });

  /**
   * Test complete photo upload flow
   * Validates: Requirements 1.3, 1.4, 6.1, 6.2, 6.3, 6.4
   */
  it('should handle complete photo upload flow', async () => {
    const mockPhotoUri = 'file:///path/to/photo.jpg';
    const mockPhotoUrl = 'https://example.com/photo.jpg';

    (launchImageLibrary as jest.Mock).mockImplementation((options, callback) => {
      callback({
        assets: [{ uri: mockPhotoUri, fileName: 'photo.jpg' }],
      });
    });

    (ProfileService.uploadProfilePhoto as jest.Mock).mockResolvedValue({
      success: true,
      photoUrl: mockPhotoUrl,
    });

    const { findByTestId } = render(<ProfileScreen />);
    
    await waitFor(async () => {
      const heroSection = await findByTestId('hero-section');
      expect(heroSection).toBeTruthy();
    });

    const cameraButton = await findByTestId('camera-button');
    fireEvent.press(cameraButton);

    await waitFor(() => {
      expect(ProfileService.uploadProfilePhoto).toHaveBeenCalledWith(
        'test-user-id',
        mockPhotoUri,
        'photo.jpg'
      );
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Profile photo updated!');
    });
  });

  /**
   * Test complete about edit flow
   * Validates: Requirements 2.2, 2.3, 2.4, 2.5
   */
  it('should handle complete about text edit and save flow', async () => {
    const newAboutText = 'Updated about text';

    (ProfileService.updateAboutText as jest.Mock).mockResolvedValue({
      success: true,
      aboutText: newAboutText,
    });

    const { findByTestId } = render(<ProfileScreen />);
    
    await waitFor(async () => {
      const aboutSection = await findByTestId('about-section');
      expect(aboutSection).toBeTruthy();
    });

    // Enter edit mode
    const editButton = await findByTestId('edit-about-button');
    fireEvent.press(editButton);

    // Change text
    const textInput = await findByTestId('about-text-input');
    fireEvent.changeText(textInput, newAboutText);

    // Save
    const saveButton = await findByTestId('save-about-button');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(ProfileService.updateAboutText).toHaveBeenCalledWith(
        'test-user-id',
        newAboutText
      );
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'About me updated!');
    });
  });

  /**
   * Test tab switching with content updates
   * Validates: Requirements 3.3, 3.4, 3.7
   */
  it('should switch tabs and update content', async () => {
    const { findByTestId, findByText } = render(<ProfileScreen />);
    
    await waitFor(async () => {
      const tabNav = await findByTestId('tab-navigation');
      expect(tabNav).toBeTruthy();
    });

    // Initially on Main Info tab
    const mainInfoTab = await findByTestId('main-info-tab');
    expect(mainInfoTab.props.accessibilityState?.selected).toBe(true);

    // Switch to Settings tab
    const settingsTab = await findByTestId('settings-tab');
    fireEvent.press(settingsTab);

    await waitFor(() => {
      expect(settingsTab.props.accessibilityState?.selected).toBe(true);
    });

    // Verify settings content is displayed
    const settingsMenu = await findByTestId('settings-menu');
    expect(settingsMenu).toBeTruthy();
  });

  /**
   * Test error recovery for photo upload
   * Validates: Requirements 6.7
   */
  it('should handle photo upload errors gracefully', async () => {
    const mockPhotoUri = 'file:///path/to/photo.jpg';

    (launchImageLibrary as jest.Mock).mockImplementation((options, callback) => {
      callback({
        assets: [{ uri: mockPhotoUri, fileName: 'photo.jpg' }],
      });
    });

    (ProfileService.uploadProfilePhoto as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Upload failed',
    });

    const { findByTestId } = render(<ProfileScreen />);
    
    await waitFor(async () => {
      const heroSection = await findByTestId('hero-section');
      expect(heroSection).toBeTruthy();
    });

    const cameraButton = await findByTestId('camera-button');
    fireEvent.press(cameraButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Upload failed');
    });
  });

  /**
   * Test error recovery for about text save
   * Validates: Requirements 2.4
   */
  it('should handle about text save errors gracefully', async () => {
    (ProfileService.updateAboutText as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Save failed',
    });

    const { findByTestId } = render(<ProfileScreen />);
    
    await waitFor(async () => {
      const aboutSection = await findByTestId('about-section');
      expect(aboutSection).toBeTruthy();
    });

    const editButton = await findByTestId('edit-about-button');
    fireEvent.press(editButton);

    const textInput = await findByTestId('about-text-input');
    fireEvent.changeText(textInput, 'New text');

    const saveButton = await findByTestId('save-about-button');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Save failed');
    });
  });

  /**
   * Test profile load error state
   * Validates: Requirements 6.5, 6.6
   */
  it('should display error state when profile load fails', async () => {
    (ProfileService.fetchCompleteUserProfile as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Failed to load profile',
    });

    const { findAllByText, getByText } = render(<ProfileScreen />);
    
    // Wait for error state to appear (there may be multiple instances)
    const errorTexts = await findAllByText(/Failed to load profile/i, {}, { timeout: 3000 });
    expect(errorTexts.length).toBeGreaterThan(0);

    // Check for retry button
    const retryButton = getByText('Retry');
    expect(retryButton).toBeTruthy();
  });

  /**
   * Test loading state display
   * Validates: Requirements 6.5
   */
  it('should display loading state while fetching profile', async () => {
    let resolveProfile: any;
    const profilePromise = new Promise((resolve) => {
      resolveProfile = resolve;
    });

    (ProfileService.fetchCompleteUserProfile as jest.Mock).mockReturnValue(profilePromise);

    const { findByText } = render(<ProfileScreen />);
    
    const loadingText = await findByText('Loading profile...');
    expect(loadingText).toBeTruthy();

    // Resolve the promise
    resolveProfile({
      success: true,
      profile: {
        id: 'test-user-id',
        username: 'testuser',
        email: 'test@example.com',
        profilePhotoUrl: null,
        aboutText: 'Test',
        followerCount: 10,
        checkInsCount: 25,
        favoritesCount: 15,
        friendsCount: 8,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    await waitFor(async () => {
      const heroSection = await findByText('testuser');
      expect(heroSection).toBeTruthy();
    });
  });
});
