# Quick Start Guide

Your buddy just pulled the latest changes. Here's what he needs to run the app:

## Prerequisites (One-Time Setup)

### 1. Install Required Software
- **Node.js** (v18+): https://nodejs.org/
- **Android Studio**: https://developer.android.com/studio
- **Git**: Already has it (since he pulled)

### 2. Install Dependencies
```bash
npm install
```
⏱️ Takes 5-10 minutes

### 3. Set Up Android Studio
- Install Android SDK (API 33+)
- Set `ANDROID_HOME` environment variable
- Add `platform-tools` to PATH

**Windows:**
```powershell
ANDROID_HOME=C:\Users\YourUsername\AppData\Local\Android\Sdk
```

**Mac/Linux:**
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

Verify:
```bash
adb --version
```

---

## Running the App

### Option 1: Physical Device (Recommended for Testing Push Notifications)

1. **Enable Developer Mode on phone:**
   - Settings → About Phone → Tap "Build Number" 7 times

2. **Enable USB Debugging:**
   - Settings → System → Developer Options → USB Debugging

3. **Connect phone via USB**

4. **Verify connection:**
   ```bash
   adb devices
   ```

5. **Run the app:**
   ```bash
   npm run android
   ```
   ⏱️ First build takes 5-10 minutes

### Option 2: Android Emulator

1. **Open Android Studio**
2. **Tools → Device Manager → Create Virtual Device**
3. **Select Pixel 8 Pro, API 34**
4. **Start emulator**
5. **Run the app:**
   ```bash
   npm run android
   ```

---

## Testing Push Notifications

**Important:** Push notifications only work on **physical devices**, not emulators!

### Quick Test (Physical Device Required)

1. **Create account:**
   - Email: `customer@test.com`
   - Password: `password123`
   - Grant notification permissions ✅

2. **You create a flash offer** (from your venue owner account)

3. **He receives push notification** on his phone 📱

See `TESTING_ON_PHYSICAL_DEVICES.md` for detailed testing guide.

---

## Troubleshooting

### "npm install" fails
```bash
npm cache clean --force
npm install --legacy-peer-deps
```

### "No devices found"
```bash
adb kill-server
adb start-server
adb devices
```

### "Build failed"
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### "Metro bundler not starting"
```bash
# Terminal 1:
npx react-native start

# Terminal 2:
npm run android
```

---

## What's Already Configured

✅ **Supabase** - Production instance configured  
✅ **Firebase** - Push notifications configured  
✅ **Edge Function** - Deployed and working  
✅ **Database** - All tables and migrations applied  
✅ **Authentication** - Ready to use  

**No additional configuration needed!** Just install dependencies and run.

---

## Quick Commands

```bash
# Install dependencies
npm install

# Run on Android
npm run android

# Run on iOS (Mac only)
npm run ios

# Start Metro bundler
npm start

# Check connected devices
adb devices

# View logs
adb logcat | grep -i "alphacharlie"
```

---

## Need Help?

- **Installation issues:** See `INSTALLATION_TROUBLESHOOTING.md`
- **Testing push notifications:** See `TESTING_ON_PHYSICAL_DEVICES.md`
- **General setup:** See `README.md`

---

## Expected Timeline

- ⏱️ **Install Node.js/Android Studio:** 30-60 minutes (one-time)
- ⏱️ **npm install:** 5-10 minutes
- ⏱️ **First build:** 5-10 minutes
- ⏱️ **Subsequent builds:** 1-2 minutes

**Total setup time:** ~1-2 hours for first-time setup

---

## Success Checklist

- [ ] Node.js installed (`node --version`)
- [ ] Android Studio installed
- [ ] `adb` command works (`adb --version`)
- [ ] Dependencies installed (`npm install`)
- [ ] Device connected or emulator running (`adb devices`)
- [ ] App builds and runs (`npm run android`)
- [ ] Can create account and log in
- [ ] (Physical device only) Can receive push notifications

**Once all checked, he's ready to test!** 🚀
