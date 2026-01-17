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
  ProfileStackParamList,
  SettingsStackParamList,
  HomeStackParamList,
  SearchStackParamList,
  VenueStackParamList,
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

// Profile types
export type {
  // Enums
  SettingType,
  TabType,
  
  // Data Models
  UserProfile,
  PhotoUploadRequest,
  PhotoUploadResponse,
  UserStatistics,
  
  // State Management
  ProfileScreenState,
  
  // Component Props
  HeroSectionProps,
  AboutMeSectionProps,
  TabNavigationProps,
  FollowersCardProps,
  StatisticsCardProps,
  SettingsMenuProps,
  SettingItemProps,
  
  // API Request/Response
  UpdateAboutTextRequest,
  UpdateAboutTextResponse,
  FetchUserProfileRequest,
  FetchUserProfileResponse,
} from './profile.types';

// Flash Offer types
export type {
  // Flash Offer
  FlashOffer,
  FlashOfferStatus,
  CreateFlashOfferInput,
  UpdateFlashOfferInput,
  FlashOfferWithVenue,
  FlashOfferWithStats,
  FlashOfferQueryOptions,
  ActiveOffersQueryOptions,
} from './flashOffer.types';

// Flash Offer Claim types
export type {
  // Claim
  FlashOfferClaim,
  ClaimStatus,
  FlashOfferClaimWithOffer,
  FlashOfferClaimWithDetails,
  
  // Validation
  ClaimValidationResult,
  ClaimIneligibilityReason,
  
  // Input/Output
  ClaimOfferInput,
  RedeemClaimInput,
  UserClaimsQueryOptions,
  ClaimByTokenQuery,
  ClaimOfferResponse,
  RedeemClaimResponse,
} from './flashOfferClaim.types';
