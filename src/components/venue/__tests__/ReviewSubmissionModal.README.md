# ReviewSubmissionModal Component

## Overview

The `ReviewSubmissionModal` component provides a complete interface for users to submit new reviews or edit existing reviews for venues. It includes a 5-star rating selector, text input with character counter, content moderation, and comprehensive validation.

## Features Implemented

### Subtask 10.1: 5-Star Rating Selector ✅

**Requirements: 1.3, 1.4, 1.5**

- ✅ Displays 5 interactive star buttons
- ✅ Highlights selected star and all stars to the left (filled stars)
- ✅ Shows rating label (Poor, Fair, Good, Very Good, Excellent)
- ✅ Enables text input when rating is selected
- ✅ Visual feedback with gold color (#FFD700) for selected stars
- ✅ Required field indicator (red asterisk)

### Subtask 10.2: Review Text Input ✅

**Requirements: 1.6, 13.2, 13.3, 13.4, 13.5**

- ✅ Character counter displaying current/max (e.g., "0/500")
- ✅ Warning color (yellow #FFD700) at 450 characters
- ✅ Error color (red #FF6B6B) at 500 characters
- ✅ Prevents input beyond 500 characters
- ✅ Multiline text input with proper styling
- ✅ Optional field (text is not required, only rating)
- ✅ Placeholder text: "Share your experience... (optional)"

### Subtask 10.3: Submission Logic ✅

**Requirements: 1.7, 1.9, 1.10, 6.2**

- ✅ Validates rating is required before submission
- ✅ Applies content moderation using ContentModerationService
- ✅ Shows success message on successful submission
- ✅ Shows error message on failure with retry option
- ✅ Handles edit mode (pre-populates existing review)
- ✅ Disables submit button when rating is not selected
- ✅ Shows loading state during submission
- ✅ Displays moderation notice when content is filtered
- ✅ Rejects severe content with appropriate message

## Component Props

```typescript
interface ReviewSubmissionModalProps {
  visible: boolean;           // Controls modal visibility
  onClose: () => void;        // Called when modal is closed
  venueId: string;            // ID of the venue being reviewed
  venueName: string;          // Name of the venue (displayed in modal)
  existingReview?: Review;    // Optional: For edit mode
  onSubmitSuccess: () => void; // Called after successful submission
}
```

## Usage Example

### New Review
```typescript
<ReviewSubmissionModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  venueId="venue-123"
  venueName="The Coffee Shop"
  onSubmitSuccess={() => {
    // Refresh reviews list
    refetchReviews();
  }}
/>
```

### Edit Existing Review
```typescript
<ReviewSubmissionModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  venueId="venue-123"
  venueName="The Coffee Shop"
  existingReview={userReview}
  onSubmitSuccess={() => {
    // Refresh reviews list
    refetchReviews();
  }}
/>
```

## Validation Rules

1. **Rating**: Required (1-5 stars)
2. **Review Text**: Optional, max 500 characters
3. **Whitespace**: Leading/trailing whitespace is trimmed
4. **Empty Text**: Text with only whitespace is rejected
5. **Content Moderation**: 
   - Mild profanity is censored with asterisks
   - Severe content (hate speech, threats) is rejected
   - Venue-specific terms are whitelisted

## User Experience

### Visual Feedback
- Star rating shows descriptive labels (Poor, Fair, Good, etc.)
- Character counter changes color as limit approaches
- Submit button is disabled until rating is selected
- Loading spinner shown during submission
- Moderation notice displayed when content is filtered

### Error Handling
- Clear error messages for validation failures
- Retry option on submission errors
- Authentication check before submission
- Duplicate review prevention (handled by backend)

### Accessibility
- Large touch targets for star buttons (40px icons + padding)
- Clear visual hierarchy with labels and sections
- Descriptive button text
- Proper keyboard handling for text input

## Integration Points

### Services Used
- `ReviewService.submitReview()` - Submit new review
- `ReviewService.updateReview()` - Update existing review
- `ContentModerationService.filterProfanity()` - Content moderation
- `ContentModerationService.validateReviewText()` - Text validation

### Contexts Used
- `useAuth()` - Get current user ID
- `useTheme()` - Theme colors and styling

## Testing

The component includes comprehensive unit tests covering:
- ✅ Basic rendering
- ✅ Venue name display
- ✅ Edit mode detection
- ✅ Rating label display
- ✅ Text input placeholder
- ✅ Character counter
- ✅ Submit button
- ✅ Cancel button

Run tests with:
```bash
npm test -- ReviewSubmissionModal.test.tsx --no-watch
```

## Styling

The component uses:
- Modal overlay with semi-transparent background
- Bottom sheet style (slides up from bottom)
- Rounded corners (20px top corners)
- Responsive sizing (max 90% of screen height)
- Theme-aware colors
- Consistent spacing and padding
- Shadow effects for depth

## Next Steps

This component is ready for integration into:
1. **VenueDetailScreen** - "Write a Review" / "Edit Your Review" button
2. **ReviewPromptModal** - "Add written review" button (Task 11)
3. **ReviewCard** - Edit button for user's own reviews (Task 12)

## Requirements Validation

All requirements for Task 10 have been successfully implemented:

- ✅ **1.3**: 5-star rating selector displayed
- ✅ **1.4**: Selected star and all stars to the left are highlighted
- ✅ **1.5**: Text input enabled when rating selected
- ✅ **1.6**: Up to 500 characters allowed
- ✅ **1.7**: Rating required for submission
- ✅ **1.9**: Success message displayed
- ✅ **1.10**: Error message with retry option
- ✅ **6.2**: Edit mode pre-populates existing review
- ✅ **13.2**: 500 character maximum enforced
- ✅ **13.3**: Character counter displayed
- ✅ **13.4**: Warning color at 450 chars
- ✅ **13.5**: Input prevented beyond 500 chars
