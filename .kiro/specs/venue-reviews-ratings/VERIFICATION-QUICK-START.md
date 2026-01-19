# Quick Start: Task 26 Verification

## Overview

This is a streamlined guide to quickly verify the core functionality of the Venue Reviews & Ratings System. For comprehensive testing, refer to `CHECKPOINT-26-VERIFICATION.md`.

---

## Prerequisites

Before starting, ensure you have:

- [ ] Development environment running (`npm start` or `npx react-native start`)
- [ ] iOS Simulator OR Android Emulator running
- [ ] Supabase connected (local or staging/production)
- [ ] At least 2 test user accounts (1 customer, 1 venue owner)
- [ ] At least 2 test venues in database

---

## Quick Test Scenarios (15-20 minutes)

### 1. Complete User Flow (5 minutes)

**Goal:** Verify check-out → review prompt → submit review flow

**Steps:**
1. Log in as customer user
2. Navigate to a venue you haven't reviewed
3. Check in to the venue
4. Wait 2-3 seconds, then check out
5. **Verify:** Review prompt modal appears
6. Select 4 stars
7. **Verify:** Modal closes and rating submits
8. Navigate back to venue detail screen
9. **Verify:** Your 4-star review appears
10. **Verify:** Aggregate rating updated on venue card

**Expected Results:**
- ✅ Review prompt appears after check-out
- ✅ Quick rating submission works
- ✅ Review appears on venue detail
- ✅ Rating appears on venue card

---

### 2. Complete Venue Owner Flow (5 minutes)

**Goal:** Verify receive review → respond → notification sent

**Steps:**
1. As customer, submit a review for a venue owned by test venue owner
2. Log in as venue owner
3. Navigate to venue dashboard
4. **Verify:** New review appears in "Recent Reviews" section
5. Tap "Respond" button
6. Enter response: "Thank you for your feedback!"
7. Submit response
8. **Verify:** Response appears below review
9. Log back in as customer
10. **Verify:** Notification received (if push notifications enabled)
11. Navigate to the review
12. **Verify:** Venue owner response is visible

**Expected Results:**
- ✅ Review appears in dashboard
- ✅ Venue owner can respond
- ✅ Response displays correctly
- ✅ Notification sent to reviewer (if enabled)

---

### 3. Critical Edge Cases (5 minutes)

**Goal:** Verify key edge cases work correctly

#### Test 3.1: Duplicate Review Prevention
1. Navigate to a venue you've already reviewed
2. **Verify:** Button shows "Edit Your Review" (not "Write a Review")
3. Tap button
4. **Verify:** Modal opens with existing review pre-filled
5. Close modal without saving

#### Test 3.2: Zero Reviews State
1. Navigate to a venue with no reviews
2. **Verify:** "No reviews yet" message displays
3. **Verify:** "Write a Review" button is visible

#### Test 3.3: Character Limit
1. Open review modal
2. Type exactly 500 characters
3. **Verify:** Character counter shows "500/500"
4. **Verify:** Cannot type more characters
5. **Verify:** Counter turns warning color at 450+ chars

#### Test 3.4: Content Moderation
1. Open review modal
2. Type mild profanity (e.g., "The damn food was great!")
3. Submit review
4. **Verify:** Profanity is censored (e.g., "The d*** food was great!")
5. **Verify:** Review is still accepted

**Expected Results:**
- ✅ Cannot create duplicate reviews
- ✅ Zero reviews state displays correctly
- ✅ Character limit enforced
- ✅ Profanity filtering works

---

### 4. Cross-Platform Quick Check (5 minutes)

**Goal:** Verify basic functionality on both platforms

#### iOS Test
1. Run app on iOS Simulator
2. Complete Test Scenario 1 (User Flow)
3. **Verify:** No crashes or layout issues

#### Android Test
1. Run app on Android Emulator
2. Complete Test Scenario 1 (User Flow)
3. **Verify:** No crashes or layout issues

**Expected Results:**
- ✅ Works on iOS without issues
- ✅ Works on Android without issues

---

## Quick Verification Checklist

Use this checklist to track your progress:

### Core Functionality
- [ ] Review prompt appears after check-out
- [ ] Quick rating submission works
- [ ] Full review submission works
- [ ] Reviews display on venue detail screen
- [ ] Ratings display on venue cards
- [ ] Venue owner can respond to reviews
- [ ] Responses display correctly

### Edge Cases
- [ ] Duplicate review prevention works
- [ ] Zero reviews state displays correctly
- [ ] Character limit enforced (500 chars)
- [ ] Content moderation filters profanity
- [ ] "Edit Your Review" button works
- [ ] Review deletion works

### Cross-Platform
- [ ] Works on iOS
- [ ] Works on Android

---

## Common Issues & Quick Fixes

### Issue: Review prompt doesn't appear after check-out

**Quick Fix:**
1. Check if you've already reviewed the venue
2. Check if you dismissed the prompt earlier in the session
3. Restart the app and try again

### Issue: Reviews don't display on venue detail

**Quick Fix:**
1. Check network connection
2. Verify Supabase is connected
3. Check browser console for errors
4. Verify RLS policies are correct

### Issue: Cannot submit review

**Quick Fix:**
1. Verify you're logged in
2. Check if rating is selected (required)
3. Check character limit (max 500)
4. Check for severe content (hate speech/threats)

### Issue: Venue owner cannot respond

**Quick Fix:**
1. Verify logged in as venue owner
2. Verify venue ownership in database
3. Check RLS policies for venue_responses table

---

## Next Steps

### If All Tests Pass ✅
1. Mark Task 26 as complete
2. Document any minor issues in CHECKPOINT-26-VERIFICATION.md
3. Proceed to Task 27 (comprehensive test suite)

### If Issues Found ⚠️
1. Document issues in CHECKPOINT-26-VERIFICATION.md
2. Prioritize critical vs. minor issues
3. Fix critical issues before proceeding
4. Re-test after fixes

### If Blockers Found ❌
1. Document blockers clearly
2. Determine if they prevent proceeding to Task 27
3. Create action plan to resolve blockers
4. Escalate if needed

---

## Testing Commands

### Start Development Server
```bash
npm start
# or
npx react-native start
```

### Run on iOS
```bash
npm run ios
# or
npx react-native run-ios
```

### Run on Android
```bash
npm run android
# or
npx react-native run-android
```

### Check Logs
```bash
# iOS logs
npx react-native log-ios

# Android logs
npx react-native log-android
```

---

## Test Data Setup (If Needed)

### Create Test User
```sql
-- Run in Supabase SQL Editor
-- This creates a test customer user
INSERT INTO auth.users (email, encrypted_password)
VALUES ('test@example.com', crypt('password123', gen_salt('bf')));
```

### Create Test Venue
```sql
-- Run in Supabase SQL Editor
INSERT INTO venues (name, address, latitude, longitude)
VALUES ('Test Venue', '123 Test St', 40.7128, -74.0060);
```

### Create Test Check-in
```sql
-- Run in Supabase SQL Editor
INSERT INTO check_ins (user_id, venue_id)
VALUES ('USER_ID', 'VENUE_ID');
```

---

## Time Estimate

- **Quick Test (Core Functionality Only):** 15-20 minutes
- **Comprehensive Test (All Edge Cases):** 45-60 minutes
- **Full Cross-Platform Test:** 1-2 hours

---

**Recommendation:** Start with the Quick Test to verify core functionality, then proceed to comprehensive testing if time permits.

