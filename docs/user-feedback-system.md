# User Feedback System

## Overview
The User Feedback System allows users to create community-driven tags for venues and interact with them through likes. This creates a dynamic, user-generated content system that helps other users understand what makes each venue special.

## Features

### 🏷️ Community Tags
- **User-Generated**: Any authenticated user can create tags for venues
- **Character Limit**: Tags are limited to 50 characters to keep them concise
- **Unique Tags**: Each venue can only have one instance of each tag (case-insensitive)
- **Real-time**: Tags appear immediately after creation

### ❤️ Interactive Likes
- **Like/Unlike**: Users can like or unlike any tag
- **Visual Feedback**: Animated heart icon with fire animation on new likes
- **Like Counter**: Real-time like count display
- **Color Coding**: Tags change color based on popularity:
  - 🔥 **Hot Orange** (20+ likes): Trending tags
  - ❤️ **Red** (10+ likes): Popular tags  
  - ⭐ **Gold** (5+ likes): Well-liked tags
  - 🔵 **Default** (0-4 likes): New tags

### 🎨 Modern UI Design
- **Card-based Layout**: Clean, modern design with rounded corners
- **Smooth Animations**: Like button scaling and fire emoji animations
- **Responsive**: Adapts to different screen sizes
- **Theme Support**: Full dark/light theme integration

### 🔐 User Management
- **Authentication Required**: Only logged-in users can create and like tags
- **Tag Ownership**: Users can delete their own tags
- **Guest Viewing**: Non-authenticated users can view all tags

## Technical Implementation

### Database Schema
```sql
-- User Tags Table
user_tags:
  - id (UUID, Primary Key)
  - venue_id (UUID, Foreign Key to venues)
  - user_id (UUID, Foreign Key to auth.users)
  - tag_text (TEXT, 1-50 characters)
  - like_count (INTEGER, auto-updated)
  - created_at (TIMESTAMP)

-- Tag Likes Table  
tag_likes:
  - id (UUID, Primary Key)
  - tag_id (UUID, Foreign Key to user_tags)
  - user_id (UUID, Foreign Key to auth.users)
  - created_at (TIMESTAMP)
```

### Key Components

#### `UserFeedback.tsx`
Main component that handles:
- Loading and displaying tags
- Creating new tags
- Handling like/unlike interactions
- Tag deletion for owners
- Empty states and loading states

#### `UserFeedbackService.ts`
Service layer providing:
- `getVenueTags()` - Fetch tags for a venue
- `createTag()` - Create new community tag
- `toggleTagLike()` - Like/unlike functionality
- `deleteTag()` - Remove user's own tags
- `getTrendingTags()` - Get popular tags across platform

### Security Features
- **Row Level Security (RLS)**: Database-level security policies
- **Input Validation**: Client and server-side validation
- **Rate Limiting**: Prevents spam through unique constraints
- **User Ownership**: Users can only delete their own tags

## Usage Examples

### Creating a Tag
1. User clicks the "+" button in the Community Tags section
2. Input field appears with placeholder text
3. User types tag (max 50 characters)
4. Presses "Send" button or Enter key
5. Tag appears immediately in the list

### Liking a Tag
1. User taps the heart icon next to any tag
2. Heart fills with color and scales up briefly
3. Fire emoji animation plays for new likes
4. Like counter updates in real-time
5. Tag color may change based on new popularity level

### Tag Popularity Levels
- **0-4 likes**: Default theme color
- **5-9 likes**: Gold color (⭐ Well-liked)
- **10-19 likes**: Red color (❤️ Popular)
- **20+ likes**: Hot orange (🔥 Trending)

## Setup Instructions

### 1. Database Setup
Run the SQL commands in `database-setup-user-feedback.sql` in your Supabase SQL Editor.

### 2. Component Integration
The `UserFeedback` component is already integrated into `VenueDetailScreen.tsx` and appears between the modern venue cards and contact information.

### 3. Authentication
Ensure users are authenticated through the existing `AuthContext` to create and like tags.

## Future Enhancements

### Potential Features
- **Tag Categories**: Group tags by type (food, atmosphere, service, etc.)
- **Tag Suggestions**: AI-powered tag recommendations
- **Trending Dashboard**: Show most popular tags across all venues
- **Tag Analytics**: Track tag performance over time
- **Moderation Tools**: Report inappropriate tags
- **Tag Rewards**: Gamification for active community members

### Performance Optimizations
- **Pagination**: Load tags in batches for venues with many tags
- **Caching**: Cache popular tags to reduce database queries
- **Real-time Updates**: WebSocket integration for live tag updates
- **Image Tags**: Allow users to attach images to tags

## API Reference

### UserFeedbackService Methods

```typescript
// Get all tags for a venue
getVenueTags(venueId: string, userId?: string): Promise<UserTag[]>

// Create a new tag
createTag(request: CreateTagRequest, userId: string): Promise<UserTag>

// Toggle like/unlike on a tag
toggleTagLike(tagId: string, userId: string): Promise<{liked: boolean, newCount: number}>

// Delete user's own tag
deleteTag(tagId: string, userId: string): Promise<void>

// Get trending tags across platform
getTrendingTags(limit?: number): Promise<UserTag[]>
```

This system creates an engaging, community-driven experience that helps users discover and share what makes each venue special through authentic, user-generated content.