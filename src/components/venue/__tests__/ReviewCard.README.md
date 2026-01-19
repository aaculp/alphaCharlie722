# ReviewCard Component

## Overview

The `ReviewCard` component displays an individual review with all associated information and interactive elements. It's designed to be used in review lists on venue detail screens and full review screens.

## Features Implemented

### ✅ Subtask 12.1: Review Display
- **Reviewer Information**: Shows profile picture (or placeholder), display name
- **Rating Display**: 5-star visual rating
- **Review Text**: Full text with "Read more" expansion for long reviews (>200 chars)
- **Timestamp**: Relative time display (e.g., "2h ago", "3d ago")
- **Verified Badge**: Shows "Verified" badge for users who checked in before reviewing
- **Edited Indicator**: Shows "Edited" label when `updated_at > created_at`

### ✅ Subtask 12.2: Helpful Button
- **Vote Count Display**: Shows current helpful vote count
- **Active State**: Visual feedback when user has voted helpful
- **Toggle Behavior**: Click to add/remove helpful vote
- **Self-Review Protection**: Disabled for user's own reviews with alert message
- **Loading State**: Shows spinner during vote submission

### ✅ Subtask 12.3: Edit/Delete Options
- **Three-Dot Menu**: Shows options menu for own reviews
- **Edit Option**: Opens edit flow (callback to parent)
- **Delete Option**: Shows confirmation dialog before deletion
- **Report Option**: Available for other users' reviews
- **Conditional Display**: Only shows for appropriate user (owner or reporter)

### ✅ Subtask 12.4: Venue Owner Response Display
- **Response Section**: Displays below review with distinct styling
- **Venue Label**: Shows "Response from [Venue Name]"
- **Response Text**: Full response text from venue owner
- **Response Timestamp**: When the response was posted
- **Responded Indicator**: Shows "Responded" badge in actions row
- **Respond Button**: For venue owners to add response (if not yet responded)

## Props Interface

```typescript
interface ReviewCardProps {
  review: ReviewWithReviewer;           // Review data with joined reviewer info
  onHelpfulToggle: (reviewId: string) => void;  // Callback for helpful vote
  onEdit?: () => void;                  // Optional: Edit callback (own reviews)
  onDelete?: () => void;                // Optional: Delete callback (own reviews)
  onReport?: () => void;                // Optional: Report callback (other reviews)
  onVenueResponse?: () => void;         // Optional: Respond callback (venue owners)
  currentUserId?: string;               // Current user ID for ownership checks
  isVenueOwner?: boolean;               // Whether current user is venue owner
  venueName?: string;                   // Venue name for response label
}
```

## Usage Examples

### Basic Review Display
```typescript
<ReviewCard
  review={review}
  onHelpfulToggle={handleHelpfulToggle}
  currentUserId={user?.id}
/>
```

### With Edit/Delete (Own Review)
```typescript
<ReviewCard
  review={review}
  onHelpfulToggle={handleHelpfulToggle}
  onEdit={() => openEditModal(review)}
  onDelete={() => deleteReview(review.id)}
  currentUserId={user?.id}
/>
```

### With Venue Owner Response
```typescript
<ReviewCard
  review={review}
  onHelpfulToggle={handleHelpfulToggle}
  onVenueResponse={() => openResponseModal(review.id)}
  currentUserId={user?.id}
  isVenueOwner={true}
  venueName="The Rooftop Bar"
/>
```

### With Report Option
```typescript
<ReviewCard
  review={review}
  onHelpfulToggle={handleHelpfulToggle}
  onReport={() => reportReview(review.id)}
  currentUserId={user?.id}
/>
```

## Requirements Validated

- ✅ **3.6**: Show reviewer name, profile picture, rating, text, timestamp
- ✅ **3.7**: Display helpful button with vote count
- ✅ **5.1**: Display helpful count
- ✅ **5.5**: Toggle active state based on user vote
- ✅ **5.6**: Disable for user's own reviews
- ✅ **6.1**: Show edit/delete options only for own reviews
- ✅ **6.4**: Confirmation dialog for delete
- ✅ **6.8**: Show "Edited" indicator if updated_at > created_at
- ✅ **8.2**: Show verified badge if is_verified = true
- ✅ **9.3**: Show response below review
- ✅ **9.4**: Display "Response from [Venue Name]" label
- ✅ **9.8**: Show "Responded" indicator on card

## Styling Features

- **Theme Integration**: Fully integrated with app theme system
- **Responsive Layout**: Adapts to different screen sizes
- **Visual Hierarchy**: Clear separation between review and response
- **Interactive States**: Hover/press states for all buttons
- **Accessibility**: Proper touch targets and visual feedback

## Edge Cases Handled

1. **Missing Reviewer Data**: Shows "Anonymous" with placeholder avatar
2. **No Review Text**: Hides text section (rating-only reviews)
3. **Long Review Text**: Truncates with "Read more" expansion
4. **Self-Helpful Vote**: Shows alert and prevents action
5. **Missing Venue Name**: Falls back to "Venue" in response label
6. **Loading States**: Shows spinner during helpful vote toggle

## Next Steps

This component is ready to be integrated into:
- Task 13: ReviewList component (displays multiple ReviewCards)
- Task 17: VenueDetailScreen integration
- Task 19: Venue dashboard analytics

## Testing Recommendations

When writing tests for this component:
1. Test all conditional rendering (verified badge, edited indicator, response)
2. Test helpful vote toggle with different states
3. Test edit/delete menu for own vs. other reviews
4. Test "Read more" expansion for long text
5. Test venue owner response display
6. Test timestamp formatting for various time ranges
