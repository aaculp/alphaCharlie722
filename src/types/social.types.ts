import type { Database } from '../lib/supabase';
import type { Venue } from './venue.types';

// ============================================================================
// Privacy Types
// ============================================================================

/**
 * Four-tier privacy level system for content visibility
 * - public: Visible to all users including followers
 * - friends: Visible only to friends
 * - close_friends: Visible only to designated close friends
 * - private: Visible only to the content creator
 */
export type PrivacyLevel = 'public' | 'friends' | 'close_friends' | 'private';

// ============================================================================
// Friendship Types
// ============================================================================

/**
 * Bidirectional friendship relationship between two users
 * Uses ordered user IDs (user_id_1 < user_id_2) for consistency
 */
export interface Friendship {
  id: string;
  user_id_1: string;
  user_id_2: string;
  is_close_friend_1: boolean; // user_id_1 marked user_id_2 as close friend
  is_close_friend_2: boolean; // user_id_2 marked user_id_1 as close friend
  created_at: string;
}

/**
 * Friend request from one user to another
 */
export interface FriendRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
  
  // Joined data (computed)
  from_user?: SocialProfile;
}

/**
 * Friendship status between two users from the perspective of the viewer
 */
export type FriendshipStatus =
  | { type: 'none' }
  | { type: 'pending_sent' }
  | { type: 'pending_received' }
  | { type: 'friends'; isCloseFriend: boolean };

// ============================================================================
// Follow Types (Deferred to Post-MVP)
// ============================================================================

/**
 * Unidirectional follow relationship
 */
export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

/**
 * Follow request for private accounts
 */
export interface FollowRequest {
  id: string;
  follower_id: string;
  following_id: string;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  updated_at: string;
}

/**
 * Follow status between two users
 */
export type FollowStatus =
  | { type: 'not_following' }
  | { type: 'pending' }
  | { type: 'following' };

// ============================================================================
// Social Profile Types
// ============================================================================

/**
 * Extended user profile with social statistics and relationship information
 */
export interface SocialProfile {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;

  // Social stats (computed)
  friend_count?: number;
  follower_count?: number;
  following_count?: number;
  checkin_count?: number;
  collection_count?: number;

  // Relationship to viewer (computed)
  friendship_status?: FriendshipStatus;
  follow_status?: FollowStatus;
  mutual_friends_count?: number;
}

/**
 * Social statistics for a user
 */
export interface SocialStats {
  friend_count: number;
  follower_count: number;
  following_count: number;
  checkin_count: number;
  collection_count: number;
  venue_share_count: number;
}

/**
 * Update data for social profile
 */
export interface SocialProfileUpdate {
  name?: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
}

// ============================================================================
// Collection Types
// ============================================================================

/**
 * Curated list of venues with a specific theme or purpose
 */
export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  privacy_level: PrivacyLevel;
  cover_image_url: string | null; // First venue image or custom
  created_at: string;
  updated_at: string;

  // Computed fields
  venue_count?: number;
  follower_count?: number;
  user?: SocialProfile;
  venues?: Venue[];
  is_following?: boolean; // For viewer
}

/**
 * Data for creating a new collection
 */
export interface CollectionCreate {
  user_id: string;
  name: string;
  description?: string;
  privacy_level?: PrivacyLevel;
}

/**
 * Data for updating an existing collection
 */
export interface CollectionUpdate {
  name?: string;
  description?: string;
  privacy_level?: PrivacyLevel;
  cover_image_url?: string;
}

/**
 * Association between a collection and a venue
 */
export interface CollectionVenue {
  id: string;
  collection_id: string;
  venue_id: string;
  order: number; // For custom ordering
  added_at: string;
}

/**
 * Venue ordering information for reordering
 */
export interface VenueOrder {
  venue_id: string;
  order: number;
}

/**
 * Collection follow relationship (Deferred to Post-MVP)
 */
export interface CollectionFollow {
  id: string;
  user_id: string;
  collection_id: string;
  created_at: string;
}

// ============================================================================
// Activity Feed Types
// ============================================================================

/**
 * Activity feed entry representing a user action
 */
export interface ActivityFeedEntry {
  id: string;
  user_id: string;
  activity_type: 'checkin' | 'favorite' | 'collection_created' | 'collection_updated' | 'group_outing';
  venue_id: string | null;
  collection_id: string | null;
  group_outing_id: string | null;
  privacy_level: PrivacyLevel;
  metadata: Record<string, any>; // Additional activity-specific data
  created_at: string;

  // Joined data (computed)
  user?: SocialProfile;
  venue?: Venue;
  collection?: Collection;
  group_outing?: GroupOuting;

  // Engagement (computed) - Deferred to Post-MVP
  like_count?: number;
  comment_count?: number;
  user_has_liked?: boolean;
}

/**
 * Options for querying activity feed
 */
export interface ActivityFeedOptions {
  limit?: number;
  offset?: number;
  filter?: 'all' | 'checkins' | 'favorites' | 'collections';
  includeFollowing?: boolean;
}

/**
 * Response from activity feed query
 */
export interface ActivityFeedResponse {
  activities: ActivityFeedEntry[];
  hasMore: boolean;
  total: number;
}

/**
 * Like on an activity (Deferred to Post-MVP)
 */
export interface ActivityLike {
  id: string;
  activity_id: string;
  user_id: string;
  created_at: string;
}

/**
 * Comment on an activity (Deferred to Post-MVP)
 */
export interface ActivityComment {
  id: string;
  activity_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;

  // Joined data
  user?: SocialProfile;
}

// ============================================================================
// Venue Share Types
// ============================================================================

/**
 * Venue recommendation shared between users
 */
export interface VenueShare {
  id: string;
  from_user_id: string;
  to_user_id: string;
  venue_id: string;
  message: string | null;
  viewed: boolean;
  viewed_at: string | null;
  created_at: string;

  // Computed fields
  from_user?: SocialProfile;
  to_user?: SocialProfile;
  venue?: Venue;
}

// ============================================================================
// Group Outing Types (Deferred to Post-MVP)
// ============================================================================

/**
 * Planned event at a venue with multiple friends
 */
export interface GroupOuting {
  id: string;
  creator_id: string;
  venue_id: string;
  title: string;
  description: string | null;
  scheduled_date: string; // ISO datetime
  created_at: string;
  updated_at: string;

  // Computed fields
  creator?: SocialProfile;
  venue?: Venue;
  invites?: GroupOutingInvite[];
  response_counts?: {
    interested: number;
    going: number;
    cant_go: number;
    no_response: number;
  };
}

/**
 * Data for creating a new group outing
 */
export interface GroupOutingCreate {
  creator_id: string;
  venue_id: string;
  title: string;
  description?: string;
  scheduled_date: string;
  invited_friend_ids: string[];
}

/**
 * Data for updating a group outing
 */
export interface GroupOutingUpdate {
  title?: string;
  description?: string;
  scheduled_date?: string;
}

/**
 * Invitation to a group outing
 */
export interface GroupOutingInvite {
  id: string;
  group_outing_id: string;
  user_id: string;
  response: 'interested' | 'going' | 'cant_go' | 'no_response';
  responded_at: string | null;
  created_at: string;

  // Computed fields
  user?: SocialProfile;
  group_outing?: GroupOuting;
}

/**
 * Response type for group outing invitations
 */
export type OutingResponse = 'interested' | 'going' | 'cant_go';

// ============================================================================
// Notification Types
// ============================================================================

/**
 * Social notification for user interactions
 */
export interface SocialNotification {
  id: string;
  user_id: string; // Recipient
  type: NotificationType;
  actor_id: string | null; // User who triggered the notification
  reference_id: string | null; // ID of related entity (friend request, share, etc.)
  title: string;
  body: string;
  data: Record<string, any>; // Additional notification data
  read: boolean;
  read_at: string | null;
  created_at: string;

  // Computed fields
  actor?: SocialProfile;
}

/**
 * Types of social notifications
 */
export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'follow_request'
  | 'new_follower'
  | 'venue_share'
  | 'group_outing_invite'
  | 'group_outing_response'
  | 'group_outing_reminder'
  | 'collection_follow'
  | 'collection_update'
  | 'activity_like'
  | 'activity_comment'
  | 'friend_checkin_nearby'
  | 'flash_offer';

// ============================================================================
// Privacy Settings Types
// ============================================================================

/**
 * User privacy settings with four-tier privacy controls
 */
export interface PrivacySettings {
  user_id: string;
  profile_visibility: 'public' | 'friends' | 'private';
  checkin_visibility: PrivacyLevel;
  favorite_visibility: PrivacyLevel;
  default_collection_visibility: PrivacyLevel;
  allow_follow_requests: boolean; // true = public, false = require approval
  show_activity_status: boolean; // show "active now" when checked in
  created_at: string;
  updated_at: string;
}

/**
 * Notification preferences for social interactions
 */
export interface NotificationPreferences {
  user_id: string;
  friend_requests: boolean;
  friend_accepted: boolean;
  follow_requests: boolean;
  new_followers: boolean;
  venue_shares: boolean;
  group_outing_invites: boolean;
  group_outing_reminders: boolean;
  collection_follows: boolean;
  collection_updates: boolean;
  activity_likes: boolean;
  activity_comments: boolean;
  friend_checkins_nearby: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Blocking and Reporting Types
// ============================================================================

/**
 * Blocked user relationship
 */
export interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

/**
 * User report for inappropriate behavior
 */
export interface UserReport {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Pagination Types
// ============================================================================

/**
 * Pagination options for list queries
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  limit: number;
  offset: number;
}

