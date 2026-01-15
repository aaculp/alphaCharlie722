/**
 * HeroSection Component
 * 
 * Displays the hero section at the top of the profile screen with:
 * - Full-width profile photo (400pt height)
 * - Placeholder image when no photo is uploaded
 * - Username overlay at bottom-left
 * - Share and camera buttons at bottom-right
 * 
 * Requirements: 1.1, 1.2, 1.5, 1.6, 1.7
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { RESPONSIVE_SPACING } from '../../utils/responsive';
import type { HeroSectionProps } from '../../types/profile.types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Calculate responsive hero height based on screen dimensions
 * Requirement 7.1: Adapt hero section height to screen size
 * 
 * - Small screens (< 667pt height): 35% of screen height
 * - Medium screens (667-812pt height): 40% of screen height  
 * - Large screens (> 812pt height): 45% of screen height
 * - Minimum: 300pt, Maximum: 500pt
 */
const calculateHeroHeight = (): number => {
  let heightPercentage: number;
  
  if (SCREEN_HEIGHT < 667) {
    // Small screens (iPhone SE, etc.)
    heightPercentage = 0.35;
  } else if (SCREEN_HEIGHT <= 812) {
    // Medium screens (iPhone 12, 13, etc.)
    heightPercentage = 0.40;
  } else {
    // Large screens (iPhone 14 Pro Max, tablets, etc.)
    heightPercentage = 0.45;
  }
  
  const calculatedHeight = SCREEN_HEIGHT * heightPercentage;
  
  // Enforce min/max bounds
  return Math.max(300, Math.min(500, calculatedHeight));
};

const HERO_HEIGHT = calculateHeroHeight();

/**
 * HeroSection component for profile screen
 * 
 * @param profileImageUri - URI of the profile photo (null for placeholder)
 * @param username - Username to display in overlay
 * @param onCameraPress - Callback when camera button is pressed
 * @param onSettingsPress - Callback when settings button is pressed
 * @param isUploading - Optional loading state for photo upload
 */
export const HeroSection: React.FC<HeroSectionProps> = ({
  profileImageUri,
  username,
  onCameraPress,
  onSettingsPress,
  isUploading = false,
}) => {
  const { theme } = useTheme();

  // Determine which image to display
  const imageSource = profileImageUri
    ? { uri: profileImageUri }
    : require('../../assets/images/OTW_Full_Logo.png'); // Using app logo as placeholder

  return (
    <View style={styles.container} testID="hero-section">
      {/* Profile Image */}
      <Image
        source={imageSource}
        style={styles.image}
        resizeMode={profileImageUri ? 'cover' : 'contain'}
        testID="profile-image"
      />

      {/* Loading overlay when uploading */}
      {isUploading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      )}

      {/* Bottom overlay with gradient background */}
      <View style={styles.bottomOverlay}>
        {/* Username at bottom-left */}
        <View style={styles.usernameContainer}>
          <Text style={[styles.username, { fontFamily: theme.fonts.primary.bold }]}>
            {username}
          </Text>
        </View>

        {/* Action buttons at bottom-right */}
        <View style={styles.buttonsContainer}>
          {/* Camera Button (Left) */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
            onPress={onCameraPress}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            accessibilityHint="Double tap to select a new profile photo"
            testID="camera-button"
            disabled={isUploading}
          >
            <Icon name="camera-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Settings Button (Right) */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
            onPress={onSettingsPress}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            accessibilityHint="Double tap to open settings menu"
            testID="settings-button"
          >
            <Icon name="settings-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0', // Light gray background for loading state
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: RESPONSIVE_SPACING.sectionHorizontal,
    paddingBottom: RESPONSIVE_SPACING.sectionVertical,
    paddingTop: 40,
    // Gradient effect using semi-transparent background
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  usernameContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: RESPONSIVE_SPACING.elementGap + 8,
    paddingVertical: RESPONSIVE_SPACING.elementGap,
    borderRadius: 8,
    marginRight: RESPONSIVE_SPACING.elementGap + 4,
  },
  username: {
    fontSize: 24,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: RESPONSIVE_SPACING.elementGap + 4,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
