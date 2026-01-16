# Firebase Console Testing Quick Reference

Quick reference guide for testing push notifications using the Firebase Console.

**Requirements: 13.10**

## Quick Start

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Cloud Messaging** in left sidebar
4. Click **Send your first message** or **New notification**

---

## Sending Test Notifications

### Method 1: Test Message (Recommended for Development)

**Best for:** Testing specific devices during development

**Steps:**
1. Click **Send test message**
2. Enter FCM device token
3. Click **Test**

**Advantages:**
- Fast and simple
- No analytics tracking
- Perfect for development
- Can test multiple tokens at once

### Method 2: Campaign Message

**Best for:** Testing production-like scenarios

**Steps:**
1. Fill in notification details
2. Select target (user segment or topic)
3. Add custom data (optional)
4. Schedule or send immediately

**Advantages:**
- Full feature set
- Analytics tracking
- Production-like testing
- Can target user segments

---

## Notification Composition

### Basic Fields

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

### Custom Data

Click **Additional options** → **Custom data**

Add key-value pairs for navigation:

| Key | Value | Description |
|-----|-------|-------------|
| `type` | `friend_request` | Notification type |
| `actorId` | `user-123` | User who triggered notification |
| `navigationTarget` | `FriendRequests` | Screen to navigate to |
| `referenceId` | `notif-456` | In-app notification ID |

### Platform-Specific Options

**iOS (APNs):**
- Sound: `default` or custom sound file
- Badge: Number to display on app icon
- Thread ID: For notification grouping

**Android (FCM):**
- Channel ID: `social_notifications`
- Priority: `high` or `default`
- Sound: `default` or custom sound file
- Tag: For notification grouping

---

## Testing Different Notification Types

### Friend Request

```json
{
  "notification": {
    "title": "New Friend Request",
    "body": "John Doe sent you a friend request"
  },
  "data": {
    "type": "friend_request",
    "actorId": "user-123",
    "navigationTarget": "FriendRequests"
  }
}
```

### Friend Accepted

```json
{
  "notification": {
    "title": "Friend Request Accepted",
    "body": "Jane Smith accepted your friend request"
  },
  "data": {
    "type": "friend_accepted",
    "actorId": "user-456",
    "navigationTarget": "Profile",
    "navigationParams": "{\"userId\":\"user-456\"}"
  }
}
```

### Venue Share

```json
{
  "notification": {
    "title": "Venue Shared",
    "body": "Mike Johnson shared The Coffee Shop with you"
  },
  "data": {
    "type": "venue_share",
    "actorId": "user-789",
    "navigationTarget": "VenueDetail",
    "navigationParams": "{\"venueId\":\"venue-123\",\"venueName\":\"The Coffee Shop\"}"
  }
}
```

### Collection Follow

```json
{
  "notification": {
    "title": "New Follower",
    "body": "Sarah Williams followed your collection"
  },
  "data": {
    "type": "collection_follow",
    "actorId": "user-101",
    "navigationTarget": "CollectionDetail",
    "navigationParams": "{\"collectionId\":\"collection-202\"}"
  }
}
```

### Activity Like

```json
{
  "notification": {
    "title": "Activity Liked",
    "body": "Tom Brown liked your activity"
  },
  "data": {
    "type": "activity_like",
    "actorId": "user-303",
    "navigationTarget": "ActivityDetail",
    "navigationParams": "{\"activityId\":\"activity-404\"}"
  }
}
```

---

## Getting Device Tokens

### From App Logs

1. Run app in development mode
2. Check console logs for "FCM token retrieved"
3. Copy token from logs

### From Debug Screen

1. Open `NotificationDebugScreen` in app
2. Device tokens listed under "Your Devices"
3. Copy token (first 30 characters shown)

### From Database

Query `device_tokens` table:

```sql
SELECT token, platform, is_active
FROM device_tokens
WHERE user_id = 'your-user-id'
AND is_active = true;
```

---

## Testing Checklist

### Before Sending

- [ ] Firebase project configured correctly
- [ ] APNs certificate uploaded (iOS)
- [ ] google-services.json added (Android)
- [ ] Device token obtained
- [ ] Notification permissions granted on device

### After Sending

- [ ] Check Firebase Console for delivery status
- [ ] Verify notification appears on device
- [ ] Test notification tap navigation
- [ ] Check in-app notification created
- [ ] Review debug logs for errors

---

## Common Firebase Console Issues

### Issue: "Invalid Token"

**Cause:** Token is expired, invalid, or from different project

**Solution:**
1. Get fresh token from device
2. Verify token is from correct Firebase project
3. Check token has no extra spaces or characters

### Issue: "Notification Not Delivered"

**Cause:** Device offline, permissions denied, or FCM service issue

**Solution:**
1. Check device has internet connection
2. Verify notification permissions granted
3. Check Firebase Console status page
4. Try sending to different device

### Issue: "Custom Data Not Received"

**Cause:** Data not properly formatted or missing

**Solution:**
1. Verify JSON format is correct
2. Check all required fields present
3. Ensure navigationParams is JSON string
4. Test with simple data first

### Issue: "Wrong Navigation"

**Cause:** navigationTarget or navigationParams incorrect

**Solution:**
1. Verify navigationTarget matches screen name
2. Check navigationParams JSON is valid
3. Test navigation directly in app
4. Review NotificationHandler code

---

## Tips and Tricks

### Save Message Templates

1. Compose notification
2. Click **Save as draft**
3. Name template (e.g., "Friend Request Test")
4. Reuse for future tests

### Test Multiple Devices

1. Click **Send test message**
2. Enter multiple tokens (one per line)
3. Click **Test**
4. All devices receive notification

### Schedule Notifications

1. Compose notification
2. Click **Schedule**
3. Choose date and time
4. Click **Schedule**

### View Analytics

1. Go to **Cloud Messaging** → **Reports**
2. View delivery rates
3. Check open rates
4. Monitor errors

### Export Notification History

1. Go to **Cloud Messaging** → **Campaigns**
2. Select campaign
3. Click **Export**
4. Download CSV

---

## Best Practices

1. **Use Test Messages During Development:** Avoid polluting analytics
2. **Test on Real Devices:** Emulators have limitations
3. **Save Templates:** Speed up repetitive testing
4. **Check Analytics:** Monitor delivery and open rates
5. **Test Both Platforms:** iOS and Android behave differently
6. **Use Descriptive Titles:** Easy to identify in notification tray
7. **Include All Required Data:** Ensure navigation works correctly
8. **Test Different States:** Foreground, background, and closed
9. **Monitor Error Rates:** Watch for delivery issues
10. **Document Test Cases:** Keep record of tested scenarios

---

## Quick Reference: Notification Data Fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `type` | Yes | string | Notification type (e.g., "friend_request") |
| `actorId` | No | string | User ID who triggered notification |
| `referenceId` | No | string | In-app notification ID |
| `navigationTarget` | Yes | string | Screen to navigate to |
| `navigationParams` | No | JSON string | Navigation parameters |

---

## Support

For issues with Firebase Console:
- Check [Firebase Status](https://status.firebase.google.com/)
- Review [Firebase Documentation](https://firebase.google.com/docs/cloud-messaging)
- Contact Firebase Support

For app-specific issues:
- Check debug logs in app
- Review TESTING_GUIDE.md
- Contact development team
