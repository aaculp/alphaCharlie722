# API Reference

This document provides a comprehensive overview of all API services in the alphaCharlie722 application.

## Table of Contents

- [Authentication Service](#authentication-service)
- [Check-In Service](#check-in-service)
- [Venue Service](#venue-service)
- [Favorites Service](#favorites-service)
- [User Feedback Service](#user-feedback-service)
- [Type Definitions](#type-definitions)

---

## Authentication Service

**Location:** `src/services/api/auth.ts`

Handles user authentication, session management, and profile operations.

### Methods

#### `signUp(email: string, password: string, name?: string)`

Creates a new user account and profile.

**Parameters:**
- `email` (string): User's email address
- `password` (string): User's password
- `name` (string, optional): User's display name

**Returns:** `Promise<{ user, session, autoSignedIn, needsManualLogin }>`

**Throws:** Error if signup fails

---

#### `signIn(email: string, password: string)`

Authenticates a user with email and password.

**Parameters:**
- `email` (string): User's email address
- `password` (string): User's password

**Returns:** `Promise<{ user, session }>`

**Throws:** Error if sign-in fails

---

#### `signOut()`

Signs out the current user.

**Returns:** `Promise<void>`

**Throws:** Error if sign-out fails

---

#### `getCurrentSession()`

Retrieves the current authentication session.

**Returns:** `Promise<Session | null>`

**Throws:** Error if session retrieval fails

---

#### `getCurrentUser()`

Gets the currently authenticated user.

**Returns:** `Promise<User | null>`

**Throws:** Error if user retrieval fails

---

#### `createProfile(profile: ProfileInsert)`

Creates a user profile in the database.

**Parameters:**
- `profile` (ProfileInsert): Profile data including id, email, and name

**Returns:** `Promise<Profile>`

**Throws:** Error if profile creation fails

---

#### `getProfile(userId: string)`

Retrieves a user's profile by ID.

**Parameters:**
- `userId` (string): User's unique identifier

**Returns:** `Promise<Profile>`

**Throws:** Error if profile retrieval fails

---

#### `updateProfile(userId: string, updates: Partial<Profile>)`

Updates a user's profile.

**Parameters:**
- `userId` (string): User's unique identifier
- `updates` (Partial<Profile>): Fields to update

**Returns:** `Promise<Profile>`

**Throws:** Error if update fails

---

#### `resetPassword(email: string)`

Sends a password reset email.

**Parameters:**
- `email` (string): User's email address

**Returns:** `Promise<void>`

**Throws:** Error if password reset fails

---

#### `onAuthStateChange(callback: (event: string, session: any) => void)`

Subscribes to authentication state changes.

**Parameters:**
- `callback` (function): Function to call when auth state changes

**Returns:** Subscription object

---

## Check-In Service

**Location:** `src/services/api/checkins.ts`

Manages venue check-ins, check-outs, and check-in history.

### Methods

#### `checkIn(venueId: string, userId: string)`

Checks a user into a venue. Automatically checks out from any previous venue.

**Parameters:**
- `venueId` (string): Venue's unique identifier
- `userId` (string): User's unique identifier

**Returns:** `Promise<CheckIn>`

**Throws:** Error if check-in fails

---

#### `checkOut(checkInId: string, userId: string)`

Checks a user out of a venue.

**Parameters:**
- `checkInId` (string): Check-in record ID
- `userId` (string): User's unique identifier

**Returns:** `Promise<void>`

**Throws:** Error if check-out fails

---

#### `checkOutUser(userId: string)`

Checks out a user from all active check-ins.

**Parameters:**
- `userId` (string): User's unique identifier

**Returns:** `Promise<void>`

---

#### `getVenueCheckInStats(venueId: string, userId?: string)`

Gets check-in statistics for a venue.

**Parameters:**
- `venueId` (string): Venue's unique identifier
- `userId` (string, optional): User's unique identifier

**Returns:** `Promise<VenueCheckInStats>`

**Response:**
```typescript
{
  venue_id: string;
  active_checkins: number;
  recent_checkins: number; // Last 24 hours
  user_is_checked_in: boolean;
  user_checkin_id?: string;
  user_checkin_time?: string;
}
```

---

#### `getMultipleVenueStats(venueIds: string[], userId?: string)`

Gets check-in statistics for multiple venues (batch operation).

**Parameters:**
- `venueIds` (string[]): Array of venue IDs
- `userId` (string, optional): User's unique identifier

**Returns:** `Promise<Map<string, VenueCheckInStats>>`

---

#### `getUserCurrentCheckIn(userId: string)`

Gets the user's current active check-in.

**Parameters:**
- `userId` (string): User's unique identifier

**Returns:** `Promise<CheckIn | null>`

---

#### `getUserCurrentCheckInWithVenue(userId: string)`

Gets the user's current check-in with venue name.

**Parameters:**
- `userId` (string): User's unique identifier

**Returns:** `Promise<{ checkIn: CheckIn; venueName: string } | null>`

---

#### `getUserCheckInHistory(options: CheckInHistoryOptions)` 🆕

Fetches a user's check-in history with venue details.

**Parameters:**
- `options` (CheckInHistoryOptions):
  - `userId` (string): User's unique identifier
  - `limit` (number, optional): Maximum number of results (default: 50)
  - `offset` (number, optional): Pagination offset (default: 0)
  - `daysBack` (number, optional): Number of days to look back (default: 30)

**Returns:** `Promise<CheckInHistoryResponse>`

**Response:**
```typescript
{
  checkIns: CheckInWithVenue[];
  hasMore: boolean;
  total: number;
}
```

**Features:**
- Returns check-ins from the past 30 days (configurable)
- Ordered by most recent first
- Includes complete venue details via join
- Supports pagination
- Filters by user ID

---

#### `getUserVenueVisitCount(userId: string, venueId: string)` 🆕

Gets the total number of times a user has visited a specific venue.

**Parameters:**
- `userId` (string): User's unique identifier
- `venueId` (string): Venue's unique identifier

**Returns:** `Promise<number>`

---

#### `getUserVenueVisitCounts(userId: string, venueIds: string[])` 🆕

Batch fetches visit counts for multiple venues.

**Parameters:**
- `userId` (string): User's unique identifier
- `venueIds` (string[]): Array of venue IDs

**Returns:** `Promise<Map<string, number>>`

**Note:** More efficient than calling `getUserVenueVisitCount` multiple times.

---

## Venue Service

**Location:** `src/services/api/venues.ts`

Manages venue data, search, and discovery.

### Methods

#### `getVenues(options?: VenueQueryOptions)`

Retrieves venues with optional filtering and search.

**Parameters:**
- `options` (VenueQueryOptions, optional):
  - `search` (string): Search term for name, description, category, or location
  - `category` (string): Filter by category
  - `location` (string): Filter by location
  - `limit` (number): Maximum results
  - `offset` (number): Pagination offset

**Returns:** `Promise<Venue[]>`

**Throws:** Error if fetch fails

---

#### `getVenueById(id: string)`

Gets a single venue by ID.

**Parameters:**
- `id` (string): Venue's unique identifier

**Returns:** `Promise<Venue>`

**Throws:** Error if venue not found

---

#### `getFeaturedVenues(limit?: number)`

Gets featured venues (rating >= 4.0).

**Parameters:**
- `limit` (number, optional): Maximum results (default: 10)

**Returns:** `Promise<Venue[]>`

**Throws:** Error if fetch fails

---

#### `createVenue(venue: VenueInsert)`

Creates a new venue (admin/business owners).

**Parameters:**
- `venue` (VenueInsert): Venue data

**Returns:** `Promise<Venue>`

**Throws:** Error if creation fails

---

#### `updateVenueRating(venueId: string)`

Recalculates and updates venue rating based on reviews.

**Parameters:**
- `venueId` (string): Venue's unique identifier

**Returns:** `Promise<void>`

**Throws:** Error if update fails

---

#### `getVenuesByCategory(category: string, limit?: number)`

Gets venues filtered by category.

**Parameters:**
- `category` (string): Venue category
- `limit` (number, optional): Maximum results (default: 20)

**Returns:** `Promise<Venue[]>`

**Throws:** Error if fetch fails

---

#### `getNearbyVenues(latitude: number, longitude: number, radiusKm?: number, limit?: number)`

Gets venues near a geographic location.

**Parameters:**
- `latitude` (number): Latitude coordinate
- `longitude` (number): Longitude coordinate
- `radiusKm` (number, optional): Search radius in kilometers (default: 10)
- `limit` (number, optional): Maximum results (default: 20)

**Returns:** `Promise<Venue[]>`

**Throws:** Error if fetch fails

**Note:** Requires PostGIS `get_nearby_venues` function in database.

---

## Favorites Service

**Location:** `src/services/api/favorites.ts`

Manages user's favorite venues.

### Methods

#### `addToFavorites(userId: string, venueId: string)`

Adds a venue to user's favorites.

**Parameters:**
- `userId` (string): User's unique identifier
- `venueId` (string): Venue's unique identifier

**Returns:** `Promise<Favorite>`

**Throws:** Error if addition fails

---

#### `removeFromFavorites(userId: string, venueId: string)`

Removes a venue from user's favorites.

**Parameters:**
- `userId` (string): User's unique identifier
- `venueId` (string): Venue's unique identifier

**Returns:** `Promise<void>`

**Throws:** Error if removal fails

---

#### `isFavorited(userId: string, venueId: string)`

Checks if a venue is in user's favorites.

**Parameters:**
- `userId` (string): User's unique identifier
- `venueId` (string): Venue's unique identifier

**Returns:** `Promise<boolean>`

**Throws:** Error if check fails

---

#### `getUserFavorites(userId: string, limit?: number, offset?: number)`

Gets user's favorite venues with venue details.

**Parameters:**
- `userId` (string): User's unique identifier
- `limit` (number, optional): Maximum results (default: 20)
- `offset` (number, optional): Pagination offset (default: 0)

**Returns:** `Promise<FavoriteWithVenue[]>`

**Throws:** Error if fetch fails

---

#### `toggleFavorite(userId: string, venueId: string)`

Toggles favorite status (add if not favorited, remove if favorited).

**Parameters:**
- `userId` (string): User's unique identifier
- `venueId` (string): Venue's unique identifier

**Returns:** `Promise<boolean>` - true if added, false if removed

**Throws:** Error if toggle fails

---

#### `getFavoriteCount(venueId: string)`

Gets the total number of users who favorited a venue.

**Parameters:**
- `venueId` (string): Venue's unique identifier

**Returns:** `Promise<number>`

**Throws:** Error if fetch fails

---

## User Feedback Service

**Location:** `src/services/api/feedback.ts`

Manages user-generated tags and likes for venues.

### Methods

#### `getVenueTags(venueId: string, userId?: string)`

Gets all tags for a venue.

**Parameters:**
- `venueId` (string): Venue's unique identifier
- `userId` (string, optional): User's unique identifier (to check which tags they've liked)

**Returns:** `Promise<UserTag[]>`

**Response:**
```typescript
{
  id: string;
  venue_id: string;
  user_id: string;
  tag_text: string;
  like_count: number;
  created_at: string;
  user_has_liked?: boolean;
}
```

**Throws:** Error if fetch fails

---

#### `createTag(request: CreateTagRequest, userId: string)`

Creates a new tag for a venue.

**Parameters:**
- `request` (CreateTagRequest):
  - `venue_id` (string): Venue's unique identifier
  - `tag_text` (string): Tag content
- `userId` (string): User's unique identifier

**Returns:** `Promise<UserTag>`

**Throws:** Error if creation fails

---

#### `toggleTagLike(tagId: string, userId: string)`

Likes or unlikes a tag.

**Parameters:**
- `tagId` (string): Tag's unique identifier
- `userId` (string): User's unique identifier

**Returns:** `Promise<{ liked: boolean; newCount: number }>`

**Throws:** Error if toggle fails

---

#### `deleteTag(tagId: string, userId: string)`

Deletes a tag (only by creator).

**Parameters:**
- `tagId` (string): Tag's unique identifier
- `userId` (string): User's unique identifier (must be tag creator)

**Returns:** `Promise<void>`

**Throws:** Error if deletion fails

---

#### `getTrendingTags(limit?: number)`

Gets trending tags across all venues.

**Parameters:**
- `limit` (number, optional): Maximum results (default: 10)

**Returns:** `Promise<UserTag[]>`

**Throws:** Error if fetch fails

---

## Type Definitions

### CheckIn

```typescript
interface CheckIn {
  id: string;
  venue_id: string;
  user_id: string;
  checked_in_at: string;
  checked_out_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### CheckInWithVenue 🆕

```typescript
interface CheckInWithVenue {
  id: string;
  venue_id: string;
  user_id: string;
  checked_in_at: string;
  checked_out_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  venue: {
    id: string;
    name: string;
    location: string;
    category: string;
    image_url: string | null;
    rating: number;
    latitude: number | null;
    longitude: number | null;
  };
}
```

### CheckInHistoryOptions 🆕

```typescript
interface CheckInHistoryOptions {
  userId: string;
  limit?: number;      // Default: 50
  offset?: number;     // Default: 0
  daysBack?: number;   // Default: 30
}
```

### CheckInHistoryResponse 🆕

```typescript
interface CheckInHistoryResponse {
  checkIns: CheckInWithVenue[];
  hasMore: boolean;
  total: number;
}
```

### VenueCheckInStats

```typescript
interface VenueCheckInStats {
  venue_id: string;
  active_checkins: number;
  recent_checkins: number;
  user_is_checked_in: boolean;
  user_checkin_id?: string;
  user_checkin_time?: string;
}
```

### VenueQueryOptions

```typescript
interface VenueQueryOptions {
  search?: string;
  category?: string;
  location?: string;
  limit?: number;
  offset?: number;
}
```

### UserTag

```typescript
interface UserTag {
  id: string;
  venue_id: string;
  user_id: string;
  tag_text: string;
  like_count: number;
  created_at: string;
  user_has_liked?: boolean;
}
```

### CreateTagRequest

```typescript
interface CreateTagRequest {
  venue_id: string;
  tag_text: string;
}
```

---

## Error Handling

All API methods throw errors with descriptive messages. Errors should be caught and handled appropriately:

```typescript
try {
  const venues = await VenueService.getVenues({ category: 'Coffee Shop' });
} catch (error) {
  console.error('Failed to fetch venues:', error.message);
  // Handle error appropriately
}
```

---

## Best Practices

1. **Always handle errors**: Wrap API calls in try-catch blocks
2. **Use batch operations**: Use `getMultipleVenueStats` instead of multiple `getVenueCheckInStats` calls
3. **Implement pagination**: Use `limit` and `offset` for large datasets
4. **Check authentication**: Verify user is authenticated before calling user-specific methods
5. **Optimize queries**: Use specific filters to reduce data transfer
6. **Cache when appropriate**: Cache frequently accessed data like venue lists

---

## Recent Updates

### January 2026

- 🆕 Added `getUserCheckInHistory()` method to CheckInService
- 🆕 Added `getUserVenueVisitCount()` method to CheckInService
- 🆕 Added `getUserVenueVisitCounts()` method for batch visit count fetching
- 🆕 Added `CheckInWithVenue`, `CheckInHistoryOptions`, and `CheckInHistoryResponse` types
- ✨ Check-in history now supports 30-day filtering and pagination
- ✨ Visit counts can be fetched individually or in batch for better performance

---

## Contributing

When adding new API methods:

1. Add the method to the appropriate service class
2. Document the method in this file with parameters, return types, and examples
3. Add TypeScript type definitions
4. Write property-based tests for the new functionality
5. Update the "Recent Updates" section

---

**Last Updated:** January 12, 2026
