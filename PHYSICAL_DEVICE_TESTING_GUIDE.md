# Physical Device Testing Guide - Minimal Setup

## Overview
This guide shows you how to test push notifications on physical devices with **minimal setup** - you only need 2 devices and 15 minutes.

## 🎯 Goal
Validate that FCM messages are actually delivered to real devices and notifications appear correctly.

## 📱 What You Need

### Minimum Setup (15 minutes)
- **2 Physical Devices**:
  - Device 1: Android phone (venue owner)
  - Device 2: Android phone (customer)
- **OR** 1 Android + 1 iPhone (better coverage)

### Why Only 2 Devices?
- Device 1 creates offers
- Device 2 receives notifications
- This validates the entire end-to-end flow

## 🚀 Quick Start (15-Minute Test)

### Step 1: Install App on Both Devices (5 min)

**Option A: Development Build**
```bash
# Build and install on Device 1
npx react-native run-android --device

# Build and install on Device 2
npx react-native run-android --device
```

**Option B: APK Distribution**
```bash
# Build release APK
cd android
./gradlew assembleRelease

# APK location: android/app/build/outputs/apk/release/app-release.apk
# Transfer to devices via USB, email, or cloud storage
```

### Step 2: Setup Test Accounts (3 min)

**Device 1 (Venue Owner)**:
1. Open app
2. Sign up as venue owner
3. Complete venue registration
4. Note venue ID from database

**Device 2 (Customer)**:
1. Open app
2. Sign up as customer
3. Enable location permissions
4. Enable notification permissions
5. Note user ID from database

### Step 3: Position Devices (1 min)

- Keep both devices in same location (within 1 mile)
- OR manually set customer location near venue in database

```sql
-- If needed, manually set customer location near venue
UPDATE profiles 
SET last_known_latitude = 28.5383,  -- Same as venue
    last_known_longitude = -81.3792
WHERE id = 'CUSTOMER_USER_ID';
```

### Step 4: Create Test Offer (2 min)

**On Device 1 (Venue Owner)**:
1. Navigate to Flash Offers
2. Create new offer:
   - Title: "Test Notification"
   - Discount: 20%
   - Quantity: 10
   - Expiration: 2 hours
   - Radius: 10 miles
   - ✅ Enable "Send Push Notification"
3. Submit offer

### Step 5: Verify Notification (2 min)

**On Device 2 (Customer)**:
- ✅ Notification should appear within 5 seconds
- ✅ Check notification tray
- ✅ Tap notification → should open app to offer detail

### Step 6: Verify in Database (2 min)

```sql
-- Check offer was marked as sent
SELECT id, title, push_sent, created_at 
FROM flash_offers 
WHERE title = 'Test Notification';

-- Check analytics
SELECT * FROM flash_offer_analytics 
WHERE offer_id = 'OFFER_ID';

-- Check Edge Function logs
```

```bash
# View Edge Function logs
supabase functions logs send-flash-offer-push --limit 20
```

## ✅ Success Criteria

If you see ALL of these, your system works:
- ✅ Notification appears on Device 2
- ✅ Notification has correct title and message
- ✅ Tapping notification opens app
- ✅ Offer shows in app
- ✅ Database shows `push_sent = true`
- ✅ Analytics recorded
- ✅ Edge Function logs show success

## 🧪 Additional Tests (Optional - 30 min)

### Test 1: Notification Preferences (5 min)

**On Device 2**:
1. Go to Settings → Notifications
2. Toggle "Flash Offer Notifications" OFF
3. Create another offer on Device 1
4. Verify Device 2 does NOT receive notification

### Test 2: Quiet Hours (5 min)

**On Device 2**:
1. Go to Settings → Notifications
2. Set Quiet Hours: Current Time - 1 hour to Current Time + 2 hours
3. Create another offer on Device 1
4. Verify Device 2 does NOT receive notification

### Test 3: Rate Limiting (5 min)

**On Device 1**:
1. Create 3 offers (free tier limit)
2. Attempt to create 4th offer
3. Verify error message: "Daily limit reached"

### Test 4: Multiple Customers (10 min)

**Setup**:
- Install app on 2 more devices (Device 3 & 4)
- Sign up as customers
- Enable notifications

**Test**:
- Create offer on Device 1
- Verify all customer devices receive notification

### Test 5: Background Notifications (5 min)

**On Device 2**:
1. Close app completely (swipe away from recent apps)
2. Create offer on Device 1
3. Verify notification still appears on Device 2
4. Tap notification → app should open to offer

## 📊 Test Results

| Test | Device 1 (Venue) | Device 2 (Customer) | Status | Notes |
|------|------------------|---------------------|--------|-------|
| Basic Notification | Creates offer | Receives notification | ⬜ | |
| Notification Tap | - | Opens app to offer | ⬜ | |
| Database Update | `push_sent = true` | - | ⬜ | |
| Analytics | Tracked | - | ⬜ | |
| Preferences OFF | Creates offer | No notification | ⬜ | |
| Quiet Hours | Creates offer | No notification | ⬜ | |
| Rate Limiting | 4th offer fails | - | ⬜ | |
| Multiple Customers | Creates offer | All receive | ⬜ | |
| Background | Creates offer | Receives while closed | ⬜ | |

## 🔍 Troubleshooting

### Issue: No Notification Received

**Check 1: Device Token**
```sql
-- Verify device token exists and is active
SELECT * FROM device_tokens WHERE user_id = 'CUSTOMER_USER_ID';
```
- Should show `is_active = true`
- Token should not be empty

**Check 2: Notification Permissions**
- Go to device Settings → Apps → Your App → Notifications
- Verify notifications are enabled

**Check 3: Edge Function Logs**
```bash
supabase functions logs send-flash-offer-push --limit 20
```
- Look for errors
- Check if user was targeted
- Check if FCM send succeeded

**Check 4: Firebase Console**
- Go to Firebase Console → Cloud Messaging
- Check for any quota issues or errors

### Issue: Notification Appears But Doesn't Open App

**Check 1: Notification Data**
- Verify notification includes `data.offerId`
- Verify notification includes `data.type = 'flash_offer'`

**Check 2: App Notification Handler**
- Check `src/services/NotificationHandler.ts`
- Verify tap handler is registered

### Issue: Notification Delayed

**Normal Delays**:
- FCM delivery: 0-5 seconds (normal)
- Network conditions: Up to 30 seconds (acceptable)
- Battery optimization: Up to 2 minutes (device-specific)

**If Delayed >2 Minutes**:
- Check device battery optimization settings
- Check network connection
- Check Firebase Console for delivery issues

## 🎯 Confidence Levels

After completing tests:

| Tests Completed | Confidence Level | Ready for Production? |
|-----------------|------------------|----------------------|
| Basic Test Only | 70% | ⚠️ Not recommended |
| Basic + 2 Optional | 85% | ⚠️ Risky |
| Basic + All Optional | 95% | ✅ Yes |
| Basic + All + Multiple Devices | 99% | ✅ Highly confident |

## 🚀 Production Deployment Checklist

Before deploying to production:

- [ ] All emulator tests passed (see EMULATOR_TESTING_CHECKLIST.md)
- [ ] Basic physical device test passed
- [ ] At least 2 optional tests passed
- [ ] Tested on both Android and iOS (if supporting both)
- [ ] Edge Function deployed to production
- [ ] Database migrations applied
- [ ] Secrets configured in production
- [ ] Monitoring/alerts configured
- [ ] Rollback plan documented

## 📝 Production Deployment Strategy

### Option 1: Gradual Rollout (Recommended)

**Day 1**: Enable for 10% of users
- Monitor closely for 24 hours
- Check error rates, delivery rates
- Gather user feedback

**Day 2**: Increase to 25%
- Continue monitoring
- Address any issues found

**Day 3**: Increase to 50%
- Monitor performance at scale
- Verify rate limiting works

**Day 4**: Increase to 100%
- Full rollout
- Continue monitoring for 48 hours

### Option 2: Feature Flag

Use a feature flag to control rollout:
```typescript
// In app config
const ENABLE_PUSH_NOTIFICATIONS = true; // Toggle this

// In FlashOfferCreationModal
if (ENABLE_PUSH_NOTIFICATIONS) {
  await FCMService.sendViaEdgeFunction(offerId);
} else {
  // Use simulated backend
}
```

### Option 3: Venue-by-Venue

Enable for specific venues first:
```sql
-- Add feature flag to venues table
ALTER TABLE venues ADD COLUMN push_enabled BOOLEAN DEFAULT false;

-- Enable for test venues
UPDATE venues SET push_enabled = true WHERE id IN ('venue1', 'venue2');
```

## 🔐 Security Checklist

Before production:
- [ ] Firebase service account JSON is in Supabase secrets (not in code)
- [ ] Supabase service role key is in secrets
- [ ] No credentials in git history
- [ ] RLS policies tested and working
- [ ] Edge Function validates JWT tokens
- [ ] Input validation in place

## 📊 Monitoring Checklist

After production deployment:
- [ ] Edge Function logs monitored
- [ ] Error rate < 5%
- [ ] Execution time < 10 seconds
- [ ] FCM success rate > 90%
- [ ] Rate limit violations tracked
- [ ] User complaints monitored

## 🎉 Success!

If all tests pass, congratulations! Your push notification system is production-ready.

**Key Achievements**:
- ✅ End-to-end flow validated
- ✅ Real FCM delivery confirmed
- ✅ User experience verified
- ✅ Error handling tested
- ✅ Performance validated

**Next Steps**:
1. Deploy to production
2. Monitor closely for 48 hours
3. Gather user feedback
4. Iterate and improve

---

**Tested By**: _______________  
**Date**: _______________  
**Devices Used**: _______________  
**Overall Status**: ☐ Pass  ☐ Fail  
**Ready for Production**: ☐ Yes  ☐ No  

**Notes**:
_____________________________________________________________________________
_____________________________________________________________________________
