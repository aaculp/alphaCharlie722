/**
 * Centralized type definitions for the OTW application
 * 
 * This index file exports all type definitions organized by domain:
 * - Venue types: venue-related data structures
 * - User types: user and profile data structures
 * - Navigation types: navigation parameter lists
 * - Check-in types: check-in and statistics data structures
 */

// Venue types
export type {
  Venue,
  VenueInsert,
  VenueUpdate,
  VenueQueryOptions,
} from './venue.types';

// User types
export type {
  Profile,
  ProfileInsert,
  ProfileUpdate,
  UserType,
} from './user.types';

// Navigation types
export type {
  RootTabParamList,
  SettingsStackParamList,
  HomeStackParamList,
  SearchStackParamList,
} from './navigation.types';

// Check-in types
export type {
  CheckIn,
  VenueCheckInStats,
  CheckInWithVenue,
  CheckInHistoryOptions,
  CheckInHistoryResponse,
} from './checkin.types';

// Social types
export type {
  // Privacy
  PrivacyLevel,
  PrivacySettings,
  NotificationPreferences,
  
  // Friendship
  Friendship,
  FriendRequest,
  FriendshipStatus,
  
  // Follow (Post-MVP)
  Follow,
  FollowRequest,
  FollowStatus,
  
  // Social Profile
  SocialProfile,
  SocialStats,
  SocialProfileUpdate,
  
  // Collections
  Collection,
  CollectionCreate,
  CollectionUpdate,
  CollectionVenue,
  VenueOrder,
  CollectionFollow,
  
  // Activity Feed
  ActivityFeedEntry,
  ActivityFeedOptions,
  ActivityFeedResponse,
  ActivityLike,
  ActivityComment,
  
  // Venue Sharing
  VenueShare,
  
  // Group Outings (Post-MVP)
  GroupOuting,
  GroupOutingCreate,
  GroupOutingUpdate,
  GroupOutingInvite,
  OutingResponse,
  
  // Notifications
  SocialNotification,
  NotificationType,
  
  // Blocking & Reporting
  BlockedUser,
  UserReport,
  
  // Pagination
  PaginationOptions,
  PaginatedResponse,
} from './social.types';
