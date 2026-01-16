# Push Notifications - Frequently Asked Questions (FAQ)

## General Questions

### What are push notifications?
Push notifications are instant alerts sent to your device when something happens in the OTW app, even when the app is closed. They appear on your lock screen and notification tray, keeping you updated about friend requests, venue shares, and other social activities.

### Why should I enable push notifications?
Push notifications ensure you never miss important social interactions. Without them, you'd need to constantly check the app manually. With push notifications, you'll know immediately when:
- Someone sends you a friend request
- Someone accepts your friend request
- A friend shares a venue with you
- And more social activities

### Are push notifications free?
Yes, push notifications are completely free. They use a tiny amount of data (a few kilobytes per notification), but there's no additional charge.

### Do push notifications drain my battery?
No. Push notifications are designed to be extremely battery-efficient. They use Firebase Cloud Messaging, which maintains a single connection shared by all apps, minimizing battery impact.

---

## Setup and Configuration

### How do I enable push notifications?
When you first launch OTW, you'll be prompted to allow notifications. Simply tap "Allow" when asked. If you missed this prompt, you can enable notifications later:

**iOS:** Settings > OTW > Notifications > Allow Notifications (ON)  
**Android:** Settings > Apps > OTW > Notifications > Show notifications (ON)

See the [USER_GUIDE.md](USER_GUIDE.md) for detailed instructions.

### I accidentally denied permission. How do I enable it now?
Don't worry! You can re-enable notifications:

1. Open your device Settings app
2. Find OTW in the app list
3. Tap Notifications
4. Enable notifications
5. Restart the OTW app

Or use the shortcut in the OTW app:
1. Go to Profile > Settings > Notifications
2. Tap "Open Device Settings"
3. Enable notifications

### Can I choose which notifications I receive?
Yes! OTW gives you fine-grained control over notification types:

1. Open OTW app
2. Go to Profile > Settings > Notifications
3. Toggle individual notification types ON or OFF:
   - Friend Requests
   - Friend Accepted
   - Venue Shares
   - Collection Follows
   - Activity Likes
   - Activity Comments

### Do my notification preferences sync across devices?
Yes! When you change your notification preferences, they automatically sync to all devices where you're logged into OTW. You only need to set your preferences once.

### Can I temporarily disable notifications without changing my preferences?
Yes! You can use your device's Do Not Disturb mode:

**iOS:** Control Center > Focus > Do Not Disturb  
**Android:** Quick Settings > Do Not Disturb

Notifications will be delivered silently and appear when you disable Do Not Disturb.

---

## Notification Behavior

### What's the difference between push notifications and in-app notifications?
**Push Notifications:**
- Appear on your device's lock screen and notification tray
- Work even when the app is closed
- Make a sound and/or vibration
- Can be disabled in settings

**In-App Notifications:**
- Appear in the app's notification center (bell icon)
- Only visible when you open the app
- Always created, regardless of push settings
- Cannot be disabled

### Why do I see notifications in the app but not on my device?
This means push notifications are disabled. You're still receiving in-app notifications, but not device push notifications. To enable push notifications:

1. Check device settings (Settings > OTW > Notifications)
2. Check app settings (Profile > Settings > Notifications)
3. Ensure both are enabled

### What happens when I tap a notification?
When you tap a notification, the OTW app opens and automatically navigates to the relevant screen:

- **Friend Request:** Opens the Friend Requests screen
- **Friend Accepted:** Opens the friend's profile
- **Venue Share:** Opens the venue detail screen
- **Collection Follow:** Opens your collection
- **Activity Like/Comment:** Opens the activity feed

### Do I get notifications when I'm already using the app?
When the app is open (foreground), you'll see an in-app banner at the top of the screen instead of a device notification. This prevents duplicate alerts and provides a seamless experience.

### Can I see old notifications?
Yes! All notifications are stored in the app's notification center:

1. Open the OTW app
2. Tap the bell icon at the top
3. Scroll through your notification history

Notifications remain in the center until you delete them.

### Why do some notifications have profile pictures and others don't?
Notifications show the sender's profile picture when available. If a user hasn't uploaded a profile picture, a default avatar is shown instead.

---

## Troubleshooting

### I'm not receiving push notifications. What should I do?
Follow these troubleshooting steps:

1. **Check device permissions:** Settings > OTW > Notifications (ON)
2. **Check app settings:** Profile > Settings > Notifications (ON)
3. **Check internet connection:** Ensure WiFi or mobile data is active
4. **Restart the app:** Close completely and reopen
5. **Check Do Not Disturb:** Ensure it's not blocking notifications
6. **Update the app:** Make sure you have the latest version

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions.

### Push notifications are delayed. Why?
Delayed notifications can be caused by:

- **Battery Saver Mode:** Disable battery optimization for OTW
- **Poor Network:** Switch to a stronger connection
- **Background App Refresh (iOS):** Enable for OTW in Settings
- **Battery Optimization (Android):** Set to Unrestricted for OTW

### Notifications don't make a sound. How do I fix this?
**iOS:**
1. Check device volume (not on silent mode)
2. Settings > OTW > Notifications > Sounds (ON)

**Android:**
1. Check device volume
2. Settings > Apps > OTW > Notifications > Sound (Enabled)

### I'm receiving too many notifications. Can I reduce them?
Yes! You can customize which notifications you receive:

1. Open OTW app
2. Go to Profile > Settings > Notifications
3. Disable specific notification types you don't want
4. Keep only the ones you find valuable

You can also disable push notifications entirely while keeping in-app notifications.

### Notifications open the app but don't navigate to the right screen. Why?
This is usually a temporary issue. Try:

1. Update to the latest version of OTW
2. Tap the notification again
3. Manually navigate to the notification center in the app
4. If it persists, report the issue through Settings > Help & Support

### Why am I receiving notifications on multiple devices?
This is normal and expected! If you're logged into OTW on multiple devices (e.g., phone and tablet), all devices will receive push notifications. This ensures you never miss an update, regardless of which device you're using.

---

## Privacy and Security

### Are my notifications private?
Yes. Notifications are sent only to your registered devices. Other users cannot see your notifications or notification preferences.

### Can other users see if I've read their notifications?
No. Read/unread status is private and only visible to you.

### What data is included in push notifications?
Push notifications include:
- Sender's name and profile picture
- Notification type (friend request, venue share, etc.)
- Brief message text
- Timestamp

No sensitive personal information is included in the notification payload.

### Can I report inappropriate notifications?
Yes. If you receive an inappropriate notification:

1. Open the notification in the app
2. Tap the three-dot menu
3. Select "Report"
4. Choose the reason and submit

Our team will review the report and take appropriate action.

### What happens to my notifications when I log out?
When you log out:
- Your device stops receiving push notifications
- In-app notifications remain in the database
- When you log back in, you'll see any notifications you missed
- Push notifications resume automatically

### Are notifications encrypted?
Yes. All communication between the OTW app and servers uses HTTPS encryption. Device tokens are stored securely in the database.

---

## Technical Questions

### What technology powers push notifications?
OTW uses Firebase Cloud Messaging (FCM) for push notifications. FCM is a reliable, battery-efficient service provided by Google that works on both iOS and Android.

### Do push notifications work without internet?
No. Push notifications require an active internet connection (WiFi or mobile data) to be delivered. If you're offline, notifications will be delivered when you reconnect.

### How quickly are notifications delivered?
Notifications are typically delivered within 1-5 seconds of the triggering event. Delivery time may vary based on:
- Network connection quality
- Device battery optimization settings
- FCM service status

### What happens if a notification fails to deliver?
If a notification fails to deliver:
- The system automatically retries up to 2 times
- The in-app notification is still created
- You'll see it when you open the app
- Permanent failures are logged for monitoring

### Can I test if push notifications are working?
Yes! If you have access to Developer Options:

1. Go to Profile > Settings > Developer Options
2. Tap "Notification Debug"
3. Tap "Send Test Notification"
4. You should receive a test notification immediately

*Note: Developer Options may not be visible in production builds.*

### Do push notifications work on tablets?
Yes! Push notifications work on any device running iOS or Android, including tablets. Simply log into OTW on your tablet and enable notifications.

### What versions of iOS and Android are supported?
Push notifications require:
- **iOS:** iOS 10 or later
- **Android:** Android 5.0 (Lollipop) or later

If you're running an older version, you'll still receive in-app notifications, but push notifications may not work.

---

## Account and Device Management

### What happens if I change my phone?
When you log into OTW on a new device:
1. The app will request notification permission
2. A new device token is registered
3. Your notification preferences are synced from the cloud
4. You'll start receiving notifications on the new device
5. Your old device will stop receiving notifications when you log out

### Can I use OTW on multiple devices simultaneously?
Yes! You can be logged into OTW on multiple devices at the same time. All devices will receive push notifications, and your preferences will sync across all devices.

### How do I stop receiving notifications on a specific device?
To stop notifications on a specific device without logging out:

1. On that device, go to Settings > OTW > Notifications
2. Disable notifications
3. Or in the OTW app: Profile > Settings > Notifications (OFF)

This only affects that specific device. Other devices will continue receiving notifications.

### What happens to my device token when I uninstall the app?
When you uninstall OTW:
- Your device token is marked as inactive
- You stop receiving push notifications
- Your in-app notifications remain in the database
- When you reinstall and log in, a new device token is created

### How many devices can I have registered?
There's no limit! You can have OTW installed and receive notifications on as many devices as you want.

---

## Notification Content

### Can I customize notification sounds?
Currently, OTW uses the default notification sound for your device. Custom notification sounds may be added in a future update.

### Can I customize how notifications look?
Notification appearance is controlled by your device's operating system. You can customize some aspects in device settings:

**iOS:** Settings > OTW > Notifications > Banner Style  
**Android:** Settings > Apps > OTW > Notifications > Advanced

### Why do some notifications show more detail than others?
Notification detail depends on:
- The notification type
- Available information (e.g., profile picture)
- Device settings (notification preview settings)
- Privacy settings

### Can I get notifications in a different language?
Notifications are displayed in the language you've set for the OTW app. To change the language:

1. Go to Profile > Settings > Language
2. Select your preferred language
3. Notifications will appear in that language

---

## Billing and Data Usage

### Do push notifications use a lot of data?
No. Push notifications use minimal data:
- Each notification: ~1-5 KB
- 100 notifications: ~100-500 KB
- Monthly usage: Typically less than 1 MB

This is negligible compared to other app activities like loading images or videos.

### Will I be charged for push notifications?
No. Push notifications are completely free. There are no additional charges for receiving notifications.

### Do push notifications work on WiFi only?
No. Push notifications work on both WiFi and mobile data. You can receive notifications regardless of your connection type.

### Can I restrict notifications to WiFi only?
Not directly, but you can:
1. Disable mobile data for OTW in device settings
2. You'll only receive notifications when connected to WiFi
3. Note: This also affects other app features

---

## Future Features

### Will there be more notification types in the future?
Yes! We're planning to add notifications for:
- Friend check-ins nearby
- Group outing invites
- Collection updates
- Trending venues
- And more!

### Will there be notification actions (like quick reply)?
We're exploring adding action buttons to notifications, such as:
- Accept/Decline friend requests directly from notification
- Quick reply to comments
- Quick like for activities

Stay tuned for updates!

### Will there be notification scheduling or quiet hours?
We're considering adding:
- Quiet hours (no notifications during specific times)
- Notification summaries (digest of notifications)
- Priority notifications (important alerts only)

These features may be added in future updates based on user feedback.

---

## Getting Help

### Where can I find more detailed instructions?
See our comprehensive guides:
- **[USER_GUIDE.md](USER_GUIDE.md)** - Complete user guide
- **[QUICK_START_GUIDE.md](QUICK_START_GUIDE.md)** - Quick reference
- **[VISUAL_SETUP_GUIDE.md](VISUAL_SETUP_GUIDE.md)** - Step-by-step with visuals
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Technical troubleshooting

### How do I contact support?
If you need additional help:

1. Open OTW app
2. Go to Profile > Settings
3. Tap "Help & Support"
4. Choose your issue category
5. Submit your question

Our support team typically responds within 24 hours.

### How do I report a bug with notifications?
To report a bug:

1. Go to Profile > Settings > Help & Support
2. Select "Report a Problem"
3. Choose "Notifications" as the category
4. Describe the issue in detail
5. Include:
   - Device model and OS version
   - Steps to reproduce the issue
   - Screenshots if applicable

### Where can I suggest new notification features?
We love hearing from users! To suggest features:

1. Go to Profile > Settings > Help & Support
2. Select "Feature Request"
3. Describe your idea
4. Explain how it would improve your experience

We review all suggestions and consider them for future updates.

---

## Version Information

This FAQ is for OTW app version 2.0 and later with push notification support.

Last updated: January 2026

---

**Still have questions?** Contact us through Profile > Settings > Help & Support
