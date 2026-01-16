# iOS Setup TODO - Requires Mac Access

## ⚠️ IMPORTANT: These steps require macOS and Xcode

The iOS Firebase setup is **partially complete** but requires Mac access to finish. Complete these steps when you have access to a Mac.

---

## ⚠️ IMPORTANT: React Native vs Native iOS Setup

**DO NOT follow native iOS Firebase setup guides!** Your project uses React Native, which has a different setup process.

### ❌ Don't Do These (Native iOS Only):

1. **Don't use Swift Package Manager**
   - Don't add Firebase via Xcode → File → Add Packages
   - Don't use the URL: `https://github.com/firebase/firebase-ios-sdk`
   - React Native uses CocoaPods, not SPM

2. **Don't add SwiftUI code**
   - The `@UIApplicationDelegateAdaptor` code is for SwiftUI apps
   - Your React Native app already has an AppDelegate.swift
   - Firebase is already configured in your AppDelegate

3. **Don't manually add Firebase libraries in Xcode**
   - Don't select FirebaseAnalytics or other libraries in Xcode
   - These are managed by CocoaPods via the Podfile

### ✅ Do This Instead (React Native):

1. **Use CocoaPods** (already configured in `ios/Podfile`)
2. **Run `pod install`** to install Firebase dependencies
3. **Firebase is already initialized** in your `AppDelegate.swift`

Your `AppDelegate.swift` already has:
```swift
func application(
  _ application: UIApplication,
  didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
) -> Bool {
  // Initialize Firebase
  FirebaseApp.configure()
  
  // ... rest of setup
  return true
}
```

**This is already done!** You don't need to add any more code.

---

## What's Already Done ✅

- ✅ Firebase packages installed (`@react-native-firebase/app`, `@react-native-firebase/messaging`)
- ✅ `ios/Podfile` configured with Firebase/Messaging pod
- ✅ `ios/alphaCharlie722/Info.plist` updated with notification permissions
- ✅ `ios/alphaCharlie722/AppDelegate.swift` updated with Firebase initialization
- ✅ Placeholder `GoogleService-Info.plist` created

---

## Steps to Complete on Mac

### Step 1: Download Real GoogleService-Info.plist

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your Firebase project
3. Click on the iOS app (or add new iOS app if needed)
   - Bundle ID: `com.alphacharlie722`
4. Download the **real** `GoogleService-Info.plist` file
5. Replace the placeholder file at: `ios/alphaCharlie722/GoogleService-Info.plist`

**Current Status:** Placeholder file exists with dummy values

---

### Step 2: Add GoogleService-Info.plist to Xcode Project

1. Open `ios/alphaCharlie722.xcworkspace` in Xcode (NOT .xcodeproj!)
2. In the Project Navigator (left sidebar), right-click on the `alphaCharlie722` folder
3. Select "Add Files to alphaCharlie722..."
4. Navigate to and select `GoogleService-Info.plist`
5. **Important:** Check "Copy items if needed"
6. Click "Add"

**Why:** The file must be part of the Xcode project, not just in the file system

---

### Step 3: Install CocoaPods Dependencies

Open Terminal and run:

```bash
cd ios
pod install
```

**Expected Output:** Should install Firebase pods and dependencies

**If it fails:**
```bash
cd ios
pod deintegrate
pod install
```

---

### Step 4: Create APNs Authentication Key

#### In Apple Developer Portal:

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to: **Certificates, Identifiers & Profiles**
3. Click **Keys** in the sidebar
4. Click the **"+"** button to create a new key
5. Give it a name: `OTW Push Notifications`
6. Check: **Apple Push Notifications service (APNs)**
7. Click **Continue**, then **Register**
8. **Download the `.p8` key file** (you can only download once!)
9. **Save the Key ID** shown on the page (you'll need this)
10. **Save your Team ID** (found under Membership in the portal)

**Important:** Store the `.p8` file safely - you cannot download it again!

---

### Step 5: Upload APNs Key to Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the **gear icon** → **Project settings**
4. Go to the **Cloud Messaging** tab
5. Scroll to **Apple app configuration** section
6. Click **Upload** under "APNs Authentication Key"
7. Upload your `.p8` file
8. Enter your **Key ID** (from Step 4)
9. Enter your **Team ID** (from Step 4)
10. Click **Upload**

---

### Step 6: Build and Test iOS App

#### Build the app:

```bash
# From project root
npx react-native run-ios
```

Or open in Xcode and click the Play button.

#### Verify Firebase initialization:

Check the Xcode console logs for:
- `[Firebase/Core][I-COR000003] The default Firebase app has not yet been configured`
- Should see Firebase initialization messages

#### Test on a real device:

**Note:** Push notifications don't work on iOS Simulator - you need a real device!

1. Connect an iPhone/iPad via USB
2. In Xcode, select your device from the device dropdown
3. Build and run
4. Grant notification permissions when prompted
5. Send a test notification from Firebase Console

---

## Verification Checklist

When you complete the iOS setup, verify:

- [ ] Real `GoogleService-Info.plist` downloaded and replaced
- [ ] `GoogleService-Info.plist` added to Xcode project
- [ ] `pod install` completed successfully
- [ ] APNs key created and downloaded (`.p8` file)
- [ ] APNs key uploaded to Firebase Console
- [ ] App builds successfully in Xcode
- [ ] Firebase initialization logs appear in console
- [ ] App runs on a real iOS device
- [ ] Notification permission prompt appears
- [ ] Test notification received from Firebase Console

---

## Common Issues and Solutions

### Issue: "GoogleService-Info.plist not found"
**Solution:** Make sure you added the file to the Xcode project, not just copied it to the folder

### Issue: "pod install" fails
**Solution:** 
```bash
cd ios
pod deintegrate
pod install
```

### Issue: Build fails with Firebase errors
**Solution:** Clean build folder in Xcode (Cmd + Shift + K) and rebuild

### Issue: Notifications not received
**Solution:** 
- Verify you're testing on a real device (not simulator)
- Check APNs key is uploaded to Firebase
- Verify Bundle ID matches in Xcode, Firebase, and Apple Developer Portal

---

## Files to Keep Safe

When you complete the setup, keep these files secure:

- `.p8` APNs authentication key file
- Key ID (from Apple Developer Portal)
- Team ID (from Apple Developer Portal)
- `GoogleService-Info.plist` (contains sensitive Firebase config)

**Do NOT commit these to public repositories!**

---

## Next Steps After iOS Setup

Once iOS setup is complete, you can:

1. Continue with **Task 2: Device Token Management**
2. Test push notifications on both Android and iOS
3. Implement the full push notification flow

---

## Questions?

If you run into issues during iOS setup:
1. Check the `FIREBASE_SETUP.md` file for detailed instructions
2. Review the [React Native Firebase documentation](https://rnfirebase.io/)
3. Check the [Firebase iOS setup guide](https://firebase.google.com/docs/ios/setup)

---

## Reference Links

### React Native Firebase (Use These):
- [React Native Firebase Documentation](https://rnfirebase.io/)
- [React Native Firebase iOS Setup](https://rnfirebase.io/#2-ios-setup)
- [React Native Firebase Messaging](https://rnfirebase.io/messaging/usage)

### Native iOS Firebase (For Reference Only - Don't Follow):
- [Firebase iOS SDK Repository](https://github.com/firebase/firebase-ios-sdk) - **Don't use SPM for React Native**
- [Native iOS Setup Guide](https://firebase.google.com/docs/ios/setup) - **For native apps only**

### Apple Developer:
- [Apple Developer Portal](https://developer.apple.com/account/)
- [APNs Documentation](https://developer.apple.com/documentation/usernotifications)

### Firebase Console:
- [Firebase Console](https://console.firebase.google.com/)
- [Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)

---

**Last Updated:** Task 1 completion - iOS setup pending Mac access
