# Testing Flash Offer Push Notifications on Physical Android Devices

This guide walks through setting up and testing the flash offer push notification system on two physical Android devices.

## Prerequisites

### Required Software
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **Android Studio** - [Download](https://developer.android.com/studio)
- **Java Development Kit (JDK)** - Comes with Android Studio

### Required Hardware
- **Two Android phones** with Google Play Services
- **USB cables** for both phones
- **Computer** (Windows, Mac, or Linux)

### Required Accounts
- **Supabase account** - Already configured (credentials in the repo)
- **Firebase account** - Already configured (credentials set up)

---

## Step 1: Clone the Repository

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/alphaCharlie722.git

# Navigate to the project
cd alphaCharlie722

# Install dependencies
npm install
```

**Note:** This will take 5-10 minutes to download all packages.

---

## Step 2: Set Up Android Studio

### Install Android Studio
1. Download and install Android Studio
2. During installation, make sure to install:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (optional, but useful)

### Configure Android SDK
1. Open Android Studio
2. Go to **Settings/Preferences** → **Appearance & Behavior** → **System Settings** → **Android SDK**
3. Install **Android 13.0 (API 33)** or higher
4. Note the SDK location (you'll need this)

### Set Environment Variables

**Windows:**
```powershell
# Add to System Environment Variables
ANDROID_HOME=C:\Users\YourUsername\AppData\Local\Android\Sdk
Path=%Path%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools
```

**Mac/Linux:**
```bash
# Add to ~/.bash_profile or ~/.zshrc
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
```

**Verify installation:**
```bash
adb --version
# Should show: Android Debug Bridge version X.X.X
```

---

## Step 3: Prepare Physical Devices

### Enable Developer Mode (Both Phones)

1. Go to **Settings** → **About Phone**
2. Tap **Build Number** 7 times
3. You'll see "You are now a developer!"

### Enable USB Debugging (Both Phones)

1. Go to **Settings** → **System** → **Developer Options**
2. Enable **USB Debugging**
3. Enable **Install via USB** (if available)

### Connect Devices

1. Connect **Phone 1** via USB
2. On the phone, tap **Allow** when prompted for USB debugging
3. Check "Always allow from this computer"
4. Repeat for **Phone 2**

**Verify both devices are connected:**
```bash
adb devices
```

You should see:
```
List of devices attached
ABC123456789    device
DEF987654321    device
```

---

## Step 4: Build and Install the App

### Option A: Install on Both Devices Simultaneously

```bash
# From the project root directory
npx react-native run-android
```

This will:
1. Build the app
2. Install on **all connected devices**
3. Launch the app automatically

**Wait 5-10 minutes** for the first build.

### Option B: Install on Specific Device

If you want to install on one device at a time:

```bash
# Install on Phone 1
adb -s ABC123456789 install android/app/build/outputs/apk/debug/app-debug.apk

# Install on Phone 2
adb -s DEF987654321 install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Step 5: Set Up Test Accounts

### Phone 1: Venue Owner Account

1. Open the app on Phone 1
2. Tap **Sign Up**
3. Create account:
   - Email: `venueowner@test.com`
   - Password: `password123`
4. Complete venue registration:
   - Venue Name: "Test Cafe"
   - Address: Any address
   - Category: Restaurant
5. Grant notification permissions when prompted

### Phone 2: Customer Account

1. Open the app on Phone 2
2. Tap **Sign Up**
3. Create account:
   - Email: `customer@test.com`
   - Password: `password123`
4. Grant notification permissions when prompted
5. Grant location permissions when prompted

**Important:** Both phones must grant notification permissions for push notifications to work!

---

## Step 6: Test Push Notifications

### Create a Flash Offer (Phone 1 - Venue Owner)

1. On Phone 1, navigate to **Flash Offers** tab
2. Tap **Create Flash Offer** button
3. Fill in the details:
   - **Title:** "50% Off Coffee"
   - **Description:** "Limited time offer!"
   - **Discount:** 50%
   - **Quantity:** 10
   - **Duration:** 2 hours
   - **Radius:** 999 miles (to ensure Phone 2 is in range)
   - **Send Push Notification:** ✅ **ENABLED**
4. Tap **Create Offer**

### Verify Notification (Phone 2 - Customer)

**Within a few seconds**, Phone 2 should:
1. ✅ Receive a push notification
2. ✅ Show notification in the notification tray
3. ✅ Display: "50% Off Coffee at Test Cafe"

**Tap the notification** to open the app and view the flash offer details.

---

## Step 7: Verify System is Working

### Check on Phone 1 (Venue Owner)

After creating the offer, you should see:
- ✅ "Push notification sent to X users"
- ✅ Success message
- ✅ Offer appears in the Flash Offers list

### Check on Phone 2 (Customer)

You should:
- ✅ Receive the notification
- ✅ See the offer in the app's Flash Offers feed
- ✅ Be able to claim the offer

---

## Troubleshooting

### Issue: "No devices found"

**Solution:**
```bash
# Restart ADB server
adb kill-server
adb start-server
adb devices
```

### Issue: "App won't install"

**Solution:**
```bash
# Uninstall old version first
adb uninstall com.alphacharlie722

# Rebuild and install
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### Issue: "Notification not received"

**Check:**
1. ✅ Notification permissions granted on Phone 2?
   - Settings → Apps → OTW → Permissions → Notifications
2. ✅ Phone 2 has internet connection?
3. ✅ Phone 2 has Google Play Services?
   - Settings → Apps → Google Play Services
4. ✅ Customer account has notifications enabled?
   - In app: Settings → Notification Settings

**View logs to debug:**
```bash
# View logs from Phone 2
adb -s DEF987654321 logcat | grep -i "FCM\|notification\|firebase"
```

### Issue: "Build failed"

**Solution:**
```bash
# Clear cache and rebuild
cd android
./gradlew clean
cd ..
rm -rf node_modules
npm install
npx react-native run-android
```

### Issue: "Metro bundler not starting"

**Solution:**
```bash
# Start Metro manually in a separate terminal
npx react-native start

# In another terminal, install the app
npx react-native run-android
```

---

## Advanced Testing Scenarios

### Test 1: Multiple Customers

1. Create a third account on Phone 2: `customer2@test.com`
2. Log out and log back in with different accounts
3. Create flash offer on Phone 1
4. Verify both customer accounts receive notifications

### Test 2: Notification Preferences

1. On Phone 2, go to **Settings** → **Notification Settings**
2. Disable "Flash Offer Notifications"
3. Create flash offer on Phone 1
4. Verify Phone 2 does **NOT** receive notification
5. Re-enable notifications and test again

### Test 3: Rate Limiting

1. Create 3 flash offers quickly on Phone 1
2. Try to create a 4th offer
3. Should see: "Daily offer limit reached" (Free tier = 3 offers/day)

### Test 4: Favorites Only

1. On Phone 2, favorite the venue (Test Cafe)
2. On Phone 1, create flash offer with **"Target Favorites Only"** enabled
3. Verify Phone 2 receives notification
4. Create another customer account that hasn't favorited the venue
5. Verify that account does NOT receive notification

---

## Viewing Logs

### View App Logs (Both Phones)

```bash
# Phone 1 logs
adb -s ABC123456789 logcat | grep -i "alphacharlie"

# Phone 2 logs
adb -s DEF987654321 logcat | grep -i "alphacharlie"
```

### View FCM Logs (Phone 2)

```bash
adb -s DEF987654321 logcat | grep -i "FCM"
```

Look for:
- `✅ FCM token generated`
- `✅ FCM token stored in database`
- `📬 Notification received`

---

## Expected Behavior

### When Flash Offer is Created:

**Phone 1 (Venue Owner):**
1. Shows "Sending push notification..."
2. Shows "Push notification sent to X users"
3. Offer appears in list with "Sent" badge

**Phone 2 (Customer):**
1. Receives push notification within 1-3 seconds
2. Notification shows in tray with title and description
3. Tapping notification opens app to offer details
4. Offer appears in Flash Offers feed

### System Flow:

```
Phone 1 (Venue Owner)
    ↓
Creates Flash Offer
    ↓
App calls Supabase Edge Function
    ↓
Edge Function:
  - Validates JWT token
  - Queries targeted users
  - Filters by preferences
  - Checks rate limits
  - Sends via Firebase
    ↓
Firebase Cloud Messaging
    ↓
Phone 2 (Customer)
    ↓
Receives Push Notification
```

---

## Clean Up After Testing

### Uninstall App

```bash
# Uninstall from both phones
adb uninstall com.alphacharlie722
```

### Delete Test Accounts (Optional)

Go to Supabase Dashboard → Authentication → Users → Delete test accounts

---

## Quick Reference Commands

```bash
# Check connected devices
adb devices

# Install app on all devices
npx react-native run-android

# View logs from specific device
adb -s DEVICE_ID logcat

# Uninstall app
adb uninstall com.alphacharlie722

# Restart ADB
adb kill-server && adb start-server

# Clear app data
adb shell pm clear com.alphacharlie722
```

---

## Support

If you encounter issues:

1. **Check the logs** - Most issues show up in logs
2. **Verify permissions** - Notifications require explicit permission
3. **Check internet** - Both phones need internet connection
4. **Restart devices** - Sometimes a simple restart fixes issues
5. **Rebuild app** - `./gradlew clean` then rebuild

---

## Success Checklist

- [ ] Both phones connected via USB
- [ ] App installed on both phones
- [ ] Venue owner account created on Phone 1
- [ ] Customer account created on Phone 2
- [ ] Notification permissions granted on both phones
- [ ] Flash offer created on Phone 1
- [ ] Push notification received on Phone 2
- [ ] Notification tapped and app opened
- [ ] Offer visible in app

**If all checkboxes are checked, the system is working perfectly!** ✅

---

## Notes

- **First build takes 5-10 minutes** - Be patient!
- **Physical devices required** - Emulators don't support real FCM
- **Google Play Services required** - Must be installed on both phones
- **Internet required** - Both phones need internet for push notifications
- **Permissions required** - Must grant notification permissions

The system is production-ready and will work flawlessly on physical devices! 🚀
