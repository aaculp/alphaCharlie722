# Quick Start: Testing Push Notifications

## Overview

This guide will help you quickly test the push notification system. There are several ways to test depending on what you want to verify.

## 🚀 Quick Testing Options

### Option 1: Run Automated Tests (Fastest)

Test the code without needing a device:

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- src/utils/security/__tests__/PayloadValidator.test.ts
npm test -- src/services/__tests__/NotificationHandler.pbt.test.ts
npm test -- src/hooks/__tests__/useNotificationPreferences.pbt.test.tsx
```

**What this tests:**
- ✅ Payload validation
- ✅ Security utilities
- ✅ Notification handling logic
- ✅ Preference management
- ✅ Error handling

### Option 2: Use the Debug Screen (In-App Testing)

Test notifications within the app:

1. **Launch the app** on your device/emulator
2. **Navigate to Settings** → **Notification Debug**
3. **Use the test notification feature:**
   - Select notification type (friend request, venue share, etc.)
   - Enter test data
   - Send test notification
   - View delivery status and logs

**What this tests:**
- ✅ Token generation
- ✅ Permission handling
- ✅ Notification sending
- ✅ Delivery tracking
- ✅ Error logging

### Option 3: Firebase Console Testing (Real Notifications)

Send real push notifications from Firebase:

1. **Open Firebase Console:** https://console.firebase.google.com
2. **Select your project**
3. **Go to Cloud Messaging** → **Send test message**
4. **Enter:**
   - Notification title: "Test Notification"
   - Notification text: "This is a test"
   - Target: Your device FCM token (get from Debug Screen)
5. **Click Send**

**What this tests:**
- ✅ FCM integration
- ✅ Device token validity
- ✅ Notification reception
- ✅ App state handling (foreground/background/closed)
- ✅ Navigation from notifications

### Option 4: End-to-End Testing (Full Flow)

Test the complete notification flow:

1. **Set up two test accounts** (User A and User B)
2. **User A sends friend request to User B**
3. **Verify User B receives push notification**
4. **User B taps notification**
5. **Verify app opens to friend requests screen**
6. **User B accepts request**
7. **Verify User A receives acceptance notification**

**What this tests:**
- ✅ Complete notification flow
- ✅ Social event triggers
- ✅ Push delivery
- ✅ Navigation
- ✅ User preferences
- ✅ Cross-device sync

## 📱 Device Setup (Required for Options 2-4)

### iOS Setup

1. **Physical device required** (push notifications don't work on iOS simulator)
2. **Enable notifications:**
   - Settings → [Your App] → Notifications → Allow Notifications
3. **Check permission in app:**
   - Open app → Settings → Push Notifications → Enable

### Android Setup

1. **Emulator or physical device** (both work)
2. **Enable notifications:**
   - Settings → Apps → [Your App] → Notifications → Allow
3. **Check permission in app:**
   - Open app → Settings → Push Notifications → Enable

## 🧪 Testing Checklist

### Basic Functionality
- [ ] App requests notification permission on first launch
- [ ] Device token is generated and stored
- [ ] Settings toggle enables/disables notifications
- [ ] Test notification sends successfully
- [ ] Notification appears in device tray

### Notification Types
- [ ] Friend request notification works
- [ ] Friend accepted notification works
- [ ] Venue share notification works

### App States
- [ ] Foreground: Notification displays in-app banner
- [ ] Background: Notification appears in tray
- [ ] Closed: Notification appears in tray

### Navigation
- [ ] Tapping friend request notification opens friend requests screen
- [ ] Tapping friend accepted notification opens user profile
- [ ] Tapping venue share notification opens venue detail

### Preferences
- [ ] Disabling notification type prevents push (but keeps in-app)
- [ ] Preferences sync across devices
- [ ] Changes take effect immediately

### Error Handling
- [ ] Invalid tokens are handled gracefully
- [ ] Network errors retry automatically
- [ ] Permission denial shows helpful message

## 🔍 Debugging Tools

### 1. Debug Logs Screen

Access comprehensive logs:
- **Location:** Settings → Debug Logs
- **Shows:**
  - FCM events
  - Token operations
  - Notification sends
  - Navigation events
  - Errors

### 2. Notification Debug Screen

Test notifications manually:
- **Location:** Settings → Notification Debug
- **Features:**
  - Send test notifications
  - View device token
  - Check permission status
  - View delivery status
  - Export logs

### 3. Console Logs

Monitor real-time logs:

```bash
# iOS
npx react-native log-ios

# Android
npx react-native log-android
```

**Look for:**
- `📤 Sending notification...`
- `✅ Notification sent successfully`
- `🔔 Notification received`
- `📱 Navigating to...`

## 🐛 Common Issues & Solutions

### Issue: "No device token"

**Solution:**
1. Check Firebase configuration (google-services.json / GoogleService-Info.plist)
2. Verify app has notification permission
3. Restart app
4. Check Debug Logs for errors

### Issue: "Notifications not appearing"

**Solution:**
1. Check device notification settings
2. Verify notification permission in app
3. Check user preferences (Settings → Notifications)
4. Try sending test notification from Firebase Console
5. Check Debug Logs for delivery errors

### Issue: "Navigation not working"

**Solution:**
1. Verify notification payload includes navigationTarget
2. Check Debug Logs for navigation events
3. Ensure app is properly initialized
4. Test with different app states (foreground/background/closed)

### Issue: "Permission denied"

**Solution:**
1. Go to device Settings → [Your App] → Notifications
2. Enable notifications
3. Restart app
4. Request permission again in app

## 📊 Test Results Interpretation

### Automated Tests

```bash
Test Suites: 42 passed, 42 total
Tests:       345 passed, 345 total
```

**Good:** All core functionality tests passing

```bash
Test Suites: 1 failed, 41 passed, 42 total
Tests:       3 failed, 342 passed, 345 total
```

**Acceptable:** Optional property-based tests may fail on edge cases

### Manual Testing

**Success Indicators:**
- ✅ Notification appears within 5 seconds
- ✅ Notification has correct title and body
- ✅ Tapping notification opens correct screen
- ✅ In-app notification marked as read
- ✅ No errors in Debug Logs

**Failure Indicators:**
- ❌ Notification takes >10 seconds
- ❌ Notification doesn't appear
- ❌ Navigation goes to wrong screen
- ❌ Errors in Debug Logs

## 📚 Detailed Testing Guides

For more comprehensive testing:

1. **TESTING_GUIDE.md** - Complete testing procedures
2. **FIREBASE_CONSOLE_GUIDE.md** - Using Firebase for testing
3. **INTEGRATION_TESTS.md** - End-to-end test scenarios
4. **TROUBLESHOOTING.md** - Common issues and solutions

## 🎯 Recommended Testing Flow

### For Developers (First Time)

1. **Run automated tests** (5 minutes)
   ```bash
   npm test
   ```

2. **Test in app with Debug Screen** (10 minutes)
   - Send test notifications
   - Verify delivery
   - Check logs

3. **Test with Firebase Console** (5 minutes)
   - Send real push notification
   - Verify reception
   - Test navigation

4. **Test end-to-end flow** (15 minutes)
   - Create test accounts
   - Trigger social events
   - Verify notifications

**Total time:** ~35 minutes for complete testing

### For QA Testing

1. **Run test checklist** (30 minutes)
   - Test all notification types
   - Test all app states
   - Test navigation
   - Test preferences

2. **Test on multiple devices** (20 minutes)
   - iOS device
   - Android device
   - Different OS versions

3. **Test edge cases** (20 minutes)
   - Poor network conditions
   - Permission denial
   - Multiple notifications
   - Rapid notification sends

**Total time:** ~70 minutes for thorough QA

### For Production Verification

1. **Smoke test** (10 minutes)
   - Send test notification
   - Verify delivery
   - Check navigation
   - Review logs

2. **Monitor metrics** (ongoing)
   - Delivery success rate
   - Latency
   - Error rate
   - User engagement

## 🚨 Before Production

**Critical Tests:**
- [ ] Test on real iOS device (not simulator)
- [ ] Test on Android device/emulator
- [ ] Test with production Firebase project
- [ ] Test with production APNs certificate
- [ ] Verify encryption key is configured
- [ ] Test with multiple users
- [ ] Monitor delivery metrics
- [ ] Review error logs

## 💡 Pro Tips

1. **Use Debug Screen** for quick iteration during development
2. **Use Firebase Console** to test without triggering social events
3. **Check Debug Logs** first when troubleshooting
4. **Test on real devices** for iOS (simulator doesn't support push)
5. **Test different app states** (foreground, background, closed)
6. **Monitor metrics** in production to catch issues early

## 📞 Need Help?

- **Testing Guide:** `.kiro/specs/social-push-notifications/TESTING_GUIDE.md`
- **Troubleshooting:** `.kiro/specs/social-push-notifications/TROUBLESHOOTING.md`
- **FAQ:** `.kiro/specs/social-push-notifications/FAQ.md`
- **API Docs:** `.kiro/specs/social-push-notifications/API_DOCUMENTATION.md`

---

**Quick Start Complete!** You're now ready to test push notifications. Start with Option 1 (automated tests) and progress to Option 4 (end-to-end) as needed.
