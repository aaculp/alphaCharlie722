# App Architecture Documentation

## Overview
This document provides a comprehensive breakdown of the app's component tree, hooks usage, and API service calls.

---

## Table of Contents
1. [Navigation Structure](#navigation-structure)
2. [Screen Components](#screen-components)
3. [Hooks Reference](#hooks-reference)
4. [API Services](#api-services)
5. [Data Flow Diagrams](#data-flow-diagrams)

---

## Navigation Structure

```
AppNavigator
├── SplashScreen (initializing)
├── LoginScreen (no session)
├── SignUpScreen (no session)
└── MainTabNavigator (authenticated)
    ├── HomeStack
    │   ├── HomeScreen
    │   ├── VenueDetailScreen
    │   ├── VenueReviewsScreen
    │   ├── FlashOfferDetailScreen
    │   └── ClaimConfirmationScreen
    ├── SearchStack
    │   ├── SearchScreen
    │   └── VenueDetailScreen
    ├── FavoritesStack
    │   ├── FavoritesScreen
    │   └── VenueDetailScreen
    ├── HistoryStack
    │   ├── HistoryScreen
    │   └── VenueDetailScreen
    └── ProfileStack
        ├── ProfileScreen
        ├── SettingsScreen
        └── NotificationSettingsScreen
```

---

## Screen Components

### HomeScreen
**Location:** `src/screens/customer/HomeScreen.tsx`

**Hooks Used:**
- `useTheme()` - Theme colors and styling
- `useLocationContext()` - Location permission status
- `useAuth()` - User authentication state
- `useNavigation()` - Navigation functions
- `useVenues({ featured: true, limit: 10 })` - Featured venues
- `useLocation()` - User's current location
- `useNewVenues()` - Recently added venues
- `useFlashOffers({ radiusMiles: 10 })` - Nearby flash offers
- `useCheckInStats({ venueIds })` - Check-in counts per venue

**API Calls (via hooks):**
- `VenueService.getFeaturedVenues()` - Fetch featured venues
- `VenueService.getNewVenues()` - Fetch new venues
- `CheckInService.getUserCurrentCheckInWithVenue()` - Get user's active check-in
- `CheckInService.getVenueCheckInStats()` - Get check-in counts
- `FlashOfferService.getNearbyOffers()` - Get flash offers

**Child Components:**
- `QuickPickChip` - Category filter chips
- `VenuesCarouselSection` - New venues carousel
- `FlashOfferCard` - Flash offer cards
- `RecentCheckInsSection` - User's check-in history
- `WideVenueCard` - Venue cards with swipe actions

**Real-time Subscriptions:**
- Listens to `venues` table updates (aggregate_rating, review_count)
- Listens to `reviews` table changes (INSERT, UPDATE, DELETE)

---

### VenueDetailScreen
**Location:** `src/screens/customer/VenueDetailScreen.tsx`

**Hooks Used:**
- `useTheme()` - Theme colors
- `useAuth()` - User authentication
- `useRoute()` - Route parameters (venueId)
- `useNavigation()` - Navigation functions
- `useCheckInStats({ venueIds: venueId })` - Venue check-in stats
- `useCollections()` - User's collections
- `useFriends()` - User's friends list
- `useFlashOffersQuery()` 🆕 - Flash offers for venue with user claims

**API Calls:**
- `VenueService.getVenueById(venueId)` - Fetch venue details
- `ReviewService.getUserReviewForVenue(userId, venueId)` - Get user's review
- `ReviewService.getVenueReviews({ venueId, limit: 3 })` - Get recent reviews
- `ReviewService.toggleHelpfulVote(reviewId, userId)` - Toggle helpful vote
- `ReviewService.deleteReview(reviewId, userId)` - Delete review
- `FlashOfferService.getVenueFlashOffers(venueId)` 🆕 - Get venue's flash offers
- `ClaimService.claimOffer(offerId, userId)` 🆕 - Claim flash offer

**Child Components:**
- `AggregateRatingDisplay` - Star rating display
- `ReviewSubmissionModal` - Review form modal
- `ReviewCard` - Individual review display
- `ModernVenueCards` - Info cards (hours, contact)
- `UserFeedback` - Pulse/check-in section
- `QuickShareButton` - Share with friends
- `CollectionManager` - Add to collections
- `VenueCustomerCountChip` - Active check-ins count
- `FlashOfferCard` 🆕 - Flash offer cards with claim button
- `ClaimButton` 🆕 - Interactive claim button
- `ClaimFeedbackModal` 🆕 - Claim success modal

---

### VenueReviewsScreen
**Location:** `src/screens/customer/VenueReviewsScreen.tsx`

**Hooks Used:**
- `useTheme()` - Theme colors
- `useAuth()` - User authentication
- `useRoute()` - Route parameters (venueId, venueName)

**API Calls:**
- `ReviewService.getVenueReviews({ venueId, limit: 20, offset, sortBy, filterRating })` - Paginated reviews
- `ReviewService.toggleHelpfulVote(reviewId, userId)` - Toggle helpful vote

**Child Components:**
- `ReviewCard` - Individual review display
- Filter/sort controls

---

### ProfileScreen
**Location:** `src/screens/customer/ProfileScreen.tsx`

**Hooks Used:**
- `useTheme()` - Theme colors
- `useAuth()` - User data
- `useAboutMe()` - User's about me text
- `useCheckInStats()` - User's check-in statistics
- `useFriends()` - Friends list and counts

**API Calls:**
- `ProfileService.getProfile(userId)` - Get user profile
- `ProfileService.updateAboutMe(userId, text)` - Update about me
- `CheckInService.getUserCheckInStats(userId)` - Get stats

**Child Components:**
- `HeroSection` - Profile header
- `StatisticsCard` - Check-in stats
- `AboutMeSection` - Editable about me
- `FollowersCard` - Friends count
- `TabNavigation` - Profile tabs
- `SettingsMenu` - Settings button

---

### SettingsScreen
**Location:** `src/screens/customer/SettingsScreen.tsx`

**Hooks Used:**
- `useTheme()` - Theme colors and toggle
- `useAuth()` - User data and logout

**API Calls:**
- `AuthService.signOut()` - Sign out user

**Child Components:**
- Theme toggle
- Notification settings link
- Account settings

---

### NotificationSettingsScreen
**Location:** `src/screens/customer/NotificationSettingsScreen.tsx`

**Hooks Used:**
- `useTheme()` - Theme colors
- `useAuth()` - User authentication
- `useNotificationPreferences()` - Notification settings

**API Calls:**
- `NotificationPreferencesService.getPreferences(userId)` - Get settings
- `NotificationPreferencesService.updatePreferences(userId, settings)` - Update settings

**Child Components:**
- `PushNotificationStatus` - Permission status
- Toggle switches for each notification type

---

## Hooks Reference

### Data Fetching Hooks

#### useVenues
**Location:** `src/hooks/useVenues.ts`

**Parameters:**
- `featured?: boolean` - Filter featured venues
- `limit?: number` - Number of venues to fetch
- `sortBy?: string` - Sort order

**Returns:**
- `venues: Venue[]` - Array of venues
- `loading: boolean` - Loading state
- `error: Error | null` - Error state
- `refetch: () => Promise<void>` - Refetch function

**API Service:** `VenueService.getFeaturedVenues()`

**Used In:**
- HomeScreen
- SearchScreen

---

#### useNewVenues
**Location:** `src/hooks/useNewVenues.ts`

**Parameters:**
- `limit?: number` - Number of venues (default: 10)

**Returns:**
- `venues: Venue[]` - New venues (last 30 days)
- `loading: boolean` - Loading state
- `refetch: () => Promise<void>` - Refetch function

**API Service:** `VenueService.getNewVenues()`

**Used In:**
- HomeScreen

---

#### useCheckInStats
**Location:** `src/hooks/useCheckInStats.ts`

**Parameters:**
- `venueIds: string | string[]` - Venue ID(s)
- `enabled?: boolean` - Enable/disable fetching

**Returns:**
- `stats: Map<string, CheckInStats>` - Stats by venue ID
- `loading: boolean` - Loading state
- `refetch: () => Promise<void>` - Refetch function

**API Service:** `CheckInService.getVenueCheckInStats()`

**Used In:**
- HomeScreen
- VenueDetailScreen
- WideVenueCard

---

#### useCheckInHistory
**Location:** `src/hooks/useCheckInHistory.ts`

**Parameters:**
- `userId: string` - User ID
- `limit?: number` - Number of check-ins

**Returns:**
- `checkIns: CheckInWithVenue[]` - Check-in history
- `loading: boolean` - Loading state
- `refetch: () => Promise<void>` - Refetch function

**API Service:** `CheckInService.getUserCheckInHistory()`

**Used In:**
- RecentCheckInsSection
- HistoryScreen

---

#### useFlashOffers
**Location:** `src/hooks/useFlashOffers.ts`

**Parameters:**
- `radiusMiles?: number` - Search radius (default: 10)
- `enabled?: boolean` - Enable/disable fetching

**Returns:**
- `offers: FlashOffer[]` - Available offers
- `loading: boolean` - Loading state
- `locationPermissionDenied: boolean` - Permission status
- `requestLocationPermission: () => Promise<void>` - Request permission
- `isOffline: boolean` - Offline status
- `refetch: () => Promise<void>` - Refetch function

**API Service:** `FlashOfferService.getNearbyOffers()`

**Used In:**
- HomeScreen

---

#### useCollections
**Location:** `src/hooks/useCollections.ts`

**Returns:**
- `collections: Collection[]` - User's collections
- `loading: boolean` - Loading state
- `createCollection: (params) => Promise<Collection>` - Create collection
- `addVenue: (collectionId, venueId) => Promise<void>` - Add venue
- `removeVenue: (collectionId, venueId) => Promise<void>` - Remove venue

**API Service:** `CollectionService`

**Used In:**
- VenueDetailScreen
- CollectionManager component

---

#### useFriends
**Location:** `src/hooks/useFriends.ts`

**Returns:**
- `friends: Friend[]` - User's friends
- `loading: boolean` - Loading state
- `sendRequest: (userId) => Promise<void>` - Send friend request
- `acceptRequest: (requestId) => Promise<void>` - Accept request
- `removeFriend: (friendId) => Promise<void>` - Remove friend

**API Service:** `FriendService`

**Used In:**
- VenueDetailScreen
- ProfileScreen
- QuickShareButton component

---

#### useNotificationPreferences
**Location:** `src/hooks/useNotificationPreferences.ts`

**Returns:**
- `preferences: NotificationPreferences` - User's settings
- `loading: boolean` - Loading state
- `updatePreferences: (settings) => Promise<void>` - Update settings

**API Service:** `NotificationPreferencesService`

**Used In:**
- NotificationSettingsScreen

---

### UI/Interaction Hooks

#### useSwipeGesture
**Location:** `src/hooks/useSwipeGesture.ts`

**Parameters:**
- `onSwipeLeft?: () => void` - Left swipe callback
- `onSwipeRight?: () => void` - Right swipe callback
- `scrollEnabled: SharedValue<boolean>` - Control scroll

**Returns:**
- `panGesture: GestureHandler` - Pan gesture handler
- `animatedStyle: AnimatedStyle` - Animated styles

**Features:**
- **Improved Direction Detection** (Updated 2026-01-25):
  - **Gesture Configuration**:
    - `activeOffsetX: [-50, 50]` - Only activates after 50px horizontal movement
    - `failOffsetY: [-15, 15]` - Automatically fails if vertical movement exceeds 15px
  - **Vertical scroll priority**: Vertical threshold only 15px (very sensitive)
  - **Horizontal swipe threshold**: 50px (increased from 30px)
  - **Dominance ratio**: Requires horizontal to be 2x vertical (increased from 1.5x)
  - **Scroll-first approach**: Checks vertical movement first to prioritize scrolling
  - **Prevents accidental swipes**: Much harder to trigger horizontal swipe accidentally
- **Direction Locking**: Locks to horizontal or vertical after threshold
- **Scroll Control**: Disables vertical scrolling during horizontal swipes
- **Animated Feedback**: Smooth card translation during swipe
- **Haptic Feedback**: Triggers haptic on swipe completion

**Gesture Detection Logic:**
```typescript
// Configure gesture with offset thresholds
Gesture.Pan()
  .activeOffsetX([-50, 50])  // Activate after 50px horizontal
  .failOffsetY([-15, 15])    // Fail if 15px vertical movement

// Prioritize vertical scrolling - check vertical first
if (absGestureY > 15) {
  lockedDirectionValue.value = 'vertical'; // Allow scroll
}
// Only lock to horizontal if clearly horizontal
else if (absGestureX > 50 && absGestureX > absGestureY * 2) {
  lockedDirectionValue.value = 'horizontal';
  scrollEnabled.value = false; // Disable scroll
}
```

**How It Works:**
1. **activeOffsetX**: Gesture won't activate until user moves 50px horizontally
2. **failOffsetY**: If user moves 15px vertically first, gesture automatically fails and scroll takes over
3. **Direction locking**: Once direction is determined, it's locked for that gesture
4. **Scroll control**: Only disables scroll when horizontal swipe is confirmed

**Used In:**
- WideVenueCard (swipe to check-in/out)

---

#### useHapticFeedback
**Location:** `src/hooks/useHapticFeedback.ts`

**Returns:**
- `triggerLight: () => void` - Light haptic
- `triggerMedium: () => void` - Medium haptic
- `triggerHeavy: () => void` - Heavy haptic
- `triggerSuccess: () => void` - Success haptic
- `triggerError: () => void` - Error haptic

**Used In:**
- WideVenueCard (swipe feedback)
- CheckInButton (check-in feedback)

---

## API Services

### VenueService
**Location:** `src/services/api/venues.ts`

**Methods:**
- `getFeaturedVenues(limit)` - Get featured venues
- `getNewVenues(limit)` - Get venues from last 30 days
- `getVenueById(venueId)` - Get single venue details
- `searchVenues(query, filters)` - Search venues

**Database Tables:**
- `venues` - Main venue data

---

### ReviewService
**Location:** `src/services/api/reviews.ts`

**Methods:**
- `submitReview({ venueId, userId, rating, reviewText })` - Submit new review
- `updateReview({ reviewId, userId, rating, reviewText })` - Update review
- `deleteReview(reviewId, userId)` - Delete review
- `getVenueReviews({ venueId, limit, offset, sortBy, filterRating })` - Get reviews
- `getUserReviewForVenue(userId, venueId)` - Get user's review
- `toggleHelpfulVote(reviewId, userId)` - Toggle helpful vote

**Database Tables:**
- `reviews` - Review data
- `helpful_votes` - Helpful vote tracking
- `venue_responses` - Venue owner responses

**Triggers:**
- `update_venue_rating()` - Updates venue aggregate_rating and review_count

---

### CheckInService
**Location:** `src/services/api/checkins.ts`

**Methods:**
- `checkIn(venueId, userId)` - Check in to venue
- `checkOut(checkInId, userId)` - Check out from venue
- `getUserCurrentCheckInWithVenue(userId)` - Get active check-in
- `getUserCheckInHistory(userId, limit)` - Get check-in history
- `getVenueCheckInStats(venueIds)` - Get active check-in counts

**Database Tables:**
- `check_ins` - Check-in records

---

### FlashOfferService
**Location:** `src/services/api/flashOffers.ts`

**Methods:**
- `getNearbyOffers(latitude, longitude, radiusMiles)` - Get nearby offers
- `claimOffer(offerId, userId)` - Claim an offer
- `getClaimedOffers(userId)` - Get user's claimed offers

**Database Tables:**
- `flash_offers` - Offer data
- `flash_offer_claims` - Claim records

---

### CollectionService
**Location:** `src/services/api/collections.ts`

**Methods:**
- `getUserCollections(userId)` - Get user's collections
- `createCollection({ name, privacy_level, description })` - Create collection
- `addVenueToCollection(collectionId, venueId)` - Add venue
- `removeVenueFromCollection(collectionId, venueId)` - Remove venue

**Database Tables:**
- `collections` - Collection data
- `collection_venues` - Venue associations

---

### FriendService
**Location:** `src/services/api/friends.ts`

**Methods:**
- `getFriends(userId)` - Get friends list
- `sendFriendRequest(fromUserId, toUserId)` - Send request
- `acceptFriendRequest(requestId)` - Accept request
- `removeFriend(userId, friendId)` - Remove friend

**Database Tables:**
- `friendships` - Friend relationships
- `friend_requests` - Pending requests

---

### NotificationPreferencesService
**Location:** `src/services/api/notificationPreferences.ts`

**Methods:**
- `getPreferences(userId)` - Get user's notification settings
- `updatePreferences(userId, preferences)` - Update settings

**Database Tables:**
- `notification_preferences` - User preferences

---

## Data Flow Diagrams

### Review Submission Flow

```
User (VenueDetailScreen)
  ↓ Opens ReviewSubmissionModal
  ↓ Submits review (rating + text)
  ↓
ReviewService.submitReview()
  ↓ Validates rating (1-5)
  ↓ Validates text (max 500 chars)
  ↓ Filters profanity
  ↓ INSERT into reviews table
  ↓
Database Trigger: update_venue_rating()
  ↓ Calculates AVG(rating)
  ↓ Counts reviews
  ↓ UPDATE venues table
  ↓
Supabase Realtime (if enabled)
  ↓ Broadcasts UPDATE event
  ↓
HomeScreen subscription
  ↓ Receives event
  ↓ Calls refetch()
  ↓ Updates UI with new rating
```

### Check-In Flow

```
User (HomeScreen)
  ↓ Swipes right on WideVenueCard
  ↓
CheckInService.checkIn(venueId, userId)
  ↓ Validates no active check-in
  ↓ INSERT into check_ins table
  ↓ Returns check-in record
  ↓
WideVenueCard.onCheckInChange()
  ↓ Updates local state
  ↓ Triggers haptic feedback
  ↓ Refetches check-in stats
  ↓
RecentCheckInsSection
  ↓ Refetches history
  ↓ Shows new check-in
```

### Venue Data Flow

```
HomeScreen mounts
  ↓
useVenues({ featured: true, limit: 10 })
  ↓
VenueService.getFeaturedVenues()
  ↓ SELECT from venues table
  ↓ Includes aggregate_rating, review_count
  ↓ Returns Venue[]
  ↓
useCheckInStats({ venueIds })
  ↓
CheckInService.getVenueCheckInStats()
  ↓ SELECT COUNT from check_ins
  ↓ Returns Map<venueId, stats>
  ↓
WideVenueCard renders
  ↓ Shows venue with rating
  ↓ Shows active check-in count
  ↓ Enables swipe gestures
```

### Flash Offer Claim Flow 🆕

```
User (VenueDetailScreen)
  ↓ Views FlashOfferCard
  ↓ Sees ClaimButton (state: claimable)
  ↓ Taps "Claim Offer"
  ↓
ClaimButton.onPress()
  ↓ Derives button state (checks eligibility)
  ↓ Validates: checked in, offer active, not claimed, claims available
  ↓
useClaimFlashOfferMutation.mutate()
  ↓ Optimistic Update: increment claimed_count, add to user claims
  ↓ Button state → loading
  ↓
ClaimService.claimOffer(offerId, userId)
  ↓ Validates eligibility server-side
  ↓ Calls claim_flash_offer_atomic() DB function
  ↓ Generates 6-digit claim token
  ↓ INSERT into flash_offer_claims
  ↓ UPDATE flash_offers.claimed_count
  ↓ Returns claim record
  ↓
Success Response
  ↓ Trigger haptic feedback
  ↓ Show ClaimFeedbackModal with token
  ↓ Invalidate flash offers query cache
  ↓ Invalidate user claims query cache
  ↓ Button state → claimed
  ↓
User taps "View Claim"
  ↓ Navigate to ClaimDetailScreen
  ↓ Display full claim details and token
```

### Claim Error Handling Flow 🆕

```
Claim Mutation Fails
  ↓
handleClaimError(error)
  ↓ Categorize error type
  ↓
If Eligibility Error:
  ↓ Show specific message (not checked in, already claimed, full, expired)
  ↓ Action: dismiss or navigate to check-in
  ↓ Revert optimistic update
  ↓ Button state → appropriate disabled state

If Network Error:
  ↓ Show "Unable to connect" message
  ↓ Action: retry button
  ↓ Maintain claimable state
  ↓ Don't revert (no optimistic update made)

If Timeout Error:
  ↓ Show "Request timed out" message
  ↓ Action: check claims or retry
  ↓ Query user claims to verify status
  ↓ Update UI based on actual state

If Race Condition (offer became full):
  ↓ Show "Offer just claimed by someone else" message
  ↓ Revert optimistic update
  ↓ Invalidate queries to get latest data
  ↓ Button state → full
```

---

## Component Hierarchy

### HomeScreen Component Tree

```
HomeScreen
├── QuickPicksSection
│   └── QuickPickChip (multiple)
├── VenuesCarouselSection (New Venues)
│   └── CompactVenueCard (multiple)
├── FlashOffersSection
│   └── FlashOfferCard (multiple)
├── RecentCheckInsSection
│   └── CheckInHistoryItem (multiple)
└── VenueList
    └── WideVenueCard (multiple)
        ├── VenueEngagementChip
        ├── VenueCustomerCountChip
        ├── AggregateRatingDisplay
        └── SwipeActionBackground
```

### VenueDetailScreen Component Tree

```
VenueDetailScreen
├── Header
│   ├── QuickShareButton
│   ├── CollectionManager
│   ├── MutualFavoritesIndicator
│   ├── VenueEngagementChip
│   ├── VenueCustomerCountChip
│   └── AggregateRatingDisplay
├── ReviewButton
├── UserFeedback (Pulse Section)
│   └── CheckInButton
├── FlashOffersSection 🆕
│   └── ScrollView (horizontal)
│       └── FlashOfferCard (multiple)
│           ├── OfferContent (title, countdown, badges)
│           ├── ClaimButton 🆕
│           │   ├── ClaimableButton
│           │   ├── ClaimedButton
│           │   ├── LoadingButton
│           │   ├── IneligibleButton
│           │   └── DisabledButton
│           └── ClaimFeedbackModal 🆕
├── ReviewsSection
│   ├── ReviewCard (multiple)
│   └── SeeAllReviewsButton
├── ModernVenueCards
│   ├── ContactCard
│   ├── HoursCard
│   └── AmenitiesCard
└── ReviewSubmissionModal
    ├── StarRating
    └── TextInput
```

---

## Cache Strategy

### Review Cache
- **TTL:** 5 minutes
- **Key Pattern:** `reviews:venue:{venueId}:limit:{limit}:offset:{offset}:sort:{sortBy}:filter:{filterRating}:verified:{verifiedOnly}`
- **Invalidation:** On review submit, update, or delete
- **Service:** `ReviewService`

### Venue Cache
- **TTL:** 10 minutes
- **Key Pattern:** `venues:featured:{limit}` or `venues:new:{limit}`
- **Invalidation:** Manual refetch only
- **Service:** `VenueService`

### Flash Offer Cache
- **TTL:** 2 minutes
- **Key Pattern:** `flash_offers:nearby:{lat}:{lng}:{radius}`
- **Invalidation:** On location change or manual refetch
- **Service:** `FlashOfferService`

---

## Real-time Subscriptions

### HomeScreen Subscriptions

```typescript
// Venue updates (aggregate_rating, review_count changes)
supabase
  .channel('venue-ratings-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'venues'
  }, (payload) => {
    // Refetch venues if updated venue is in current list
    if (venueIds.includes(payload.new.id)) {
      refetch();
    }
  })
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'reviews'
  }, (payload) => {
    // Refetch venues if review is for venue in current list
    const venueId = payload.new?.venue_id || payload.old?.venue_id;
    if (venueIds.includes(venueId)) {
      refetch();
    }
  })
  .subscribe();
```

---

## Error Handling

### API Error Handling Pattern

```typescript
try {
  const data = await ServiceMethod();
  return data;
} catch (error) {
  console.error('Error message:', error);
  throw error; // Re-throw for component to handle
}
```

### Component Error Handling Pattern

```typescript
const [error, setError] = useState<Error | null>(null);

try {
  await apiCall();
} catch (err) {
  setError(err as Error);
  // Show error UI
}
```

---

## Performance Considerations

### Memoization
- `useMemo` for expensive calculations (venue sorting, filtering)
- `useCallback` for event handlers passed to child components
- `React.memo` for frequently re-rendered components (VenueCard)

### Lazy Loading
- Pagination for reviews (20 per page)
- Infinite scroll for venue lists
- Image lazy loading with placeholder

### Debouncing
- Search input (300ms delay)
- Location updates (1000ms delay)

---

## Testing Strategy

### Unit Tests
- Hooks: `useVenues`, `useCheckInStats`, `useSwipeGesture`
- Services: `ReviewService`, `CheckInService`
- Utils: `LocationService`, `ContentModerationService`

### Integration Tests
- Check-in flow (swipe → API → UI update)
- Review submission flow (form → API → trigger → UI update)
- Real-time updates (database change → subscription → UI update)

### Property-Based Tests
- `useSwipeGesture` - Gesture state transitions
- `useNotificationPreferences` - Preference updates
- `DeviceTokenManager` - Token management

---

## Future Enhancements

### Planned Features
1. Social features (friend activity feed, shared collections)
2. Advanced search filters
3. Venue recommendations based on history
4. Push notification preferences per venue
5. Offline mode with sync

### Technical Debt
1. Migrate to React Query for better caching
2. Implement optimistic updates for check-ins
3. Add error boundaries for better error handling
4. Improve TypeScript coverage
5. Add E2E tests with Detox
