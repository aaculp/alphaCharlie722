# Checkpoint 26: Core Functionality Verification

## Overview

This checkpoint verifies that all core review and rating functionality is working end-to-end. This includes the complete user flow, venue owner flow, edge cases, and cross-platform testing.

**Status**: In Progress  
**Date**: January 18, 2026

---

## Test Environment Setup

### Prerequisites
- [ ] Development environment running (Metro bundler)
- [ ] Supabase local instance running OR connected to staging/production
- [ ] Test user accounts created (customer and venue owner)
- [ ] Test venues with various review states (no reviews, few reviews, many reviews)
- [ ] Physical devices available (iOS and Android) OR emulators configured

### Test Data Requirements
- [ ] At least 2 customer test accounts
- [ ] At least 1 venue owner test account
- [ ] At least 3 test venues (owned by venue owner account)
- [ ] Existing check-ins for test users at test venues

---

## 1. Complete User Flow Testing

### 1.1 Check-out → Review Prompt → Submit Review

#### Test Case 1.1.1: Quick Rating Submission
**Steps**:
1. Log in as customer test user
2. Navigate to a venue detail screen
3. Check in to the venue
4. Wait a few seconds, then check out
5. Verify review prompt modal appears
6. Select a star rating (e.g., 4 stars)
7. Verify modal closes and rating is submitted

**Expected Results**:
- [ ] Review prompt modal appears immediately after check-out
- [ ] Venue name is displayed in the prompt
- [ ] 5-star selector is visible and interactive
- [ ] Tapping a star submits the rating immediately
- [ ] Success message or confirmation appears
- [ ] Modal closes automatically
- [ ] Review appears on venue detail screen

**Actual Results**:
```
[Record observations here]
```

---

#### Test Case 1.1.2: Full Review Submission from Prompt
**Steps**:
1. Log in as customer test user
2. Check in and check out from a different venue
3. When review prompt appears, select a star rating
4. Tap "Add written review" button
5. Enter review text (e.g., "Great atmosphere and friendly staff!")
6. Tap submit

**Expected Results**:
- [ ] Review prompt appears after check-out
- [ ] "Add written review" button is visible after selecting rating
- [ ] Full review modal opens with pre-selected rating
- [ ] Text input field is enabled
- [ ] Character counter shows (e.g., "45/500")
- [ ] Submit button is enabled
- [ ] Review submits successfully
- [ ] Review appears with both rating and text

**Actual Results**:
```
[Record observations here]
```

---

#### Test Case 1.1.3: Review from Venue Detail Screen
**Steps**:
1. Log in as customer test user
2. Navigate to a venue you haven't reviewed
3. Tap "Write a Review" button
4. Select 5 stars
5. Enter review text: "Amazing experience! Highly recommend."
6. Tap submit

**Expected Results**:
- [ ] "Write a Review" button is visible on venue detail screen
- [ ] Review modal opens when button is tapped
- [ ] Star selector works correctly
- [ ] Text input accepts input
- [ ] Character counter updates in real-time
- [ ] Submit button becomes enabled after selecting rating
- [ ] Review submits successfully
- [ ] Button changes to "Edit Your Review" after submission

**Actual Results**:
```
[Record observations here]
```

---

#### Test Case 1.1.4: Verified Review Badge
**Steps**:
1. Submit a review for a venue you've checked in to
2. View the review on the venue detail screen
3. Check for verified badge

**Expected Results**:
- [ ] Review displays "Verified Visit" badge or checkmark icon
- [ ] Badge is visually distinct (color/icon)
- [ ] Badge appears on both venue detail and full review list

**Actual Results**:
```
[Record observations here]
```

---

### 1.2 Review Editing and Deletion

#### Test Case 1.2.1: Edit Existing Review
**Steps**:
1. Navigate to a venue you've already reviewed
2. Tap "Edit Your Review" button
3. Change rating from 5 to 4 stars
4. Update text to: "Good, but could be better."
5. Tap submit

**Expected Results**:
- [ ] Button text shows "Edit Your Review" (not "Write a Review")
- [ ] Modal opens with existing rating and text pre-filled
- [ ] Can modify both rating and text
- [ ] Submit button saves changes
- [ ] "Edited" indicator appears on review
- [ ] Updated timestamp is shown

**Actual Results**:
```
[Record observations here]
```

---

#### Test Case 1.2.2: Delete Review
**Steps**:
1. View your own review on venue detail screen
2. Tap three-dot menu or delete button
3. Tap "Delete"
4. Confirm deletion in dialog

**Expected Results**:
- [ ] Delete option is visible only on own reviews
- [ ] Confirmation dialog appears
- [ ] Review is removed after confirmation
- [ ] Venue's review count decrements by 1
- [ ] Venue's aggregate rating recalculates
- [ ] Button changes back to "Write a Review"

**Actual Results**:
```
[Record observations here]
```

---

### 1.3 Helpful Votes

#### Test Case 1.3.1: Mark Review as Helpful
**Steps**:
1. Log in as a different customer user
2. Navigate to a venue with reviews
3. Find a review by another user
4. Tap "Helpful" button
5. Verify count increments
6. Tap "Helpful" again to toggle off

**Expected Results**:
- [ ] "Helpful" button is visible on all reviews
- [ ] Tapping button increments count by 1
- [ ] Button shows active state (highlighted/filled)
- [ ] Tapping again decrements count by 1
- [ ] Button returns to inactive state
- [ ] Cannot vote on own reviews (button disabled)

**Actual Results**:
```
[Record observations here]
```

---

### 1.4 Review Filtering and Sorting

#### Test Case 1.4.1: Filter by Rating
**Steps**:
1. Navigate to full review list for a venue with multiple reviews
2. Tap filter button
3. Select "5 Stars" filter
4. Verify only 5-star reviews are shown
5. Clear filter

**Expected Results**:
- [ ] Filter options are visible (All, 5★, 4★, 3★, 2★, 1★)
- [ ] Selecting filter shows only matching reviews
- [ ] Active filter count badge appears
- [ ] "Clear Filters" button is visible when filters active
- [ ] Clearing filters shows all reviews again

**Actual Results**:
```
[Record observations here]
```

---

#### Test Case 1.4.2: Sort Reviews
**Steps**:
1. View full review list
2. Tap sort button
3. Select "Highest Rated"
4. Verify reviews are sorted by rating (5 to 1)
5. Change to "Most Helpful"
6. Verify reviews are sorted by helpful count

**Expected Results**:
- [ ] Sort options visible (Most Recent, Highest Rated, Lowest Rated, Most Helpful)
- [ ] Reviews reorder correctly for each sort option
- [ ] Default sort is "Most Recent"

**Actual Results**:
```
[Record observations here]
```

---

## 2. Complete Venue Owner Flow Testing

### 2.1 Receive Review Notification

#### Test Case 2.1.1: New Review Notification
**Steps**:
1. As customer, submit a review for venue owned by test venue owner
2. Check venue owner's device for push notification
3. Tap notification

**Expected Results**:
- [ ] Push notification appears on venue owner's device
- [ ] Notification shows reviewer name and rating
- [ ] Notification shows venue name
- [ ] Tapping notification navigates to review or dashboard
- [ ] Notifications are batched (max 1 per hour per venue)

**Actual Results**:
```
[Record observations here]
```

---

### 2.2 Respond to Review

#### Test Case 2.2.1: Submit Venue Owner Response
**Steps**:
1. Log in as venue owner
2. Navigate to venue dashboard
3. View "Recent Reviews" section
4. Tap "Respond" on a review
5. Enter response: "Thank you for your feedback! We're glad you enjoyed your visit."
6. Submit response

**Expected Results**:
- [ ] "Respond" button visible on reviews in dashboard
- [ ] Response modal opens with 300 character limit
- [ ] Character counter shows remaining characters
- [ ] Response submits successfully
- [ ] Response appears below review with "Response from [Venue Name]" label
- [ ] "Responded" indicator appears on review card

**Actual Results**:
```
[Record observations here]
```

---

#### Test Case 2.2.2: Response Notification to Reviewer
**Steps**:
1. After venue owner responds (from 2.2.1)
2. Check customer's device for notification
3. Tap notification

**Expected Results**:
- [ ] Push notification appears on reviewer's device
- [ ] Notification indicates venue owner responded
- [ ] Tapping notification navigates to the review
- [ ] Response is visible below review

**Actual Results**:
```
[Record observations here]
```

---

#### Test Case 2.2.3: Edit/Delete Response
**Steps**:
1. As venue owner, view a review with your response
2. Edit the response text
3. Save changes
4. Delete the response

**Expected Results**:
- [ ] Edit option is available on own responses
- [ ] Response text can be modified
- [ ] Changes save successfully
- [ ] Delete option removes response
- [ ] "Responded" indicator disappears after deletion

**Actual Results**:
```
[Record observations here]
```

---

### 2.3 Dashboard Analytics

#### Test Case 2.3.1: Review Analytics Display
**Steps**:
1. Log in as venue owner
2. Navigate to venue dashboard
3. Check "Today's Performance" section
4. Check "Recent Reviews" section
5. Check rating distribution chart

**Expected Results**:
- [ ] "Today's Rating" shows average of today's reviews
- [ ] "Avg. Rating" shows weekly average
- [ ] "Recent Reviews" shows 5 most recent reviews
- [ ] Rating distribution chart shows counts for each star level
- [ ] Tapping distribution bar filters reviews by that rating
- [ ] All data is real (not mock data)

**Actual Results**:
```
[Record observations here]
```

---

## 3. Edge Cases Testing

### 3.1 Zero Reviews State

#### Test Case 3.1.1: Venue with No Reviews
**Steps**:
1. Navigate to a venue with zero reviews
2. Check venue detail screen
3. Check venue card on home feed

**Expected Results**:
- [ ] Venue detail shows "No reviews yet. Be the first to review!"
- [ ] "Write a Review" button is visible
- [ ] Venue card shows "No reviews yet"
- [ ] No star rating is displayed (or shows 0.0)
- [ ] Review count shows 0

**Actual Results**:
```
[Record observations here]
```

---

### 3.2 Rate Limiting

#### Test Case 3.2.1: Exceed Review Rate Limit
**Steps**:
1. Submit 5 reviews within 1 hour (to different venues)
2. Attempt to submit a 6th review
3. Check error message

**Expected Results**:
- [ ] 6th review submission is rejected
- [ ] Error message indicates rate limit exceeded
- [ ] Error shows time until reset (e.g., "Try again in 45 minutes")
- [ ] Previous 5 reviews are still visible

**Actual Results**:
```
[Record observations here]
```

---

### 3.3 Duplicate Review Prevention

#### Test Case 3.3.1: Attempt Duplicate Review
**Steps**:
1. Submit a review for a venue
2. Try to submit another review for the same venue

**Expected Results**:
- [ ] Button changes to "Edit Your Review" after first submission
- [ ] Cannot create second review
- [ ] Editing opens existing review instead

**Actual Results**:
```
[Record observations here]
```

---

### 3.4 Content Moderation

#### Test Case 3.4.1: Mild Profanity Filtering
**Steps**:
1. Submit a review with mild profanity (e.g., "The damn food was amazing!")
2. Check submitted review

**Expected Results**:
- [ ] Review is accepted
- [ ] Profanity is censored with asterisks (e.g., "The d*** food was amazing!")
- [ ] User is notified that words were filtered
- [ ] Review is still visible

**Actual Results**:
```
[Record observations here]
```

---

#### Test Case 3.4.2: Severe Content Rejection
**Steps**:
1. Attempt to submit a review with hate speech or threats
2. Check error message

**Expected Results**:
- [ ] Review submission is rejected
- [ ] Error message explains content policy violation
- [ ] Guidance on community guidelines is provided
- [ ] Review is not saved

**Actual Results**:
```
[Record observations here]
```

---

### 3.5 Character Limits

#### Test Case 3.5.1: Review Text Character Limit
**Steps**:
1. Open review modal
2. Type exactly 500 characters
3. Attempt to type more

**Expected Results**:
- [ ] Character counter shows "500/500"
- [ ] Counter turns warning color at 450 characters
- [ ] Cannot type beyond 500 characters
- [ ] Submit button remains enabled

**Actual Results**:
```
[Record observations here]
```

---

#### Test Case 3.5.2: Response Character Limit
**Steps**:
1. As venue owner, respond to a review
2. Type exactly 300 characters
3. Attempt to type more

**Expected Results**:
- [ ] Character counter shows "300/300"
- [ ] Cannot type beyond 300 characters
- [ ] Submit button remains enabled

**Actual Results**:
```
[Record observations here]
```

---

### 3.6 Whitespace Validation

#### Test Case 3.6.1: Whitespace-Only Review
**Steps**:
1. Open review modal
2. Select a rating
3. Enter only spaces/tabs in text field
4. Attempt to submit

**Expected Results**:
- [ ] Review is rejected OR text is trimmed to empty
- [ ] Rating-only review is accepted (text is optional)
- [ ] Error message if validation fails

**Actual Results**:
```
[Record observations here]
```

---

### 3.7 Real-time Updates

#### Test Case 3.7.1: Live Rating Updates
**Steps**:
1. Open venue detail screen on Device A
2. On Device B, submit a new review for the same venue
3. Check if Device A updates automatically

**Expected Results**:
- [ ] Aggregate rating updates on Device A
- [ ] Review count increments on Device A
- [ ] New review appears in review list
- [ ] Update happens within a few seconds (real-time subscription)

**Actual Results**:
```
[Record observations here]
```

---

### 3.8 Aggregate Rating Calculation

#### Test Case 3.8.1: Rating Recalculation on Delete
**Steps**:
1. Note current aggregate rating for a venue (e.g., 4.5 with 10 reviews)
2. Delete one of your reviews
3. Check new aggregate rating

**Expected Results**:
- [ ] Aggregate rating recalculates immediately
- [ ] Review count decrements by 1
- [ ] New rating is mathematically correct (average of remaining reviews)
- [ ] Changes reflect on venue cards and detail screen

**Actual Results**:
```
[Record observations here]
```

---

## 4. Cross-Platform Testing

### 4.1 iOS Physical Device Testing

#### Test Case 4.1.1: Complete Flow on iOS
**Device**: [iPhone model and iOS version]

**Steps**:
1. Run through Test Cases 1.1.1 - 1.1.4 on iOS device
2. Test notifications on iOS
3. Test UI responsiveness and styling

**Expected Results**:
- [ ] All functionality works on iOS
- [ ] UI renders correctly (no layout issues)
- [ ] Notifications appear correctly
- [ ] Touch interactions work smoothly
- [ ] No crashes or errors

**Actual Results**:
```
[Record observations here]
```

---

### 4.2 Android Physical Device Testing

#### Test Case 4.2.1: Complete Flow on Android
**Device**: [Android model and version]

**Steps**:
1. Run through Test Cases 1.1.1 - 1.1.4 on Android device
2. Test notifications on Android
3. Test UI responsiveness and styling

**Expected Results**:
- [ ] All functionality works on Android
- [ ] UI renders correctly (no layout issues)
- [ ] Notifications appear correctly
- [ ] Touch interactions work smoothly
- [ ] No crashes or errors

**Actual Results**:
```
[Record observations here]
```

---

## 5. Performance Testing

### 5.1 Load Time Testing

#### Test Case 5.1.1: Review Fetch Performance
**Steps**:
1. Navigate to venue with 50+ reviews
2. Measure time to load reviews
3. Scroll through paginated reviews

**Expected Results**:
- [ ] Initial review load completes within 300ms
- [ ] Pagination loads next page within 300ms
- [ ] No lag or stuttering during scroll
- [ ] Cache is used for subsequent loads (faster)

**Actual Results**:
```
[Record observations here]
```

---

#### Test Case 5.1.2: Review Submission Performance
**Steps**:
1. Submit a review
2. Measure time from tap to confirmation

**Expected Results**:
- [ ] Review submission completes within 500ms
- [ ] Optimistic UI update shows review immediately
- [ ] No blocking or freezing during submission

**Actual Results**:
```
[Record observations here]
```

---

## 6. Known Issues and Blockers

### Issues Found During Testing

| Issue # | Description | Severity | Status | Notes |
|---------|-------------|----------|--------|-------|
| 1 | [Description] | High/Medium/Low | Open/Fixed | [Notes] |
| 2 | [Description] | High/Medium/Low | Open/Fixed | [Notes] |

---

## 7. Summary and Sign-off

### Test Coverage Summary

- **User Flow Tests**: [ ] Pass / [ ] Fail
- **Venue Owner Flow Tests**: [ ] Pass / [ ] Fail
- **Edge Cases Tests**: [ ] Pass / [ ] Fail
- **Cross-Platform Tests**: [ ] Pass / [ ] Fail
- **Performance Tests**: [ ] Pass / [ ] Fail

### Overall Status

- [ ] ✅ All tests passed - Ready to proceed
- [ ] ⚠️ Minor issues found - Can proceed with notes
- [ ] ❌ Critical issues found - Must fix before proceeding

### Tester Sign-off

**Tested by**: [Name]  
**Date**: [Date]  
**Approved**: [ ] Yes / [ ] No

### Notes and Recommendations

```
[Add any additional notes, observations, or recommendations here]
```

---

## Next Steps

After completing this checkpoint:

1. **If all tests pass**: Mark Task 26 as complete and proceed to Task 27 (comprehensive test suite)
2. **If issues found**: Document issues, prioritize fixes, and re-test
3. **If blockers found**: Escalate to team and determine resolution plan

