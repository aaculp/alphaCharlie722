# Push Notification Testing Guide

## Overview

This guide explains how to test the push notification system implemented in the OTW app. The system uses Firebase Cloud Messaging (FCM) to deliver real-time notifications for social events like friend requests, venue shares, and activity updates.

## Prerequisites

### 1. Firebase Project Setup

You need a Firebase project with FCM enabled:

1. **Create/Access Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use existing one
   - Enable Cloud Messaging in the project

2. **Download Configuration Files**
   - **Android**: Download `google-services.json` from Firebase Console
     - Place it at: `android/app/google-services.json`
   - **iOS**: Download `GoogleService-Info.plist` from Firebase Console
     - Place it at: `ios/alphaCharlie722/GoogleService-Info.plist`

### 2. iOS APNs Setup (Mac Required)

For iOS push notifications, you need Apple Push Notification service (APNs) configured:

1. **Create APNs Key**
   - Go to [Apple Developer Portal](https://developer.apple.com/account/)
   - Navigate to Certificates, Identifiers & Profiles → Keys
   - Create a new key with APNs enabled
   - Download the `.p8` file (only available once!)
   - Note the Key ID and Team ID

2. **Upload to Firebase**
   - Firebase Console → Project Settings → Cloud Messaging
   - Upload the `.p8` file under "APNs Authentication Key"
   - Enter Key ID and Team ID

### 3. Device Requirements

**Android:**
- ✅ **Emulator works!** Use an emulator with Google Play Services
  - In Android Studio, create a device with "Play Store" icon
  - Sign in with a Google account on the emulator
  - Push notifications will work just like a physical device
- ✅ Physical Android device also works

**iOS:**
- ❌ **Simulator does NOT work** - iOS simulators don't support APNs
- ✅ **Physical iPhone/iPad required** for iOS testing

### 4. Database Setup

Ensure your Supabase database has the required tables:
- `device_tokens` - Stores FCM tokens for each user's devices
- `social_notifications` - Stores in-app notifications
- `notification_preferences` - User notification settings

## Testing Setup

### Step 1: Install Dependencies

```bash
# Install npm packages
npm install

# iOS only (Mac required)
cd ios
pod install
cd ..
```

### Step 2: Build and Run on Device/Emulator

**Android (Emulator or Physical Device):**
```bash
# For emulator: Start an emulator with Google Play Services
# In Android Studio: Tools → Device Manager → Start emulator with Play Store

# Or connect physical Android device via USB and enable USB debugging

npx react-native run-android
```

**iOS (Physical Device Only - Mac required):**
```bash
# Connect iPhone via USB
# Trust the computer on device
npx react-native run-ios --device
```

**Note:** iOS simulators do not support push notifications. Use a physical iPhone/iPad for iOS testing.

### Step 3: Grant Notification Permissions

When the app launches:
1. You'll see a permission dialog asking to allow notifications
2. Tap "Allow" to enable push notifications
3. The app will register your device token with Firebase

### Step 4: Verify Device Token Registration

Check the console logs for:
```
📝 Registering device token for user: [user-id]
✅ Device token registered successfully
```

You can also check the `device_tokens` table in Supabase to verify the token was stored.

## Testing Methods

### Method 1: Test via App Actions (Recommended)

This tests the full end-to-end flow:

#### Test Friend Request Notification

1. **Setup**: Have two test accounts (User A and User B)
2. **Action**: User A sends friend request to User B
3. **Expected**: User B receives push notification:
   - Title: "New Friend Request"
   - Body: "[User A name] wants to be friends"
   - Tap opens friend requests screen

#### Test Friend Accepted Notification

1. **Setup**: User B has pending friend request from User A
2. **Action**: User B accepts the friend request
3. **Expected**: User A receives push notification:
   - Title: "Friend Request Accepted"
   - Body: "[User B name] accepted your friend request"
   - Tap opens friends list

#### Test Venue Share Notification

1. **Setup**: User A and User B are friends
2. **Action**: User A shares a venue with User B
3. **Expected**: User B receives push notification:
   - Title: "Venue Shared"
   - Body: "[User A name] shared [Venue Name] with you"
   - Tap opens venue detail screen

#### Test Flash Offer Notification

1. **Setup**: Venue owner creates a flash offer
2. **Action**: Flash offer is published with push notification enabled
3. **Expected**: Nearby users receive push notification:
   - Title: "[Venue Name] - Flash Offer!"
   - Body: Offer description
   - Tap opens flash offer detail screen

### Method 2: Test via Firebase Console

Send test notifications directly from Firebase:

1. **Open Firebase Console**
   - Go to Cloud Messaging → Send test message

2. **Configure Test Message**
   - **Title**: "Test Notification"
   - **Body**: "This is a test push notification"
   - **Target**: Add your device's FCM token
     - Get token from app logs or `device_tokens` table

3. **Send**
   - Click "Test" to send
   - Notification should appear on device

### Method 3: Test via Supabase Function (Advanced)

Create a test function to trigger notifications:

```typescript
// In Supabase SQL Editor or via API
-- Get a user's device tokens
SELECT * FROM device_tokens WHERE user_id = '[test-user-id]';

-- Manually trigger a notification via your API
-- Call PushNotificationService.sendSocialNotification() with test data
```

## Testing Scenarios

### 1. Basic Delivery Test

**Goal**: Verify notifications are delivered

- [ ] Send notification to single device
- [ ] Verify notification appears in system tray
- [ ] Verify notification sound plays
- [ ] Verify notification badge appears on app icon

### 2. Multiple Device Test

**Goal**: Verify notifications reach all user's devices

- [ ] Login on multiple devices (e.g., phone + tablet)
- [ ] Trigger notification
- [ ] Verify notification appears on all devices

### 3. Foreground vs Background Test

**Goal**: Verify notifications work in different app states

- [ ] **Foreground**: App is open and active
  - Notification should appear as in-app banner
- [ ] **Background**: App is in background
  - Notification should appear in system tray
- [ ] **Killed**: App is completely closed
  - Notification should appear in system tray
  - Tapping should launch app

### 4. Navigation Test

**Goal**: Verify tapping notification navigates correctly

- [ ] Receive friend request notification
- [ ] Tap notification
- [ ] Verify app opens to friend requests screen
- [ ] Repeat for other notification types

### 5. User Preferences Test

**Goal**: Verify notification preferences are respected

- [ ] Go to Settings → Notification Preferences
- [ ] Disable "Friend Requests" notifications
- [ ] Have someone send you a friend request
- [ ] Verify NO push notification is sent
- [ ] Verify in-app notification still appears
- [ ] Re-enable and verify notifications work again

### 6. Rate Limiting Test

**Goal**: Verify rate limiting prevents spam

- [ ] Trigger multiple notifications rapidly (>10 in 1 minute)
- [ ] Verify rate limiting kicks in
- [ ] Check logs for "Rate limit exceeded" message

### 7. Compliance Test

**Goal**: Verify compliance checks work

- [ ] Test with very long notification text (>500 chars)
- [ ] Verify notification is rejected
- [ ] Test with special characters in payload
- [ ] Verify payload validation works

### 8. Error Handling Test

**Goal**: Verify graceful error handling

- [ ] Remove device token from database
- [ ] Trigger notification
- [ ] Verify app handles "no device tokens" gracefully
- [ ] Re-register device and verify recovery

## Debugging

### Check Device Token

```typescript
// In your app, add this to see your device token:
import { FCMService } from './src/services/FCMService';

const token = await FCMService.getToken();
console.log('My FCM Token:', token);
```

### Check Notification Logs

Look for these log messages:

**Success:**
```
📤 Sending friend_request notification to user: [user-id]
✅ Push notification sent: 1 success, 0 failed (234ms)
```

**User Preference Disabled:**
```
⚠️ User has disabled friend_request notifications
```

**No Device Tokens:**
```
⚠️ No active device tokens found for user
```

**Rate Limited:**
```
⚠️ Rate limit exceeded for user: [reason]
```

**Error:**
```
❌ Error sending push notification: [error message]
```

### Common Issues

#### Issue: "No device token registered"

**Solution:**
1. Check if permission was granted
2. Verify Firebase configuration files are in place
3. Check console logs for registration errors
4. Try uninstalling and reinstalling app

#### Issue: "Notifications not appearing"

**Solution:**
1. Verify device has internet connection
2. Check notification permissions in device settings
3. Verify Firebase project has FCM enabled
4. Check if user disabled that notification type in preferences

#### Issue: "iOS notifications not working"

**Solution:**
1. Verify APNs key is uploaded to Firebase
2. Check that app is signed with correct provisioning profile
3. Verify bundle ID matches Firebase configuration
4. Test on physical device (not simulator)

#### Issue: "Android notifications not working"

**Solution:**
1. Verify `google-services.json` is in `android/app/`
2. Check that Google Play Services is installed on device
3. Verify notification channels are created (check logs)
4. Test on physical device with Play Services

## Performance Monitoring

### Check Delivery Metrics

The system tracks:
- **Delivery latency**: Time from trigger to FCM send
- **Success rate**: Percentage of successful deliveries
- **Error rate**: Percentage of failed deliveries

Check logs for performance data:
```
✅ Push notification sent: 1 success, 0 failed (234ms)
```

### Check Rate Limiting

Rate limits:
- **10 notifications per minute** per user
- **100 notifications per hour** per user

Check logs for rate limit warnings:
```
⚠️ Rate limit exceeded for user: Too many requests (10 in 60s)
```

## Test Checklist

Use this checklist to verify all functionality:

### Basic Functionality
- [ ] Device token registration works
- [ ] Notifications are delivered
- [ ] Notification sound plays
- [ ] Notification badge appears
- [ ] Tapping notification opens app

### Notification Types
- [ ] Friend request notifications work
- [ ] Friend accepted notifications work
- [ ] Venue share notifications work
- [ ] Flash offer notifications work
- [ ] Activity notifications work

### User Preferences
- [ ] Can enable/disable notification types
- [ ] Disabled types don't send push
- [ ] Disabled types still show in-app
- [ ] Preferences persist across app restarts

### Multi-Device
- [ ] Notifications reach all devices
- [ ] Token cleanup removes old tokens
- [ ] Multiple devices can be registered

### Error Handling
- [ ] Gracefully handles no device tokens
- [ ] Gracefully handles FCM errors
- [ ] Gracefully handles network errors
- [ ] Rate limiting prevents spam

### Platform-Specific
- [ ] iOS notifications work (APNs)
- [ ] Android notifications work (FCM)
- [ ] Notification grouping works
- [ ] Custom sounds work (if configured)

## Next Steps

After testing:

1. **Monitor Production**
   - Set up Firebase Analytics to track notification metrics
   - Monitor error rates and delivery latency
   - Track user engagement with notifications

2. **Optimize**
   - Adjust rate limits based on usage patterns
   - Fine-tune notification text for engagement
   - Add more notification types as needed

3. **User Feedback**
   - Collect feedback on notification frequency
   - Adjust default preferences based on feedback
   - Add more granular preference controls if needed

## Resources

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [React Native Firebase Docs](https://rnfirebase.io/)
- [APNs Documentation](https://developer.apple.com/documentation/usernotifications)
- [Android Notification Channels](https://developer.android.com/develop/ui/views/notifications/channels)
