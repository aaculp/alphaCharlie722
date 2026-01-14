# Design Document: Social Friend System

## Overview

The Social Friend System transforms OTW from a solo venue discovery app into a social experience platform. This design implements a comprehensive social layer including friend connections, following, activity feeds, venue sharing, curated collections, and group outings. The system prioritizes user privacy and safety with a four-tier privacy model (public, friends, close_friends, private) and robust permission controls.

The design follows OTW's existing architectural patterns: React Native frontend with TypeScript, Supabase backend with PostgreSQL, custom hooks for business logic, and domain-driven folder structure. All social features integrate seamlessly with existing venue, check-in, and favorites functionality.

## Architecture

### MVP Architecture (Simplified)

```
┌─────────────────────────────────────────────────────────────┐
│                     React Native App                         │
├─────────────────────────────────────────────────────────────┤
│  Existing Screens (Enhanced)                                 │
│  ├── HomeScreen (+ FriendVenueCarousel, SharedCollection)   │
│  ├── VenueDetailScreen (+ QuickShare, CollectionManager)    │
│  ├── FavoritesScreen (+ SharedFavorites section)            │
│  └── SettingsScreen (+ Privacy Settings, Friend Management) │
├─────────────────────────────────────────────────────────────┤
│  New Social Components                                       │
│  ├── FriendVenueCarousel    ├── SharedCollectionCarousel    │
│  ├── FriendActivityFeed     ├── QuickShareButton            │
│  ├── CollectionManager      ├── FriendSelector              │
│  ├── PrivacyBadge           └── MutualFavoritesIndicator    │
├─────────────────────────────────────────────────────────────┤
│  Custom Hooks (Simplified)                                   │
│  ├── useFriends             ├── useSharedVenues             │
│  ├── useCollections         └── useFriendActivity           │
├─────────────────────────────────────────────────────────────┤
│  Services (MVP API Layer)                                    │
│  ├── friendsService         ├── collectionsService          │
│  ├── venueShareService      └── activityService             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend (MVP)                    │
├─────────────────────────────────────────────────────────────┤
│  Core Tables (MVP)                                           │
│  ├── friendships            ├── friend_requests             │
│  ├── collections            ├── collection_venues           │
│  ├── venue_shares           ├── privacy_settings            │
│  └── activity_feed          └── social_notifications        │
├─────────────────────────────────────────────────────────────┤
│  RLS Policies (Privacy Enforcement)                         │
│  └── Privacy-aware queries for all social data              │
└─────────────────────────────────────────────────────────────┘
```

### MVP Scope Reduction

**Included in MVP:**
- Friend connections (send/accept requests, view friends list)
- Collections (create, add venues, set privacy, share with friends)
- Venue sharing (quick share to friends)
- Shared favorites view (horizontal carousel of mutual favorites)
- Friend activity feed (compact, embedded in HomeScreen)
- Privacy settings (4-tier system)
- Basic notifications (friend requests, shares)

**Deferred to Post-MVP:**
- Follow system (unidirectional following)
- Group outings
- Activity likes and comments
- Collection following
- Advanced friend discovery (contact sync, suggestions)
- Real-time updates (use polling initially)
- Detailed analytics and engagement metrics


### System Integration Points

The social system integrates with existing OTW features:

1. **Check-ins**: Activity feed displays friend check-ins; group outings link to check-in system
2. **Favorites**: Activity feed shows friend favorites; collections contain favorited venues
3. **Venues**: All social features reference venue data; venue detail pages show friend activity
4. **Profiles**: Extended with social stats, collections, and activity history
5. **Notifications**: Unified notification system handles both venue and social notifications
6. **Authentication**: All social features require authenticated users; privacy enforced via RLS

## Components and Interfaces

### Frontend Components

#### MVP Social Components (Embedded in Existing Screens)

**FriendVenueCarousel** (Horizontal scrolling component)
- Displays on HomeScreen as a section
- Shows "Places [Friend Name] Loves" or "Shared Favorites with [Friend Name]"
- Horizontal scroll of venue cards
- Tapping a venue opens VenueDetailScreen
- Shows mutual favorites badge if both users favorited
- Displays friend's profile picture as section header

**SharedCollectionCarousel** (Horizontal scrolling component)
- Displays on HomeScreen when a friend shares a collection
- Shows "[Friend Name]'s [Collection Name]" (e.g., "Sarah's Date Night Spots")
- Horizontal scroll of venues from the collection
- Tapping opens VenueDetailScreen
- Shows collection follower count
- "Follow Collection" button to get updates

**FriendActivityFeed** (Compact feed component)
- Small section on HomeScreen showing recent friend activity
- Shows 3-5 most recent friend check-ins/favorites
- Compact cards with friend avatar, venue name, action type
- "See More" expands to show more activities
- Tapping activity opens VenueDetailScreen

**QuickShareButton** (Component on VenueDetailScreen)
- Share icon button on venue detail page
- Opens bottom sheet with friend list
- Select one or more friends to share venue
- Optional message field
- Sends as notification + creates shared venue entry

**CollectionManager** (Component on VenueDetailScreen)
- "Add to Collection" button on venue detail page
- Shows user's collections in bottom sheet
- Create new collection inline
- Select collection(s) to add venue
- Set privacy level per collection

**FriendSelector** (Reusable component)
- Used in share flows and collection sharing
- Searchable list of friends
- Shows friend avatars and names
- Multi-select with checkboxes
- Filter by close friends

**PrivacyBadge** (Small indicator component)
- Shows privacy level icon (public/friends/close friends/private)
- Used on collections and shared content
- Tapping shows privacy explanation tooltip

**MutualFavoritesIndicator** (Badge component)
- Shows "You & 3 friends love this" on venue cards
- Displays friend avatars in a stack
- Tapping shows list of friends who favorited


#### Social Components

**FriendCard**
```typescript
interface FriendCardProps {
  user: SocialProfile;
  relationship: 'friend' | 'follower' | 'following' | 'none';
  isCloseFriend?: boolean;
  mutualFriendsCount?: number;
  onPress: () => void;
  onActionPress?: (action: 'add' | 'remove' | 'follow' | 'unfollow') => void;
}
```

**ActivityFeedItem**
```typescript
interface ActivityFeedItemProps {
  activity: ActivityFeedEntry;
  onVenuePress: (venueId: string) => void;
  onUserPress: (userId: string) => void;
  onLike?: () => void;
  onComment?: () => void;
}
```

**CollectionCard**
```typescript
interface CollectionCardProps {
  collection: Collection;
  onPress: () => void;
  onFollow?: () => void;
  showFollowButton?: boolean;
}
```

**GroupOutingCard**
```typescript
interface GroupOutingCardProps {
  outing: GroupOuting;
  onPress: () => void;
  onRespond?: (response: 'interested' | 'going' | 'cant_go') => void;
  showResponseButtons?: boolean;
}
```

**PrivacySelector**
```typescript
interface PrivacySelectorProps {
  value: PrivacyLevel;
  onChange: (level: PrivacyLevel) => void;
  options?: PrivacyLevel[]; // Allow limiting available options
  showIcons?: boolean;
}
```

**UserSearchBar**
```typescript
interface UserSearchBarProps {
  onSearch: (query: string) => void;
  onUserSelect: (user: SocialProfile) => void;
  placeholder?: string;
  autoFocus?: boolean;
}
```

### Backend Services

#### FriendsService

```typescript
class FriendsService {
  // Friend requests
  static async sendFriendRequest(fromUserId: string, toUserId: string): Promise<FriendRequest>
  static async acceptFriendRequest(requestId: string): Promise<Friendship>
  static async declineFriendRequest(requestId: string): Promise<void>
  static async cancelFriendRequest(requestId: string): Promise<void>
  
  // Friend management
  static async removeFriend(userId: string, friendId: string): Promise<void>
  static async getFriends(userId: string, options?: PaginationOptions): Promise<SocialProfile[]>
  static async getFriendRequests(userId: string): Promise<FriendRequest[]>
  static async checkFriendship(userId: string, otherUserId: string): Promise<FriendshipStatus>
  
  // Close friends
  static async addCloseFriend(userId: string, friendId: string): Promise<void>
  static async removeCloseFriend(userId: string, friendId: string): Promise<void>
  static async getCloseFriends(userId: string): Promise<SocialProfile[]>
  static async isCloseFriend(userId: string, friendId: string): Promise<boolean>
  
  // Discovery
  static async getMutualFriends(userId: string, otherUserId: string): Promise<SocialProfile[]>
  static async getFriendSuggestions(userId: string, limit?: number): Promise<SocialProfile[]>
  static async searchUsers(query: string, currentUserId: string): Promise<SocialProfile[]>
}
```


#### FollowService

```typescript
class FollowService {
  // Follow management
  static async followUser(followerId: string, followingId: string): Promise<Follow | FollowRequest>
  static async unfollowUser(followerId: string, followingId: string): Promise<void>
  static async approveFollowRequest(requestId: string): Promise<Follow>
  static async denyFollowRequest(requestId: string): Promise<void>
  
  // Follower management
  static async removeFollower(userId: string, followerId: string): Promise<void>
  static async getFollowers(userId: string, options?: PaginationOptions): Promise<SocialProfile[]>
  static async getFollowing(userId: string, options?: PaginationOptions): Promise<SocialProfile[]>
  static async getFollowRequests(userId: string): Promise<FollowRequest[]>
  
  // Status checks
  static async checkFollowStatus(followerId: string, followingId: string): Promise<FollowStatus>
  static async getFollowerCount(userId: string): Promise<number>
  static async getFollowingCount(userId: string): Promise<number>
}
```

#### ActivityFeedService

```typescript
class ActivityFeedService {
  // Feed retrieval
  static async getActivityFeed(
    userId: string, 
    options: ActivityFeedOptions
  ): Promise<ActivityFeedResponse>
  
  // Activity creation (called by other services)
  static async createCheckInActivity(checkIn: CheckIn): Promise<void>
  static async createFavoriteActivity(favorite: Favorite): Promise<void>
  static async createCollectionActivity(collection: Collection, action: 'created' | 'updated'): Promise<void>
  
  // Interactions
  static async likeActivity(userId: string, activityId: string): Promise<void>
  static async unlikeActivity(userId: string, activityId: string): Promise<void>
  static async commentOnActivity(userId: string, activityId: string, comment: string): Promise<Comment>
  
  // Privacy filtering (internal)
  private static async filterByPrivacy(
    activities: ActivityFeedEntry[], 
    viewerId: string
  ): Promise<ActivityFeedEntry[]>
}

interface ActivityFeedOptions {
  limit?: number;
  offset?: number;
  filter?: 'all' | 'checkins' | 'favorites' | 'collections';
  includeFollowing?: boolean;
}

interface ActivityFeedResponse {
  activities: ActivityFeedEntry[];
  hasMore: boolean;
  total: number;
}
```

#### CollectionsService

```typescript
class CollectionsService {
  // Collection CRUD
  static async createCollection(data: CollectionCreate): Promise<Collection>
  static async updateCollection(collectionId: string, data: CollectionUpdate): Promise<Collection>
  static async deleteCollection(collectionId: string): Promise<void>
  static async getCollection(collectionId: string, viewerId?: string): Promise<Collection | null>
  static async getUserCollections(userId: string, viewerId?: string): Promise<Collection[]>
  
  // Venue management
  static async addVenueToCollection(collectionId: string, venueId: string, order?: number): Promise<void>
  static async removeVenueFromCollection(collectionId: string, venueId: string): Promise<void>
  static async reorderVenues(collectionId: string, venueOrders: VenueOrder[]): Promise<void>
  static async getCollectionVenues(collectionId: string): Promise<Venue[]>
  
  // Following
  static async followCollection(userId: string, collectionId: string): Promise<void>
  static async unfollowCollection(userId: string, collectionId: string): Promise<void>
  static async getCollectionFollowers(collectionId: string): Promise<SocialProfile[]>
  static async isFollowingCollection(userId: string, collectionId: string): Promise<boolean>
  
  // Discovery
  static async getPopularCollections(limit?: number): Promise<Collection[]>
  static async searchCollections(query: string, viewerId?: string): Promise<Collection[]>
}
```


#### GroupOutingsService

```typescript
class GroupOutingsService {
  // Outing CRUD
  static async createGroupOuting(data: GroupOutingCreate): Promise<GroupOuting>
  static async updateGroupOuting(outingId: string, data: GroupOutingUpdate): Promise<GroupOuting>
  static async deleteGroupOuting(outingId: string): Promise<void>
  static async getGroupOuting(outingId: string): Promise<GroupOuting | null>
  static async getUserGroupOutings(userId: string, filter?: 'upcoming' | 'past'): Promise<GroupOuting[]>
  
  // Invitations
  static async inviteFriends(outingId: string, friendIds: string[]): Promise<void>
  static async respondToInvite(inviteId: string, response: OutingResponse): Promise<void>
  static async getOutingInvites(userId: string): Promise<GroupOutingInvite[]>
  static async getOutingResponses(outingId: string): Promise<GroupOutingInvite[]>
  
  // Reminders
  static async sendOutingReminders(outingId: string): Promise<void>
}

type OutingResponse = 'interested' | 'going' | 'cant_go';
```

#### VenueShareService

```typescript
class VenueShareService {
  // Sharing
  static async shareVenue(
    fromUserId: string, 
    venueId: string, 
    toUserIds: string[], 
    message?: string
  ): Promise<VenueShare[]>
  
  static async getReceivedShares(userId: string): Promise<VenueShare[]>
  static async getSentShares(userId: string): Promise<VenueShare[]>
  static async markShareAsViewed(shareId: string): Promise<void>
  
  // Analytics
  static async getVenueShareCount(venueId: string): Promise<number>
  static async getShareViewCount(shareId: string): Promise<number>
}
```

#### SocialProfileService

```typescript
class SocialProfileService {
  // Profile management
  static async getSocialProfile(userId: string, viewerId?: string): Promise<SocialProfile>
  static async updateSocialProfile(userId: string, data: SocialProfileUpdate): Promise<SocialProfile>
  
  // Privacy settings
  static async updatePrivacySettings(userId: string, settings: PrivacySettings): Promise<void>
  static async getPrivacySettings(userId: string): Promise<PrivacySettings>
  
  // Blocking and reporting
  static async blockUser(userId: string, blockedUserId: string): Promise<void>
  static async unblockUser(userId: string, blockedUserId: string): Promise<void>
  static async getBlockedUsers(userId: string): Promise<SocialProfile[]>
  static async isBlocked(userId: string, otherUserId: string): Promise<boolean>
  static async reportUser(reporterId: string, reportedUserId: string, reason: string): Promise<void>
  
  // Stats
  static async getSocialStats(userId: string): Promise<SocialStats>
}
```

#### NotificationService (Extended)

```typescript
class NotificationService {
  // Social notifications
  static async sendFriendRequestNotification(fromUserId: string, toUserId: string): Promise<void>
  static async sendFriendAcceptedNotification(fromUserId: string, toUserId: string): Promise<void>
  static async sendVenueShareNotification(share: VenueShare): Promise<void>
  static async sendGroupOutingInviteNotification(invite: GroupOutingInvite): Promise<void>
  static async sendCollectionFollowNotification(followerId: string, collectionId: string): Promise<void>
  static async sendActivityNotification(activity: ActivityFeedEntry, recipientIds: string[]): Promise<void>
  
  // Notification management
  static async getSocialNotifications(userId: string, options?: PaginationOptions): Promise<SocialNotification[]>
  static async markNotificationAsRead(notificationId: string): Promise<void>
  static async markAllNotificationsAsRead(userId: string): Promise<void>
  static async getUnreadNotificationCount(userId: string): Promise<number>
  
  // Preferences
  static async updateNotificationPreferences(userId: string, prefs: NotificationPreferences): Promise<void>
  static async getNotificationPreferences(userId: string): Promise<NotificationPreferences>
}
```


## Data Models

### Core Social Types

```typescript
// Privacy levels
type PrivacyLevel = 'public' | 'friends' | 'close_friends' | 'private';

// Friendship
interface Friendship {
  id: string;
  user_id_1: string;
  user_id_2: string;
  is_close_friend_1: boolean; // user_id_1 marked user_id_2 as close friend
  is_close_friend_2: boolean; // user_id_2 marked user_id_1 as close friend
  created_at: string;
}

interface FriendRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
}

type FriendshipStatus = 
  | { type: 'none' }
  | { type: 'pending_sent' }
  | { type: 'pending_received' }
  | { type: 'friends'; isCloseFriend: boolean };

// Following
interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

interface FollowRequest {
  id: string;
  follower_id: string;
  following_id: string;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  updated_at: string;
}

type FollowStatus =
  | { type: 'not_following' }
  | { type: 'pending' }
  | { type: 'following' };

// Social Profile
interface SocialProfile {
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

interface SocialStats {
  friend_count: number;
  follower_count: number;
  following_count: number;
  checkin_count: number;
  collection_count: number;
  venue_share_count: number;
}

// Privacy Settings
interface PrivacySettings {
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

// Blocked Users
interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

// User Reports
interface UserReport {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}
```


### Activity Feed Types

```typescript
interface ActivityFeedEntry {
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
  
  // Engagement (computed)
  like_count?: number;
  comment_count?: number;
  user_has_liked?: boolean;
}

interface ActivityLike {
  id: string;
  activity_id: string;
  user_id: string;
  created_at: string;
}

interface ActivityComment {
  id: string;
  activity_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  
  // Joined data
  user?: SocialProfile;
}
```

### Collection Types

```typescript
interface Collection {
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

interface CollectionCreate {
  user_id: string;
  name: string;
  description?: string;
  privacy_level?: PrivacyLevel;
}

interface CollectionUpdate {
  name?: string;
  description?: string;
  privacy_level?: PrivacyLevel;
  cover_image_url?: string;
}

interface CollectionVenue {
  id: string;
  collection_id: string;
  venue_id: string;
  order: number; // For custom ordering
  added_at: string;
}

interface VenueOrder {
  venue_id: string;
  order: number;
}

interface CollectionFollow {
  id: string;
  user_id: string;
  collection_id: string;
  created_at: string;
}
```

### Group Outing Types

```typescript
interface GroupOuting {
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

interface GroupOutingCreate {
  creator_id: string;
  venue_id: string;
  title: string;
  description?: string;
  scheduled_date: string;
  invited_friend_ids: string[];
}

interface GroupOutingUpdate {
  title?: string;
  description?: string;
  scheduled_date?: string;
}

interface GroupOutingInvite {
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
```


### Venue Share Types

```typescript
interface VenueShare {
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
```

### Notification Types

```typescript
interface SocialNotification {
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

type NotificationType =
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
  | 'friend_checkin_nearby';

interface NotificationPreferences {
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
```

## Database Schema

### Tables

```sql
-- Friendships (bidirectional)
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id_2 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_close_friend_1 BOOLEAN DEFAULT false,
  is_close_friend_2 BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure user_id_1 < user_id_2 for consistent ordering
  CONSTRAINT friendship_order CHECK (user_id_1 < user_id_2),
  CONSTRAINT no_self_friendship CHECK (user_id_1 != user_id_2),
  UNIQUE(user_id_1, user_id_2)
);

CREATE INDEX idx_friendships_user1 ON friendships(user_id_1);
CREATE INDEX idx_friendships_user2 ON friendships(user_id_2);
CREATE INDEX idx_friendships_close1 ON friendships(user_id_1) WHERE is_close_friend_1 = true;
CREATE INDEX idx_friendships_close2 ON friendships(user_id_2) WHERE is_close_friend_2 = true;

-- Friend Requests
CREATE TABLE friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT no_self_request CHECK (from_user_id != to_user_id),
  UNIQUE(from_user_id, to_user_id)
);

CREATE INDEX idx_friend_requests_to ON friend_requests(to_user_id) WHERE status = 'pending';
CREATE INDEX idx_friend_requests_from ON friend_requests(from_user_id);
```


```sql
-- Follows (unidirectional)
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT no_self_follow CHECK (follower_id != following_id),
  UNIQUE(follower_id, following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- Follow Requests (for private accounts)
CREATE TABLE follow_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT no_self_follow_request CHECK (follower_id != following_id),
  UNIQUE(follower_id, following_id)
);

CREATE INDEX idx_follow_requests_following ON follow_requests(following_id) WHERE status = 'pending';

-- Privacy Settings
CREATE TABLE privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends', 'private')),
  checkin_visibility VARCHAR(20) DEFAULT 'friends' CHECK (checkin_visibility IN ('public', 'friends', 'close_friends', 'private')),
  favorite_visibility VARCHAR(20) DEFAULT 'friends' CHECK (favorite_visibility IN ('public', 'friends', 'close_friends', 'private')),
  default_collection_visibility VARCHAR(20) DEFAULT 'friends' CHECK (default_collection_visibility IN ('public', 'friends', 'close_friends', 'private')),
  allow_follow_requests BOOLEAN DEFAULT true,
  show_activity_status BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blocked Users
CREATE TABLE blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT no_self_block CHECK (blocker_id != blocked_id),
  UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked ON blocked_users(blocked_id);

-- User Reports
CREATE TABLE user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_reports_status ON user_reports(status);
CREATE INDEX idx_user_reports_reported ON user_reports(reported_id);
```


```sql
-- Collections
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  privacy_level VARCHAR(20) DEFAULT 'friends' CHECK (privacy_level IN ('public', 'friends', 'close_friends', 'private')),
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_collections_user ON collections(user_id);
CREATE INDEX idx_collections_privacy ON collections(privacy_level);

-- Collection Venues (many-to-many with ordering)
CREATE TABLE collection_venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(collection_id, venue_id)
);

CREATE INDEX idx_collection_venues_collection ON collection_venues(collection_id);
CREATE INDEX idx_collection_venues_venue ON collection_venues(venue_id);
CREATE INDEX idx_collection_venues_order ON collection_venues(collection_id, "order");

-- Collection Follows
CREATE TABLE collection_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, collection_id)
);

CREATE INDEX idx_collection_follows_user ON collection_follows(user_id);
CREATE INDEX idx_collection_follows_collection ON collection_follows(collection_id);

-- Group Outings
CREATE TABLE group_outings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_group_outings_creator ON group_outings(creator_id);
CREATE INDEX idx_group_outings_venue ON group_outings(venue_id);
CREATE INDEX idx_group_outings_date ON group_outings(scheduled_date);

-- Group Outing Invites
CREATE TABLE group_outing_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_outing_id UUID NOT NULL REFERENCES group_outings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  response VARCHAR(20) DEFAULT 'no_response' CHECK (response IN ('interested', 'going', 'cant_go', 'no_response')),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(group_outing_id, user_id)
);

CREATE INDEX idx_group_outing_invites_outing ON group_outing_invites(group_outing_id);
CREATE INDEX idx_group_outing_invites_user ON group_outing_invites(user_id);
CREATE INDEX idx_group_outing_invites_response ON group_outing_invites(user_id, response);
```


```sql
-- Venue Shares
CREATE TABLE venue_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  message TEXT,
  viewed BOOLEAN DEFAULT false,
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_venue_shares_to ON venue_shares(to_user_id);
CREATE INDEX idx_venue_shares_from ON venue_shares(from_user_id);
CREATE INDEX idx_venue_shares_venue ON venue_shares(venue_id);
CREATE INDEX idx_venue_shares_unviewed ON venue_shares(to_user_id) WHERE viewed = false;

-- Activity Feed
CREATE TABLE activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('checkin', 'favorite', 'collection_created', 'collection_updated', 'group_outing')),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  group_outing_id UUID REFERENCES group_outings(id) ON DELETE CASCADE,
  privacy_level VARCHAR(20) NOT NULL CHECK (privacy_level IN ('public', 'friends', 'close_friends', 'private')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_feed_user ON activity_feed(user_id);
CREATE INDEX idx_activity_feed_type ON activity_feed(activity_type);
CREATE INDEX idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX idx_activity_feed_privacy ON activity_feed(privacy_level);
CREATE INDEX idx_activity_feed_venue ON activity_feed(venue_id);

-- Activity Likes
CREATE TABLE activity_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activity_feed(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(activity_id, user_id)
);

CREATE INDEX idx_activity_likes_activity ON activity_likes(activity_id);
CREATE INDEX idx_activity_likes_user ON activity_likes(user_id);

-- Activity Comments
CREATE TABLE activity_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activity_feed(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_comments_activity ON activity_comments(activity_id);
CREATE INDEX idx_activity_comments_user ON activity_comments(user_id);
CREATE INDEX idx_activity_comments_created ON activity_comments(created_at DESC);

-- Social Notifications
CREATE TABLE social_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reference_id UUID,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_social_notifications_user ON social_notifications(user_id);
CREATE INDEX idx_social_notifications_unread ON social_notifications(user_id) WHERE read = false;
CREATE INDEX idx_social_notifications_type ON social_notifications(type);
CREATE INDEX idx_social_notifications_created ON social_notifications(created_at DESC);

-- Notification Preferences
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  friend_requests BOOLEAN DEFAULT true,
  friend_accepted BOOLEAN DEFAULT true,
  follow_requests BOOLEAN DEFAULT true,
  new_followers BOOLEAN DEFAULT true,
  venue_shares BOOLEAN DEFAULT true,
  group_outing_invites BOOLEAN DEFAULT true,
  group_outing_reminders BOOLEAN DEFAULT true,
  collection_follows BOOLEAN DEFAULT true,
  collection_updates BOOLEAN DEFAULT false,
  activity_likes BOOLEAN DEFAULT false,
  activity_comments BOOLEAN DEFAULT true,
  friend_checkins_nearby BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```


### Row Level Security (RLS) Policies

```sql
-- Friendships RLS
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

CREATE POLICY "Users can create friendships (via friend request acceptance)"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

CREATE POLICY "Users can update their close friend designation"
  ON friendships FOR UPDATE
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

CREATE POLICY "Users can delete their own friendships"
  ON friendships FOR DELETE
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Friend Requests RLS
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view friend requests involving them"
  ON friend_requests FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create friend requests"
  ON friend_requests FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Recipients can update friend requests"
  ON friend_requests FOR UPDATE
  USING (auth.uid() = to_user_id);

CREATE POLICY "Users can delete their own sent requests"
  ON friend_requests FOR DELETE
  USING (auth.uid() = from_user_id);

-- Follows RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view follows involving them"
  ON follows FOR SELECT
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can create follows"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- Blocked Users RLS
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own blocks"
  ON blocked_users FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create blocks"
  ON blocked_users FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks"
  ON blocked_users FOR DELETE
  USING (auth.uid() = blocker_id);

-- Collections RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view collections based on privacy"
  ON collections FOR SELECT
  USING (
    user_id = auth.uid() OR
    privacy_level = 'public' OR
    (privacy_level = 'friends' AND EXISTS (
      SELECT 1 FROM friendships f
      WHERE (f.user_id_1 = auth.uid() AND f.user_id_2 = collections.user_id)
         OR (f.user_id_2 = auth.uid() AND f.user_id_1 = collections.user_id)
    )) OR
    (privacy_level = 'close_friends' AND EXISTS (
      SELECT 1 FROM friendships f
      WHERE ((f.user_id_1 = auth.uid() AND f.user_id_2 = collections.user_id AND f.is_close_friend_2 = true)
         OR (f.user_id_2 = auth.uid() AND f.user_id_1 = collections.user_id AND f.is_close_friend_1 = true))
    ))
  );

CREATE POLICY "Users can create their own collections"
  ON collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
  ON collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
  ON collections FOR DELETE
  USING (auth.uid() = user_id);
```


```sql
-- Activity Feed RLS
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activity feed based on privacy and relationships"
  ON activity_feed FOR SELECT
  USING (
    user_id = auth.uid() OR
    privacy_level = 'public' OR
    (privacy_level = 'friends' AND EXISTS (
      SELECT 1 FROM friendships f
      WHERE (f.user_id_1 = auth.uid() AND f.user_id_2 = activity_feed.user_id)
         OR (f.user_id_2 = auth.uid() AND f.user_id_1 = activity_feed.user_id)
    )) OR
    (privacy_level = 'close_friends' AND EXISTS (
      SELECT 1 FROM friendships f
      WHERE ((f.user_id_1 = auth.uid() AND f.user_id_2 = activity_feed.user_id AND f.is_close_friend_2 = true)
         OR (f.user_id_2 = auth.uid() AND f.user_id_1 = activity_feed.user_id AND f.is_close_friend_1 = true))
    )) OR
    EXISTS (SELECT 1 FROM follows WHERE follower_id = auth.uid() AND following_id = activity_feed.user_id)
  );

CREATE POLICY "Users can create their own activities"
  ON activity_feed FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Social Notifications RLS
ALTER TABLE social_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON social_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON social_notifications FOR UPDATE
  USING (auth.uid() = user_id);
```

### Database Functions

```sql
-- Check if two users are friends
CREATE OR REPLACE FUNCTION are_friends(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM friendships
    WHERE (user_id_1 = LEAST(user1_id, user2_id) AND user_id_2 = GREATEST(user1_id, user2_id))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user1 marked user2 as close friend
CREATE OR REPLACE FUNCTION is_close_friend(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_close BOOLEAN;
BEGIN
  SELECT CASE
    WHEN user_id_1 = user1_id THEN is_close_friend_1
    WHEN user_id_2 = user1_id THEN is_close_friend_2
    ELSE false
  END INTO is_close
  FROM friendships
  WHERE (user_id_1 = LEAST(user1_id, user2_id) AND user_id_2 = GREATEST(user1_id, user2_id));
  
  RETURN COALESCE(is_close, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user1 is following user2
CREATE OR REPLACE FUNCTION is_following(follower_id UUID, following_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM follows
    WHERE follows.follower_id = is_following.follower_id 
      AND follows.following_id = is_following.following_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user1 is blocked by user2
CREATE OR REPLACE FUNCTION is_blocked(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_users
    WHERE blocker_id = user2_id AND blocked_id = user1_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```


```sql
-- Get mutual friends between two users
CREATE OR REPLACE FUNCTION get_mutual_friends(user1_id UUID, user2_id UUID)
RETURNS TABLE(user_id UUID, name TEXT, avatar_url TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.id, p.name, p.avatar_url
  FROM profiles p
  WHERE p.id IN (
    -- Friends of user1
    SELECT CASE 
      WHEN f1.user_id_1 = user1_id THEN f1.user_id_2
      ELSE f1.user_id_1
    END
    FROM friendships f1
    WHERE user1_id IN (f1.user_id_1, f1.user_id_2)
    
    INTERSECT
    
    -- Friends of user2
    SELECT CASE 
      WHEN f2.user_id_1 = user2_id THEN f2.user_id_2
      ELSE f2.user_id_1
    END
    FROM friendships f2
    WHERE user2_id IN (f2.user_id_1, f2.user_id_2)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get activity feed for a user with privacy filtering
CREATE OR REPLACE FUNCTION get_activity_feed(
  viewer_id UUID,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  activity_type VARCHAR,
  venue_id UUID,
  collection_id UUID,
  group_outing_id UUID,
  privacy_level VARCHAR,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    af.id,
    af.user_id,
    af.activity_type,
    af.venue_id,
    af.collection_id,
    af.group_outing_id,
    af.privacy_level,
    af.metadata,
    af.created_at
  FROM activity_feed af
  WHERE 
    -- Not blocked
    NOT is_blocked(viewer_id, af.user_id) AND
    NOT is_blocked(af.user_id, viewer_id) AND
    -- Privacy filtering
    (
      af.user_id = viewer_id OR
      af.privacy_level = 'public' OR
      (af.privacy_level = 'friends' AND are_friends(viewer_id, af.user_id)) OR
      (af.privacy_level = 'close_friends' AND is_close_friend(af.user_id, viewer_id)) OR
      is_following(viewer_id, af.user_id)
    )
  ORDER BY af.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get friend suggestions based on mutual friends
CREATE OR REPLACE FUNCTION get_friend_suggestions(
  for_user_id UUID,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(
  user_id UUID,
  name TEXT,
  avatar_url TEXT,
  mutual_friend_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_friends AS (
    SELECT CASE 
      WHEN f.user_id_1 = for_user_id THEN f.user_id_2
      ELSE f.user_id_1
    END AS friend_id
    FROM friendships f
    WHERE for_user_id IN (f.user_id_1, f.user_id_2)
  ),
  friends_of_friends AS (
    SELECT CASE 
      WHEN f.user_id_1 = uf.friend_id THEN f.user_id_2
      ELSE f.user_id_1
    END AS suggested_user_id
    FROM friendships f
    JOIN user_friends uf ON uf.friend_id IN (f.user_id_1, f.user_id_2)
    WHERE CASE 
      WHEN f.user_id_1 = uf.friend_id THEN f.user_id_2
      ELSE f.user_id_1
    END != for_user_id
  )
  SELECT 
    p.id,
    p.name,
    p.avatar_url,
    COUNT(*)::BIGINT AS mutual_friend_count
  FROM friends_of_friends fof
  JOIN profiles p ON p.id = fof.suggested_user_id
  WHERE 
    -- Not already friends
    NOT are_friends(for_user_id, fof.suggested_user_id) AND
    -- Not blocked
    NOT is_blocked(for_user_id, fof.suggested_user_id) AND
    NOT is_blocked(fof.suggested_user_id, for_user_id) AND
    -- No pending friend request
    NOT EXISTS (
      SELECT 1 FROM friend_requests fr
      WHERE (fr.from_user_id = for_user_id AND fr.to_user_id = fof.suggested_user_id)
         OR (fr.from_user_id = fof.suggested_user_id AND fr.to_user_id = for_user_id)
    )
  GROUP BY p.id, p.name, p.avatar_url
  ORDER BY mutual_friend_count DESC, p.name
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Friend Management Properties

**Property 1: Friend request creation**
*For any* two distinct users, when a friend request is sent, a pending friend_request record should be created with the correct from_user_id and to_user_id.
**Validates: Requirements 1.2**

**Property 2: No duplicate friend requests**
*For any* two users, attempting to create multiple friend requests between them should result in only one pending request existing.
**Validates: Requirements 1.8**

**Property 3: No self-friend requests**
*For any* user, attempting to send a friend request to themselves should be rejected.
**Validates: Requirements 1.9**

**Property 4: Friend request acceptance creates friendship**
*For any* pending friend request, when accepted, a bidirectional friendship record should be created and the friend request should be removed.
**Validates: Requirements 1.4**

**Property 5: Friend request decline cleanup**
*For any* pending friend request, when declined, the friend request should be deleted and no friendship should exist.
**Validates: Requirements 1.5**

**Property 6: Friendship removal is bidirectional**
*For any* friendship, when one user removes the friend, the friendship should be deleted for both users.
**Validates: Requirements 1.7**

**Property 7: Close friend designation**
*For any* friendship, when a user designates the friend as close, the appropriate close_friend flag should be set without affecting the other user's designation.
**Validates: Requirements 1.10, 1.13**

**Property 8: Friends list query correctness**
*For any* user, querying their friends list should return exactly the set of users with whom they have an accepted friendship.
**Validates: Requirements 1.6**

**Property 9: Close friends list filtering**
*For any* user, querying their close friends list should return only friends they have designated as close friends.
**Validates: Requirements 1.12**

### Follow System Properties

**Property 10: Public account follow is immediate**
*For any* user with public follow settings, when another user follows them, a follow relationship should be created immediately without requiring approval.
**Validates: Requirements 2.1**

**Property 11: Private account follow requires approval**
*For any* user with private follow settings, when another user attempts to follow them, a pending follow_request should be created instead of a follow relationship.
**Validates: Requirements 2.2**

**Property 12: No self-follows**
*For any* user, attempting to follow themselves should be rejected.
**Validates: Requirements 2.9**

**Property 13: Follow request approval creates follow**
*For any* pending follow request, when approved, a follow relationship should be created and the request should be removed.
**Validates: Requirements 2.3**

**Property 14: Follow request denial cleanup**
*For any* pending follow request, when denied, the request should be deleted and no follow relationship should exist.
**Validates: Requirements 2.4**

**Property 15: Unfollow removes relationship**
*For any* follow relationship, when the follower unfollows, the follow record should be deleted.
**Validates: Requirements 2.5**

**Property 16: Follower removal by followee**
*For any* follow relationship, the user being followed should be able to remove the follower, deleting the follow record.
**Validates: Requirements 2.10**

**Property 17: Follow independence from friendship**
*For any* two users, follow relationships should be independent of friendship status—users can follow non-friends.
**Validates: Requirements 2.8**

**Property 18: Follower and following counts**
*For any* user, their follower count should equal the number of follow records where they are the following_id, and their following count should equal the number where they are the follower_id.
**Validates: Requirements 2.11**


### Privacy and Access Control Properties

**Property 19: Activity feed privacy filtering**
*For any* activity feed query by a viewer, all returned activities should be visible to that viewer based on the activity's privacy_level and the viewer's relationship to the activity creator (friend, close friend, follower, or self).
**Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6**

**Property 20: Close friends content visibility**
*For any* activity with close_friends privacy level, only users designated as close friends by the creator should see the activity in their feed.
**Validates: Requirements 3.7**

**Property 21: Friends-only content visibility**
*For any* activity with friends privacy level, only friends of the creator should see the activity in their feed.
**Validates: Requirements 3.8**

**Property 22: Public content visibility**
*For any* activity with public privacy level, all users including followers should see the activity in their feed.
**Validates: Requirements 3.9**

**Property 23: Private content invisibility**
*For any* activity with private privacy level, no users except the creator should see the activity in any feed.
**Validates: Requirements 3.10**

**Property 24: Collection privacy enforcement**
*For any* collection query by a viewer, the collection should only be returned if the viewer has permission based on the collection's privacy_level and their relationship to the creator.
**Validates: Requirements 5.8**

**Property 25: Block prevents all interactions**
*For any* two users where one has blocked the other, no social interactions should be possible between them (friend requests, follows, shares, activity visibility).
**Validates: Requirements 8.16, 8.17**

**Property 26: Block removes existing relationships**
*For any* block action, all existing friendships and follow relationships between the two users should be removed.
**Validates: Requirements 8.16**

**Property 27: Profile visibility enforcement**
*For any* profile query by a viewer, the amount of profile information returned should respect the profile owner's profile_visibility setting and their relationship to the viewer.
**Validates: Requirements 8.12, 8.13**

### Collection Properties

**Property 28: Collection creation**
*For any* valid collection data, creating a collection should result in a collection record with the specified name, description, and privacy level.
**Validates: Requirements 5.1**

**Property 29: Venue addition to collection**
*For any* collection and venue, adding the venue should create a collection_venue association with the correct order.
**Validates: Requirements 5.2**

**Property 30: Venue removal from collection**
*For any* collection_venue association, removing the venue should delete the association.
**Validates: Requirements 5.3**

**Property 31: Collection venue ordering**
*For any* collection, the venues should be returned in the order specified by the order field in collection_venues.
**Validates: Requirements 5.6**

**Property 32: Collection following**
*For any* public or friends-visible collection, when a user follows it, a collection_follow record should be created.
**Validates: Requirements 5.9**

**Property 33: Collection follower count**
*For any* collection, the follower count should equal the number of collection_follow records for that collection.
**Validates: Requirements 5.11**

### Group Outing Properties

**Property 34: Group outing creation**
*For any* valid group outing data, creating an outing should result in a group_outing record and group_outing_invite records for all invited friends.
**Validates: Requirements 6.1, 6.2**

**Property 35: Group outing invitation response**
*For any* group outing invite, when a friend responds, their invite record should be updated with the response and responded_at timestamp.
**Validates: Requirements 6.4**

**Property 36: Group outing response counts**
*For any* group outing, the response counts should accurately reflect the number of invites with each response type.
**Validates: Requirements 6.5**

### Venue Sharing Properties

**Property 37: Venue share creation**
*For any* venue share to multiple friends, a venue_share record should be created for each recipient with the correct venue_id and message.
**Validates: Requirements 4.3**

**Property 38: Venue share notification**
*For any* venue share, a notification should be created for each recipient.
**Validates: Requirements 4.4**

**Property 39: Share view tracking**
*For any* venue share, when viewed by the recipient, the viewed flag should be set to true and viewed_at should be set to the current timestamp.
**Validates: Requirements 4.5**


### Notification Properties

**Property 40: Friend request notification**
*For any* friend request, a notification should be created for the recipient with type 'friend_request'.
**Validates: Requirements 9.1**

**Property 41: Friend accepted notification**
*For any* accepted friend request, a notification should be created for the requester with type 'friend_accepted'.
**Validates: Requirements 9.2**

**Property 42: Venue share notification**
*For any* venue share, a notification should be created for each recipient with type 'venue_share' and venue preview data.
**Validates: Requirements 9.3**

**Property 43: Group outing invite notification**
*For any* group outing invitation, a notification should be created for each invited friend with type 'group_outing_invite'.
**Validates: Requirements 9.4**

**Property 44: Notification read status**
*For any* notification, when marked as read, the read flag should be set to true and read_at should be set to the current timestamp.
**Validates: Requirements 9.10**

### Search and Discovery Properties

**Property 45: User search results**
*For any* search query, all returned users should have names or usernames that match the query (case-insensitive).
**Validates: Requirements 1.1**

**Property 46: Friend suggestions have mutual friends**
*For any* friend suggestion, the suggested user should have at least one mutual friend with the requesting user.
**Validates: Requirements 10.2, 10.3**

**Property 47: Friend suggestions exclude existing relationships**
*For any* friend suggestion list, no suggested users should already be friends with the requesting user or have pending friend requests.
**Validates: Requirements 10.2**

**Property 48: Blocked users excluded from search**
*For any* user search or friend suggestion, users who have blocked the searcher or are blocked by the searcher should not appear in results.
**Validates: Requirements 8.17**

### Data Integrity Properties

**Property 49: Friendship symmetry**
*For any* friendship record, both users should see each other in their friends list.
**Validates: Requirements 1.6, 1.7**

**Property 50: Activity feed chronological ordering**
*For any* activity feed query, activities should be returned in descending order by created_at timestamp.
**Validates: Requirements 3.1**

**Property 51: Activity feed pagination consistency**
*For any* paginated activity feed query, consecutive pages should not overlap and should cover all accessible activities.
**Validates: Requirements 3.13**

**Property 52: Collection venue uniqueness**
*For any* collection, each venue should appear at most once in the collection.
**Validates: Requirements 5.2**

**Property 53: Social stats accuracy**
*For any* user, their social stats (friend count, follower count, following count) should match the actual count of relationships in the database.
**Validates: Requirements 7.2, 11.1**

## Error Handling

### Client-Side Error Handling

**Network Errors**
- All API calls wrapped in try-catch blocks
- Display user-friendly error messages
- Implement retry logic for transient failures
- Show offline indicators when network unavailable

**Validation Errors**
- Validate inputs before API calls (e.g., non-empty collection names, valid dates for group outings)
- Show inline validation errors on forms
- Prevent submission of invalid data

**Permission Errors**
- Handle 403 Forbidden responses gracefully
- Show appropriate messages when users lack permissions
- Redirect to appropriate screens (e.g., login if session expired)

**Not Found Errors**
- Handle 404 responses for deleted or inaccessible content
- Show "Content not available" messages
- Provide navigation back to previous screen


### Server-Side Error Handling

**Database Constraint Violations**
- Unique constraint violations (duplicate friend requests, follows): Return 409 Conflict
- Foreign key violations (invalid user/venue IDs): Return 400 Bad Request
- Check constraint violations (self-friend, self-follow): Return 400 Bad Request

**RLS Policy Violations**
- Unauthorized access attempts: Return 403 Forbidden
- Log security violations for monitoring
- Rate limit repeated violations

**Concurrent Modification**
- Handle race conditions in friend request acceptance (two users accepting simultaneously)
- Use database transactions for atomic operations
- Implement optimistic locking where appropriate

**Data Consistency**
- Validate privacy settings before creating activities
- Ensure blocked users cannot interact
- Verify relationships exist before operations (e.g., can't remove non-existent friend)

### Error Recovery Strategies

**Optimistic Updates**
- Update UI immediately for better UX
- Rollback on server error
- Show error toast and restore previous state

**Retry Logic**
- Exponential backoff for transient failures
- Maximum retry attempts (3)
- User option to manually retry

**Graceful Degradation**
- Show cached data when offline
- Queue actions for later sync
- Indicate stale data with visual cues

## Testing Strategy

### Unit Testing

**Service Layer Tests**
- Test each service method with valid inputs
- Test error cases (invalid IDs, missing data)
- Test permission checks
- Mock Supabase client for isolation

**Hook Tests**
- Test custom hooks with React Testing Library
- Test loading states
- Test error states
- Test data transformations
- Mock service layer

**Component Tests**
- Test component rendering with various props
- Test user interactions (button clicks, form submissions)
- Test conditional rendering based on state
- Mock hooks and contexts

### Property-Based Testing

**Test Configuration**
- Use fast-check library for TypeScript property-based testing
- Minimum 100 iterations per property test
- Each test references its design document property

**Generators**
- User generator: random UUIDs, names, emails
- Friendship generator: random user pairs with valid ordering
- Privacy level generator: random selection from enum
- Activity generator: random activities with valid privacy levels
- Collection generator: random collections with venues

**Property Test Examples**

```typescript
// Property 2: No duplicate friend requests
test('Property 2: No duplicate friend requests', () => {
  fc.assert(
    fc.asyncProperty(
      fc.uuid(), // user1
      fc.uuid(), // user2
      async (user1Id, user2Id) => {
        fc.pre(user1Id !== user2Id); // Ensure distinct users
        
        // Send first request
        await FriendsService.sendFriendRequest(user1Id, user2Id);
        
        // Attempt to send duplicate
        const result = await FriendsService.sendFriendRequest(user1Id, user2Id);
        
        // Should either return existing request or throw error
        const requests = await FriendsService.getFriendRequests(user2Id);
        const matchingRequests = requests.filter(
          r => r.from_user_id === user1Id && r.to_user_id === user2Id
        );
        
        expect(matchingRequests.length).toBe(1);
      }
    ),
    { numRuns: 100 }
  );
});

// Property 19: Activity feed privacy filtering
test('Property 19: Activity feed privacy filtering', () => {
  fc.assert(
    fc.asyncProperty(
      fc.uuid(), // viewer
      fc.array(activityGenerator()), // activities
      async (viewerId, activities) => {
        // Insert activities into database
        for (const activity of activities) {
          await ActivityFeedService.createActivity(activity);
        }
        
        // Query feed
        const feed = await ActivityFeedService.getActivityFeed(viewerId, {
          limit: 100
        });
        
        // Verify all returned activities are visible to viewer
        for (const activity of feed.activities) {
          const hasPermission = await checkPrivacyAccess(
            viewerId,
            activity.user_id,
            activity.privacy_level
          );
          expect(hasPermission).toBe(true);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```


### Integration Testing

**API Integration Tests**
- Test complete user flows (send friend request → accept → view friends list)
- Test privacy enforcement across multiple operations
- Test notification delivery
- Use test database with seeded data

**Real-time Subscription Tests**
- Test Supabase real-time subscriptions for friend requests
- Test activity feed updates
- Test notification delivery
- Mock WebSocket connections

### End-to-End Testing

**Critical User Flows**
1. Friend connection flow: Search → Send request → Accept → View friends
2. Activity feed flow: Check in → Friend sees activity → Like activity
3. Collection flow: Create collection → Add venues → Share with friends
4. Group outing flow: Create outing → Invite friends → Friends respond
5. Privacy flow: Change privacy settings → Verify content visibility changes

**Testing Tools**
- Detox for React Native E2E testing
- Test on both iOS and Android
- Test with real Supabase instance (staging environment)

### Performance Testing

**Load Testing**
- Test activity feed query performance with 1000+ activities
- Test friend list query with 500+ friends
- Test search with large user base
- Measure and optimize slow queries

**Stress Testing**
- Concurrent friend requests
- Rapid follow/unfollow actions
- Bulk notification delivery
- Database connection pool limits

### Security Testing

**Authorization Tests**
- Verify RLS policies prevent unauthorized access
- Test blocked user restrictions
- Test privacy level enforcement
- Attempt to access other users' private data

**Input Validation Tests**
- SQL injection attempts
- XSS attempts in user-generated content
- Invalid UUID formats
- Malformed JSON payloads

## Implementation Notes

### MVP Implementation Notes

**Phase 1: Core Infrastructure (Week 1)**
- Database schema for friendships, collections, venue_shares
- RLS policies for privacy enforcement
- Basic service layer (FriendsService, CollectionsService)

**Phase 2: Friend System (Week 2)**
- Friend request flow (send/accept/decline)
- Friends list in Settings
- Friend search
- Privacy settings UI

**Phase 3: Collections & Sharing (Week 3-4)**
- Collection CRUD operations
- Add venues to collections
- Share venues with friends
- SharedCollectionCarousel component
- FriendVenueCarousel component

**Phase 4: Activity Feed & Polish (Week 5-6)**
- Activity feed data model
- FriendActivityFeed component
- Notifications for shares and friend requests
- Bug fixes and polish

### Migration Strategy

**Existing Users**
- Create default privacy settings (friends-only) for all existing users
- No data migration needed for new tables
- Announce new features via in-app announcement

**Backward Compatibility**
- Existing check-in and favorite functionality unchanged
- Activity feed is additive (doesn't break existing features)
- Privacy settings default to safe values

### Performance Optimizations

**Database Indexes**
- All foreign keys indexed
- Composite indexes on frequently queried combinations
- Partial indexes on filtered queries (e.g., pending requests)

**Caching Strategy**
- Cache friend lists (5 minute TTL)
- Cache follower/following counts (1 minute TTL)
- Cache privacy settings (10 minute TTL)
- Invalidate cache on mutations

**Query Optimization**
- Use database functions for complex queries
- Batch queries where possible
- Implement cursor-based pagination for large lists
- Use SELECT only needed columns

**Real-time Optimization**
- Debounce real-time updates (max 1 update per second)
- Batch notifications
- Use WebSocket for real-time, polling as fallback

### Security Considerations

**Data Privacy**
- All social data protected by RLS
- Privacy settings enforced at database level
- Blocked users cannot see any data
- Audit log for sensitive operations

**Rate Limiting**
- Limit friend requests: 20 per hour
- Limit follows: 50 per hour
- Limit venue shares: 100 per day
- Limit reports: 10 per day

**Content Moderation**
- User reports create moderation tickets
- Automated flagging for spam patterns
- Admin dashboard for reviewing reports
- Ability to suspend abusive accounts

### Monitoring and Analytics

**Key Metrics**
- Friend request acceptance rate
- Activity feed engagement (views, likes, comments)
- Collection creation and following rates
- Group outing participation rates
- Notification open rates

**Error Monitoring**
- Track API error rates
- Monitor RLS policy violations
- Alert on database performance issues
- Track failed real-time connections

**User Analytics**
- Track feature adoption
- Measure user engagement with social features
- A/B test new features
- Funnel analysis for key flows
