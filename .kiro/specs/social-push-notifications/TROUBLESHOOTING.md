# Push Notifications Troubleshooting Guide

Comprehensive troubleshooting guide for common push notification issues.

**Requirements: 13.10**

## Quick Diagnosis

Use this flowchart to quickly identify your issue:

```
Can't get device token?
  └─> See: Token Issues

Notifications not received?
  └─> See: Delivery Issues

Navigation not working?
  └─> See: Navigation Issues

Foreground notifications not showing?
  └─> See: Foreground Issues

Permission problems?
  └─> See: Permission Issues
```

---

## Token Issues

### Problem: Cannot Get Device Token

**Symptoms:**
- `FCMService.getToken()` returns null
- "No FCM token available" in logs
- Cannot send notifications

**Diagnosis:**
```typescript
import { FCMService } from './services/FCMService';

// Check if FCM is initialized
await FCMService.initialize();

// Try to get token
const token = await FCMService.getToken();
console.log('Token:', token);
```

**Solutions:**

1. **Check Firebase Configuration**
   ```bash
   # Android
   ls android/app/google-services.json
   
   # iOS
   ls ios/alphaCharlie722/GoogleService-Info.plist
   ```
   - Ensure files exist and are in correct location
   - Verify files are from correct Firebase project
   - Check files are not corrupted

2. **Verify Firebase Project Setup**
   - Go to Firebase Console
   - Check iOS app is registered (Bundle ID matches)
   - Check Android app is registered (Package name matches)
   - Verify SHA-1 fingerprint added (Android)

3. **Check Internet Connection**
   - Device must have internet to get token
   - Try on different network
   - Check firewall settings

4. **iOS Specific: APNs Certificate**
   - Verify APNs certificate uploaded to Firebase
   - Check certificate is not expired
   - Ensure certificate matches Bundle ID

5. **Restart and Retry**
   ```typescript
   // Force reinitialize
   await FCMService.initialize();
   const token = await FCMService.getToken();
   ```

### Problem: Token Refresh Fails

**Symptoms:**
- Token becomes invalid
- "Expired token" errors
- Notifications stop working

**Diagnosis:**
```typescript
// Check if token refresh listener is set
FCMService.onTokenRefresh((newToken) => {
  console.log('Token refreshed:', newToken);
});
```

**Solutions:**

1. **Ensure Token Refresh Handler is Set**
   ```typescript
   // In App.tsx or main component
   useEffect(() => {
     FCMService.onTokenRefresh(async (newToken) => {
       // Store new token
       await PushNotificationService.registerDeviceToken(
         userId,
         newToken,
         Platform.OS
       );
     });
   }, [userId]);
   ```

2. **Check Token Storage**
   ```sql
   -- Verify token is stored
   SELECT * FROM device_tokens
   WHERE user_id = 'your-user-id'
   AND is_active = true;
   ```

3. **Manual Token Refresh**
   ```typescript
   // Get fresh token
   const newToken = await FCMService.getToken();
   
   // Store it
   await PushNotificationService.registerDeviceToken(
     userId,
     newToken,
     Platform.OS
   );
   ```

---

## Delivery Issues

### Problem: Notifications Not Received

**Symptoms:**
- Notifications sent but not received
- No errors in logs
- Firebase Console shows "Delivered" but device doesn't receive

**Diagnosis:**
```typescript
// Enable debug mode
await DebugLogger.enableDebugMode();

// Send test notification
await PushNotificationService.sendSocialNotification(
  userId,
  'friend_request',
  payload
);

// Check logs
const logs = DebugLogger.getLogs();
console.log('Logs:', logs);
```

**Solutions:**

1. **Check Notification Permissions**
   ```typescript
   import { PushPermissionService } from './services/PushPermissionService';
   
   const status = await PushPermissionService.checkPermissionStatus();
   console.log('Permission status:', status);
   
   if (status !== 'authorized') {
     await PushPermissionService.requestPermission();
   }
   ```

2. **Verify Device Token is Valid**
   ```typescript
   // Get user's tokens
   const tokens = await DeviceTokenManager.getUserTokens(userId);
   console.log('Active tokens:', tokens);
   
   // Test with Firebase Console
   // Use token to send test message
   ```

3. **Check User Preferences**
   ```typescript
   import { NotificationService } from './services/api/notifications';
   
   const prefs = await NotificationService.getNotificationPreferences(userId);
   console.log('Preferences:', prefs);
   
   // Ensure notification type is enabled
   ```

4. **Verify FCM Service is Running**
   - Check Firebase Console status
   - Try sending from Firebase Console directly
   - Test with different device

5. **Check Network Connection**
   - Device must have internet
   - Try on different network
   - Check firewall/proxy settings

### Problem: Notifications Delayed

**Symptoms:**
- Notifications arrive late
- Inconsistent delivery times
- Some notifications never arrive

**Diagnosis:**
```typescript
// Check delivery latency
const startTime = Date.now();

await PushNotificationService.sendSocialNotification(
  userId,
  'friend_request',
  payload
);

const endTime = Date.now();
console.log('Send time:', endTime - startTime, 'ms');
```

**Solutions:**

1. **Check Priority Setting**
   ```typescript
   // Ensure high priority for time-sensitive notifications
   const payload = {
     // ...
     android: {
       priority: 'high', // Use 'high' for immediate delivery
     },
   };
   ```

2. **Verify Device Power Settings**
   - Check battery optimization settings
   - Disable battery saver for app
   - Check background app restrictions

3. **Check FCM Rate Limits**
   - Review Firebase Console for rate limit errors
   - Implement exponential backoff
   - Batch notifications if sending many

4. **Network Issues**
   - Poor network connection causes delays
   - Try on different network
   - Check for network throttling

---

## Navigation Issues

### Problem: Navigation Not Working

**Symptoms:**
- Notification received but navigation fails
- App opens to wrong screen
- Navigation parameters missing

**Diagnosis:**
```typescript
// Test navigation directly
NotificationHandler.navigateFromNotification(
  'friend_request',
  { userId: 'test-123' }
);

// Check if navigation handler is set
if (!NotificationHandler.navigationHandler) {
  console.error('Navigation handler not set!');
}
```

**Solutions:**

1. **Ensure Navigation Handler is Set**
   ```typescript
   // In App.tsx or navigation setup
   import { NotificationHandler } from './services/NotificationHandler';
   
   useEffect(() => {
     NotificationHandler.setNavigationHandler((screen, params) => {
       navigation.navigate(screen, params);
     });
   }, [navigation]);
   ```

2. **Verify Notification Data**
   ```typescript
   // Check notification includes navigation data
   const payload = {
     data: {
       type: 'friend_request',
       navigationTarget: 'FriendRequests', // Required
       navigationParams: JSON.stringify({ userId: '123' }), // Optional
     },
   };
   ```

3. **Check Screen Names Match**
   ```typescript
   // Ensure navigationTarget matches actual screen name
   // In navigation setup:
   <Stack.Screen name="FriendRequests" component={FriendRequestsScreen} />
   
   // In notification:
   navigationTarget: 'FriendRequests' // Must match exactly
   ```

4. **Debug Navigation Flow**
   ```typescript
   // Enable debug logging
   await DebugLogger.enableDebugMode();
   
   // Tap notification
   // Check logs for navigation events
   const navLogs = DebugLogger.getLogsByCategory('NAVIGATION');
   console.log('Navigation logs:', navLogs);
   ```

### Problem: Wrong Screen Opens

**Symptoms:**
- Notification opens app but goes to wrong screen
- Navigation parameters incorrect
- Fallback screen used instead of target

**Solutions:**

1. **Verify Navigation Target**
   ```typescript
   // Check notification type maps to correct screen
   switch (type) {
     case 'friend_request':
       return 'FriendRequests'; // Correct screen name
     case 'venue_share':
       return 'VenueDetail'; // Correct screen name
   }
   ```

2. **Check Navigation Parameters**
   ```typescript
   // Ensure parameters are properly formatted
   const params = {
     venueId: 'venue-123', // Required for VenueDetail
     venueName: 'The Coffee Shop', // Optional
   };
   
   // In notification data:
   navigationParams: JSON.stringify(params)
   ```

3. **Review NotificationHandler Logic**
   - Check `navigateFromNotification` method
   - Verify all notification types handled
   - Ensure fallback logic is correct

---

## Foreground Issues

### Problem: Foreground Notifications Not Showing

**Symptoms:**
- Notifications work in background but not foreground
- No in-app banner
- Notifications received but not displayed

**Diagnosis:**
```typescript
// Check if foreground handler is registered
FCMService.onForegroundMessage((message) => {
  console.log('Foreground message:', message);
});
```

**Solutions:**

1. **Register Foreground Message Handler**
   ```typescript
   // In App.tsx or NotificationContext
   useEffect(() => {
     FCMService.onForegroundMessage((message) => {
       NotificationHandler.handleForegroundNotification(message);
     });
   }, []);
   ```

2. **Check NotificationContext**
   ```typescript
   // Ensure NotificationContext is properly initialized
   // and wraps your app
   <NotificationContext>
     <App />
   </NotificationContext>
   ```

3. **Verify In-App Banner Component**
   - Check banner component is rendered
   - Verify styling doesn't hide banner
   - Test banner with mock data

4. **Check Console Logs**
   ```typescript
   // Look for "Foreground notification received"
   // If missing, handler not registered
   ```

---

## Permission Issues

### Problem: Permission Denied

**Symptoms:**
- Cannot request notification permission
- Permission always denied
- "Permission denied" errors

**Diagnosis:**
```typescript
import { PushPermissionService } from './services/PushPermissionService';

const status = await PushPermissionService.checkPermissionStatus();
console.log('Permission status:', status);
```

**Solutions:**

1. **Check Device Settings**
   - Go to device Settings → Apps → Your App → Notifications
   - Ensure notifications are enabled
   - Check all notification categories enabled

2. **iOS: Check Info.plist**
   ```xml
   <!-- Ensure these keys are present -->
   <key>UIBackgroundModes</key>
   <array>
     <string>remote-notification</string>
   </array>
   ```

3. **Android: Check AndroidManifest.xml**
   ```xml
   <!-- Ensure these permissions are present -->
   <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
   <uses-permission android:name="android.permission.INTERNET" />
   ```

4. **Handle Permanently Denied**
   ```typescript
   const status = await PushPermissionService.checkPermissionStatus();
   
   if (status === 'denied') {
     // Show instructions to enable in settings
     Alert.alert(
       'Notifications Disabled',
       'Please enable notifications in Settings',
       [
         { text: 'Cancel' },
         { text: 'Open Settings', onPress: openSettings },
       ]
     );
   }
   ```

5. **Reset Permissions (Development)**
   - Uninstall app
   - Reinstall app
   - Permissions reset to default

---

## Platform-Specific Issues

### iOS Issues

**Problem: APNs Certificate Issues**

**Solutions:**
1. Verify certificate uploaded to Firebase Console
2. Check certificate not expired
3. Ensure certificate matches Bundle ID
4. Regenerate certificate if needed

**Problem: Provisional Authorization**

**Solutions:**
1. Check for provisional authorization status
2. Request full authorization if needed
3. Handle provisional state in UI

### Android Issues

**Problem: Notification Channels**

**Solutions:**
1. Verify notification channels created
2. Check channel importance level
3. Ensure channel ID matches in payload

**Problem: Battery Optimization**

**Solutions:**
1. Request battery optimization exemption
2. Guide user to disable battery saver
3. Handle background restrictions

---

## Debug Tools

### Enable Debug Mode

```typescript
import { DebugLogger } from './services/DebugLogger';

// Enable verbose logging
await DebugLogger.enableDebugMode();

// Trigger notification event
// ...

// View logs
const logs = DebugLogger.getLogs();
console.log('Debug logs:', logs);

// Export logs
const logsJson = DebugLogger.exportLogs();
```

### Use Debug Screens

1. **NotificationDebugScreen:**
   - Send test notifications
   - View delivery status
   - Test different notification types

2. **DebugLogsScreen:**
   - View all debug logs
   - Filter by level/category
   - Export logs for sharing

### Test with Firebase Console

1. Go to Firebase Console
2. Send test message to device token
3. Check delivery status
4. Review error messages

---

## Getting Help

### Before Asking for Help

1. **Enable Debug Mode**
   ```typescript
   await DebugLogger.enableDebugMode();
   ```

2. **Reproduce Issue**
   - Trigger the issue
   - Note exact steps

3. **Collect Information**
   - Export debug logs
   - Screenshot error messages
   - Note device/OS version
   - Note app version

4. **Check Documentation**
   - Review TESTING_GUIDE.md
   - Check FIREBASE_CONSOLE_GUIDE.md
   - Search for similar issues

### Information to Provide

When reporting an issue, include:

- **Device Information:**
  - Device model
  - OS version
  - App version

- **Issue Description:**
  - What you expected
  - What actually happened
  - Steps to reproduce

- **Debug Logs:**
  - Export from DebugLogsScreen
  - Include relevant console logs

- **Configuration:**
  - Firebase project ID
  - Platform (iOS/Android)
  - Notification type

- **Screenshots:**
  - Error messages
  - Debug screen results
  - Firebase Console status

---

## Prevention

### Best Practices

1. **Always Test Locally First**
   - Use debug screen before production
   - Test all notification types
   - Verify navigation works

2. **Enable Debug Mode During Development**
   - Catch issues early
   - Detailed error information
   - Track all events

3. **Test on Real Devices**
   - Emulators have limitations
   - Test both iOS and Android
   - Test different OS versions

4. **Monitor Production**
   - Track delivery rates
   - Monitor error rates
   - Set up alerts

5. **Keep Configuration Updated**
   - Update APNs certificates before expiry
   - Keep Firebase SDK updated
   - Review Firebase Console regularly

---

## Additional Resources

- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Comprehensive testing guide
- [FIREBASE_CONSOLE_GUIDE.md](./FIREBASE_CONSOLE_GUIDE.md) - Firebase Console reference
- [Firebase Documentation](https://firebase.google.com/docs/cloud-messaging)
- [React Native Firebase](https://rnfirebase.io/)
