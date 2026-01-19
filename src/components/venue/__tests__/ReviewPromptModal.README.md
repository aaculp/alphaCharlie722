# ReviewPromptModal Component

## Overview

The `ReviewPromptModal` is a quick review prompt modal that appears after a user checks out from a venue. It provides a streamlined interface for users to quickly rate their experience with optional vibe selection.

## Features

### 1. Optional Vibe Selection (Requirement 2.2)
- Displays 5 vibe chips: Low-key, Vibey, Poppin, Lit, Maxed
- Reuses existing `ActivityLevel` system from `src/utils/formatting/activity.ts`
- Selection is completely optional - users can skip this step
- Visual feedback with color-coded chips matching activity level colors
- Chips can be toggled on/off

### 2. Quick Star Rating (Requirement 2.3)
- Compact 5-star rating selector
- Auto-submits rating when a star is tapped
- Includes optional vibe in submission (when backend support is added)
- Shows rating label (Poor, Fair, Good, Very Good, Excellent)
- Loading state during submission

### 3. Add Written Review Button (Requirements 2.4, 2.5)
- Opens full `ReviewSubmissionModal` for detailed feedback
- Passes selected rating and vibe to the full modal
- Allows users to expand their quick rating into a full review

## Props

```typescript
interface ReviewPromptModalProps {
  visible: boolean;                                    // Controls modal visibility
  onClose: () => void;                                 // Called when modal is dismissed
  venueId: string;                                     // ID of the venue being reviewed
  venueName: string;                                   // Name of the venue (displayed in header)
  onQuickRating: (rating: number, vibe?: ActivityLevel['level']) => void;  // Called after successful quick rating
  onFullReview: () => void;                            // Called when "Add Written Review" is tapped
}
```

## Usage Example

```typescript
import { ReviewPromptModal } from '../../components/venue';
import { useState } from 'react';

function CheckInModal() {
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [showFullReview, setShowFullReview] = useState(false);

  const handleCheckOut = async () => {
    // ... check-out logic ...
    
    // Show review prompt after check-out
    setShowReviewPrompt(true);
  };

  const handleQuickRating = (rating: number, vibe?: string) => {
    console.log('Quick rating submitted:', rating, vibe);
    setShowReviewPrompt(false);
  };

  const handleFullReview = () => {
    setShowReviewPrompt(false);
    setShowFullReview(true);
  };

  return (
    <>
      {/* Check-in/out UI */}
      
      <ReviewPromptModal
        visible={showReviewPrompt}
        onClose={() => setShowReviewPrompt(false)}
        venueId={venue.id}
        venueName={venue.name}
        onQuickRating={handleQuickRating}
        onFullReview={handleFullReview}
      />

      <ReviewSubmissionModal
        visible={showFullReview}
        onClose={() => setShowFullReview(false)}
        venueId={venue.id}
        venueName={venue.name}
        onSubmitSuccess={() => setShowFullReview(false)}
      />
    </>
  );
}
```

## Backend Storage Note

**IMPORTANT**: The current database schema does NOT include storage for vibe selections. The component is designed to accept and display vibe selections, but they are not persisted to the backend yet.

### Current Behavior
- Vibe selection is captured in the UI
- Vibe is passed to the `onQuickRating` callback
- Vibe is NOT sent to the backend in `ReviewService.submitReview()`

### Future Enhancement
When backend support for vibes is added:

1. Add a `vibe` column to the `reviews` table:
```sql
ALTER TABLE public.reviews 
ADD COLUMN vibe TEXT CHECK (vibe IN ('Low-key', 'Vibey', 'Poppin', 'Lit', 'Maxed'));
```

2. Update `SubmitReviewParams` type:
```typescript
export interface SubmitReviewParams {
  venueId: string;
  userId: string;
  rating: number;
  reviewText?: string;
  vibe?: ActivityLevel['level'];  // Add this
}
```

3. Update the submission in `ReviewPromptModal.tsx`:
```typescript
await ReviewService.submitReview({
  venueId,
  userId: user.id,
  rating,
  vibe: selectedVibe,  // Uncomment this line
});
```

## Integration Points

### 1. Check-In Flow Integration (Task 16)
The modal should be triggered after a user checks out from a venue:
- Show only if user hasn't already reviewed the venue
- Show only once per check-out session
- Check using `ReviewService.getUserReviewForVenue()`

### 2. Full Review Modal Integration
When user taps "Add Written Review":
- Close the prompt modal
- Open `ReviewSubmissionModal`
- Optionally pre-populate with selected rating and vibe

## Testing

Run tests with:
```bash
npm test -- src/components/venue/__tests__/ReviewPromptModal.test.tsx --no-watch
```

All tests should pass:
- ✓ renders without crashing
- ✓ displays venue name
- ✓ displays vibe selection label
- ✓ displays all vibe options
- ✓ displays rating label
- ✓ displays helper text
- ✓ displays "Maybe Later" button
- ✓ displays "Add Written Review" button

## Design Decisions

1. **Vibe Selection First**: Vibe chips are displayed before the star rating to encourage users to think about the atmosphere before rating.

2. **Auto-Submit on Rating**: Tapping a star immediately submits the rating to reduce friction and encourage quick feedback.

3. **Optional Everything**: Both vibe and written review are optional - users can submit with just a star rating.

4. **Color-Coded Vibes**: Each vibe uses its corresponding activity level color for visual consistency with the rest of the app.

5. **Loading State**: Shows a loading indicator during submission to provide feedback that the action is being processed.

## Accessibility

- All interactive elements are touchable with proper hit areas
- Loading states prevent double-submission
- Clear visual feedback for selected states
- Descriptive labels for screen readers

## Performance

- Minimal re-renders with proper state management
- Efficient vibe chip rendering with map
- No unnecessary API calls
- Proper cleanup on modal close
