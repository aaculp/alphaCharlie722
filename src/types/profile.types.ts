/**
 * Type definitions for User Profile Redesign feature
 * 
 * This file contains all TypeScript interfaces and types for the redesigned
 * user profile screen, including component props, state management, and data models.
 */

import type { SocialProfile } from './social.types';

// ============================================================================
// Enums
// ============================================================================

/**
 * Setting types for navigation from settings menu
 */
export type SettingType = 'notifications' | 'privacy' | 'security' | 'help' | 'logout';

/**
 * Tab types for profile navigation
 */
export type TabType = 'main' | 'settings';

// ============================================================================
// Data Models
// ============================================================================

/**
 * Extended user profile with all profile screen data
 */
export interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  display_name: string | null;
  profilePhotoUrl: string | null;
  aboutText: string;
  followerCount: number;
  checkInsCount: number;
  uniqueVenuesCount?: number; // Number of unique venues visited
  monthlyCheckInsCount?: number; // Check-ins this month
  favoritesCount: number;
  friendsCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Photo upload request data
 */
export interface PhotoUploadRequest {
  userId: string;
  imageData: string; // base64 or file URI
  imageType: string; // 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
}

/**
 * Photo upload response data
 */
export interface PhotoUploadResponse {
  success: boolean;
  photoUrl?: string;
  error?: string;
}

/**
 * User statistics for profile display
 */
export interface UserStatistics {
  checkInsCount: number;
  favoritesCount: number;
  friendsCount: number;
}

// ============================================================================
// State Management
// ============================================================================

/**
 * Profile screen state management interface
 */
export interface ProfileScreenState {
  // User data
  user: UserProfile | null;
  profileImageUri: string | null;
  aboutText: string;
  
  // UI state
  activeTab: TabType;
  isEditingAbout: boolean;
  
  // Loading states
  isUploadingPhoto: boolean;
  isSavingAbout: boolean;
  isLoadingProfile: boolean;
  
  // Statistics
  followerCount: number;
  checkInsCount: number;
  favoritesCount: number;
  friendsCount: number;
  recentFollowers: SocialProfile[];
  
  // Error states
  photoUploadError: string | null;
  aboutSaveError: string | null;
  profileLoadError: string | null;
}

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for HeroSection component
 */
export interface HeroSectionProps {
  profileImageUri: string | null;
  username: string | null;
  displayName?: string | null;
  onCameraPress: () => void;
  onSettingsPress: () => void;
  isUploading?: boolean;
  isViewingOwnProfile?: boolean; // Hide edit buttons when viewing another user's profile
}

/**
 * Props for AboutMeSection component
 */
export interface AboutMeSectionProps {
  aboutText: string;
  isEditing: boolean;
  onEditPress: () => void;
  onSavePress: (newText: string) => void;
  onTextChange: (text: string) => void;
  isSaving?: boolean;
  maxLength?: number;
}

/**
 * Props for TabNavigation component
 */
export interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

/**
 * Props for FollowersCard component
 */
export interface FollowersCardProps {
  followerCount: number;
  recentFollowers: SocialProfile[];
  onInvitePress: () => void;
}

/**
 * Props for StatisticsCard component
 */
export interface StatisticsCardProps {
  checkInsCount: number;
  favoritesCount: number;
  friendsCount: number;
}

/**
 * Props for SettingsMenu component
 */
export interface SettingsMenuProps {
  onSettingPress: (setting: SettingType) => void;
}

/**
 * Props for individual setting item
 */
export interface SettingItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  isDestructive?: boolean;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Request to update about text
 */
export interface UpdateAboutTextRequest {
  userId: string;
  aboutText: string;
}

/**
 * Response from updating about text
 */
export interface UpdateAboutTextResponse {
  success: boolean;
  aboutText?: string;
  error?: string;
}

/**
 * Request to fetch user profile
 */
export interface FetchUserProfileRequest {
  userId: string;
}

/**
 * Response from fetching user profile
 */
export interface FetchUserProfileResponse {
  success: boolean;
  profile?: UserProfile;
  error?: string;
}
