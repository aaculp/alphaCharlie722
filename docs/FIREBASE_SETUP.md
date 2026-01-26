# Firebase Cloud Messaging Setup

This document provides instructions for completing the Firebase Cloud Messaging (FCM) setup for the OTW app.

## ⚠️ Important: iOS Setup Requires Mac

**iOS configuration requires macOS and Xcode.** If you're on Windows:
- Complete the Android setup first (fully supported on Windows)
- See `iOS_SETUP_TODO.md` for iOS steps to complete when you have Mac access
- The React Native code you write will work on both platforms

## Prerequisites

1. A Firebase project created in the [Firebase Console](https://console.firebase.google.com/)
2. Access to the Apple Developer Portal (for iOS APNs certificates)
3. Android Studio installed (for Android configuration)
4. Xcode installed (for iOS configuration - **Mac only**)

## Android Setup

### 1. Download google-services.json

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on the Android app (or add a new Android app if not exists)
4. Use package name: `com.alphacharlie722`
5. Download the `google-services.json` file
6. Replace the placeholder file at `android/app/google-services.json` with your downloaded file

### 2. Verify Build Configuration

The following files have been configured for Firebase:

**Root build.gradle:**
- Added Google Services plugin in plugins block: `id("com.google.gms.google-services") version "4.4.4" apply false`

**App-level build.gradle:**
- Applied Google Services plugin: `apply plugin: "com.google.gms.google-services"`
- Added Firebase BoM (Bill of Materials): `implementation platform("com.google.firebase:firebase-bom:34.8.0")`
- Added Firebase Messaging dependency: `implementation("com.google.firebase:firebase-messaging")`

The BoM ensures all Firebase libraries use compatible versions.

### 3. Test Android Build

```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### 4. Android Notification Channels

The following notification channels have been configured in `MainApplication.kt`:

- **social_notifications** (High importance) - General social interactions
- **friend_requests** (High importance) - New friend requests
- **venue_shares** (Default importance) - Venue shares from friends
- **activity_updates** (Default importance) - Likes, comments, and activity

These channels are automatically created when the app launches on Android 8.0+ devices.

Channel IDs are available in `src/constants/notificationChannels.ts` for use in React Native code.

## iOS Setup

### 1. Download GoogleService-Info.plist

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on the iOS app (or add a new iOS app if not exists)
4. Use bundle ID: `com.alphacharlie722`
5. Download the `GoogleService-Info.plist` file
6. Replace the placeholder file at `ios/alphaCharlie722/GoogleService-Info.plist` with your downloaded file

### 2. Add GoogleService-Info.plist to Xcode

1. Open `ios/alphaCharlie722.xcworkspace` in Xcode
2. Right-click on the `alphaCharlie722` folder in the project navigator
3. Select "Add Files to alphaCharlie722..."
4. Select the `GoogleService-Info.plist` file
5. Make sure "Copy items if needed" is checked
6. Click "Add"

### 3. Install CocoaPods Dependencies

```bash
cd ios
pod install
```

### 4. Configure APNs (Apple Push Notification service)

#### Create APNs Certificate

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to Certificates, Identifiers & Profiles
3. Click on "Keys" in the sidebar
4. Click the "+" button to create a new key
5. Give it a name (e.g., "OTW Push Notifications")
6. Check "Apple Push Notifications service (APNs)"
7. Click "Continue" and then "Register"
8. Download the `.p8` key file (you can only download it once!)
9. Note the Key ID shown on the page

#### Upload APNs Key to Firebase

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on the gear icon and select "Project settings"
4. Go to the "Cloud Messaging" tab
5. Scroll to the "Apple app configuration" section
6. Click "Upload" under "APNs Authentication Key"
7. Upload your `.p8` file
8. Enter your Key ID
9. Enter your Team ID (found in Apple Developer Portal under Membership)

### 5. Update Info.plist for Notifications

The Info.plist has been updated with:
- `UIBackgroundModes` with `remote-notification` to enable background notifications
- `FirebaseAppDelegateProxyEnabled` set to `false` to allow manual notification handling

### 6. AppDelegate Configuration

The AppDelegate.swift has been updated with:
- Firebase initialization in `didFinishLaunchingWithOptions`
- `UNUserNotificationCenterDelegate` implementation
- Foreground notification handling
- Notification tap handling
- Remote notification registration callbacks

## Verification

### Test Firebase Connection

After completing the setup, you can verify the Firebase connection:

1. Run the app on a device or simulator
2. Check the logs for Firebase initialization messages
3. Use Firebase Console to send a test notification

### Common Issues

**Android:**
- If you get "google-services.json not found" error, make sure the file is in `android/app/` directory
- If build fails, try `cd android && ./gradlew clean`

**iOS:**
- If CocoaPods installation fails, try `cd ios && pod deintegrate && pod install`
- Make sure GoogleService-Info.plist is added to the Xcode project, not just the file system

## Next Steps

After completing this setup:
1. Task 1.2: Configure iOS APNs integration (Info.plist updates)
2. Task 1.3: Configure Android notification channels
3. Task 2: Device Token Management

## Resources

- [React Native Firebase Documentation](https://rnfirebase.io/)
- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [APNs Documentation](https://developer.apple.com/documentation/usernotifications)
