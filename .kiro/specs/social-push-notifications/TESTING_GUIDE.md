# Push Notifications Testing Guide

This guide provides comprehensive instructions for testing push notifications during development and debugging.

**Requirements: 13.10**

## Table of Contents

1. [Testing Tools](#testing-tools)
2. [Local Testing](#local-testing)
3. [Firebase Console Testing](#firebase-console-testing)
4. [Testing Different App States](#testing-different-app-states)
5. [Debug Mode](#debug-mode)
6. [Common Issues and Solutions](#common-issues-and-solutions)
7. [Automated Testing](#automated-testing)

---

## Testing Tools

### 1. Notification Debug Screen

The app includes a built-in debug screen for sending test notifications.

**Location:** `NotificationDebugScreen`

**Features:**
- Send test notifications to specific device tokens
- Test different notification types
- Customize notification content
- View delivery status and errors
- Log all test notification sends

**How to Access:**
1. Navigate to the debug screen in your app
2. Select or enter a device token
3. Choose notification type
4. Customize title and body
5. Tap "Send Test Notification"

### 2. Debug Logs Screen

View and manage verbose debug logs for all push notification events.

**Location:** `DebugLogsScreen`

**Features:**
- Enable/disable debug mode
- Filter logs by level (DEBUG, INFO, WARN, ERROR)
- Filter logs by category (FCM, TOKEN, NAVIGATION, etc.)
- Export logs for sharing
- Clear logs

**How to Access:**
1. Navigate to the debug logs screen
2. Enable debug mode
3. Trigger notification events
4. View detailed logs

### 3. Notification Test Helper

Programmatic testing utilities for automated tests.

**Location:** `src/services/__tests__/NotificationTestHelper.ts`

**Usage:**
```typescript
import { NotificationTestHelper } from './NotificationTestHelper';

// Test foreground notification
NotificationTestHelper.testForegroundNotification({
  type: 'friend_request',
  title: 'New Friend Request',
  body: 'John sent you a friend request',
  navigationTarget: 'FriendRequests',
});

// Test background notification
await NotificationTestHelper.testBackgroundNotification({
  type: 'venue_share',
  title: 'Venue Shared',
  body: 'Jane shared a venue with you',
  navigationTarget: 'VenueDetail',
  navigationParams: { venueId: 'venue-123' },
});

// Run comprehensive tests
await NotificationTestHelper.runComprehensiveTests();
```

---

## Local Testing

### Prerequisites

1. **Firebase Project Setup:**
   - Create a Firebase project
   - Add iOS and Android apps
   - Download configuration files:
     - `google-services.json` (Android)
     - `GoogleService-Info.plist` (iOS)

2. **APNs Certificate (iOS only):**
   - Create APNs certificate in Apple Developer Portal
   - Upload to Firebase Console

3. **Device or Emulator:**
   - Physical device recommended for full testing
   - Emulators have limitations with push notifications

### Step-by-Step Local Testing

#### 1. Get Device Token

```typescript
import { FCMService } from './services/FCMService';

// Initialize FCM
await FCMService.initialize();

// Get device token
const token = await FCMService.getToken();
console.log('Device Token:', token);
```

#### 2. Send Test Notification via Debug Screen

1. Open `NotificationDebugScreen`
2. Your device token should appear automatically
3. Select notification type (e.g., "friend_request")
4. Customize title and body
5. Tap "Send Test Notification"
6. Check delivery status in results section

#### 3. Verify Notification Receipt

**Foreground:**
- Notification should appear as in-app banner
- Check console logs for handling

**Background:**
- Notification should appear in system tray
- Tap to open app and navigate

**Closed:**
- Notification should appear in system tray
- Tap to launch app and navigate

---

## Firebase Console Testing

The Firebase Console provides a web interface for sending test notifications.

### Step 1: Access Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Cloud Messaging** in the left sidebar
4. Click **Send your first message** or **New notification**

### Step 2: Compose Notification

**Notification Title:**
```
New Friend Request
```

**Notification Text:**
```
John Doe sent you a friend request
```

**Notification Image (optional):**
```
https://example.com/avatar.jpg
```

### Step 3: Target Devices

**Option 1: Test on Device**
- Select "Send test message"
- Enter your FCM device token
- Click "Test"

**Option 2: Target User Segment**
- Select "User segment"
- Choose targeting criteria
- Click "Next"

### Step 4: Add Custom Data

Click **Additional options** and add custom data:

```json
{
  "type": "friend_request",
  "actorId": "user-123",
  "navigationTarget": "FriendRequests"
}
```

### Step 5: Send Notification

1. Review notification details
2. Click **Review** then **Publish**
3. Check device for notification

### Firebase Console Testing Tips

- **Use Test Messages:** Always use "Send test message" during development
- **Save Templates:** Save frequently used notification templates
- **Check Analytics:** View delivery and open rates in Firebase Analytics
- **Test Different Platforms:** Send to both iOS and Android devices

---

## Testing Different App States

### Foreground Testing

**Scenario:** App is open and active

**Steps:**
1. Open the app
2. Navigate to any screen
3. Send test notification via debug screen or Firebase Console
4. Verify in-app banner appears
5. Check console logs for "Foreground notification received"

**Expected Behavior:**
- In-app notification banner displays
- Notification sound plays (if enabled)
- Badge count updates
- No system tray notification

### Background Testing

**Scenario:** App is open but not active (home screen, another app)

**Steps:**
1. Open the app
2. Press home button or switch to another app
3. Send test notification
4. Check system notification tray
5. Tap notification
6. Verify app opens and navigates correctly

**Expected Behavior:**
- Notification appears in system tray
- Notification sound plays
- Badge count updates
- Tapping opens app and navigates to correct screen

### Closed Testing

**Scenario:** App is completely closed (not running)

**Steps:**
1. Force close the app (swipe away from app switcher)
2. Send test notification
3. Check system notification tray
4. Tap notification
5. Verify app launches and navigates correctly

**Expected Behavior:**
- Notification appears in system tray
- Notification sound plays
- Badge count updates
- Tapping launches app and navigates to correct screen

### Testing Checklist

- [ ] Foreground: In-app banner displays
- [ ] Foreground: Sound plays (if enabled)
- [ ] Background: System tray notification appears
- [ ] Background: Tap opens app
- [ ] Background: Navigation works correctly
- [ ] Closed: System tray notification appears
- [ ] Closed: Tap launches app
- [ ] Closed: Navigation works correctly
- [ ] All states: Badge count updates
- [ ] All states: In-app notification created in database

---

## Debug Mode

### Enabling Debug Mode

**Via Debug Logs Screen:**
1. Open `DebugLogsScreen`
2. Toggle "Debug Mode" switch
3. All push notification events will be logged

**Programmatically:**
```typescript
import { DebugLogger } from './services/DebugLogger';

// Enable debug mode
await DebugLogger.enableDebugMode();

// Disable debug mode
await DebugLogger.disableDebugMode();

// Check if enabled
const isEnabled = DebugLogger.isEnabled();
```

### What Gets Logged

When debug mode is enabled, the following events are logged:

**FCM Events:**
- FCM initialization
- Token generation
- Token refresh
- Notification sends
- Delivery results

**Token Operations:**
- Token storage
- Token updates
- Token removal
- Token deactivation

**Notification Events:**
- Notification sends
- Preference checks
- Delivery attempts
- Delivery failures

**Navigation Events:**
- Notification taps
- Screen navigation
- Navigation parameters

### Viewing Debug Logs

1. Open `DebugLogsScreen`
2. Enable debug mode
3. Trigger notification events
4. View logs in real-time
5. Filter by level or category
6. Export logs for sharing

### Exporting Logs

1. Open `DebugLogsScreen`
2. Tap "Export" button
3. Choose sharing method (email, messages, etc.)
4. Logs exported as JSON

---

## Common Issues and Solutions

### Issue 1: No Device Token

**Symptoms:**
- `getToken()` returns null
- Cannot send notifications

**Solutions:**
1. Check Firebase configuration files are present
2. Verify Firebase project is set up correctly
3. Check internet connection
4. For iOS: Verify APNs certificate is uploaded
5. For Android: Verify google-services.json is correct
6. Restart app and try again

### Issue 2: Notifications Not Received

**Symptoms:**
- Notifications sent but not received
- No errors in logs

**Solutions:**
1. Check notification permissions are granted
2. Verify device token is valid and active
3. Check user preferences (notifications may be disabled)
4. Verify FCM service is running
5. Check Firebase Console for delivery status
6. Test with Firebase Console test message

### Issue 3: Navigation Not Working

**Symptoms:**
- Notification received but navigation fails
- App opens to wrong screen

**Solutions:**
1. Check navigation handler is set
2. Verify notification data includes correct navigation target
3. Check navigation parameters are valid
4. Review debug logs for navigation events
5. Test navigation directly with `NotificationHandler.navigateFromNotification()`

### Issue 4: Foreground Notifications Not Showing

**Symptoms:**
- Notifications work in background but not foreground
- No in-app banner

**Solutions:**
1. Check foreground message handler is registered
2. Verify `NotificationContext` is properly initialized
3. Check console logs for "Foreground notification received"
4. Ensure notification center UI is working

### Issue 5: Invalid Token Errors

**Symptoms:**
- "Invalid token" or "Expired token" errors
- Notifications fail to send

**Solutions:**
1. Token may have expired - request new token
2. Token may be from different Firebase project
3. Check token is stored correctly in database
4. Verify token format is correct (no extra spaces/characters)
5. Test with Firebase Console to verify token

### Issue 6: Permission Denied

**Symptoms:**
- Cannot request notification permission
- Permission always denied

**Solutions:**
1. Check device settings - notifications may be disabled
2. For iOS: Check Info.plist has notification permissions
3. For Android: Check AndroidManifest.xml has permissions
4. User may have permanently denied - show settings link
5. Uninstall and reinstall app to reset permissions

### Debugging Tips

1. **Enable Debug Mode:** Always enable debug mode when troubleshooting
2. **Check Console Logs:** Look for error messages and warnings
3. **Test with Firebase Console:** Verify Firebase setup is correct
4. **Test on Physical Device:** Emulators have limitations
5. **Check Network:** Ensure device has internet connection
6. **Verify Configuration:** Double-check Firebase config files
7. **Review Debug Logs:** Export and review detailed logs
8. **Test Different States:** Test foreground, background, and closed
9. **Check Preferences:** Verify user hasn't disabled notifications
10. **Use Test Helper:** Run comprehensive tests with `NotificationTestHelper`

---

## Automated Testing

### Unit Tests

Run unit tests for notification handling:

```bash
npm test -- NotificationHandler
```

### App State Tests

Run tests for different app states:

```bash
npm test -- NotificationHandler.appStates.test
```

### Property-Based Tests

Run property-based tests:

```bash
npm test -- NotificationHandler.pbt.test
```

### Integration Tests

Run full integration tests:

```bash
npm test -- notifications.integration.test
```

### Test Coverage

Check test coverage:

```bash
npm test -- --coverage
```

### Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Release builds

---

## Best Practices

### Development

1. **Always Test Locally First:** Use debug screen before Firebase Console
2. **Enable Debug Mode:** Turn on verbose logging during development
3. **Test All States:** Verify foreground, background, and closed states
4. **Check Logs:** Review debug logs after each test
5. **Use Test Helper:** Leverage automated test utilities

### Testing

1. **Test on Real Devices:** Emulators have limitations
2. **Test Both Platforms:** iOS and Android behave differently
3. **Test Different Notification Types:** Verify all social notification types
4. **Test Navigation:** Ensure all navigation targets work correctly
5. **Test Error Cases:** Verify error handling works properly

### Production

1. **Disable Debug Mode:** Turn off verbose logging in production
2. **Monitor Delivery Rates:** Track notification delivery success
3. **Monitor Error Rates:** Watch for spikes in errors
4. **Respect User Preferences:** Always check before sending
5. **Handle Failures Gracefully:** Don't crash on notification errors

---

## Additional Resources

### Documentation

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [React Native Firebase Docs](https://rnfirebase.io/)
- [APNs Documentation](https://developer.apple.com/documentation/usernotifications)

### Tools

- [Firebase Console](https://console.firebase.google.com/)
- [Apple Developer Portal](https://developer.apple.com/)
- [Android Studio](https://developer.android.com/studio)

### Support

- Check debug logs for detailed error information
- Review Firebase Console for delivery status
- Contact development team for assistance

---

## Conclusion

This guide covers all aspects of testing push notifications. Follow these procedures to ensure reliable notification delivery and proper handling in all app states.

For questions or issues, refer to the Common Issues section or contact the development team.
