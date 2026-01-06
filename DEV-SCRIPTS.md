# 🚀 OTW App - Development Scripts

## 📱 **New Convenient Commands**

I've added several npm scripts to make development easier. Here are all your options:

### **🎯 Quick Start Commands:**

#### **1. Start Everything at Once (Recommended):**
```bash
npm run dev:full
```
**What it does:**
- ✅ Starts the emulator (`Pixel_8_Pro_API_34`)
- ✅ Starts Metro bundler
- ✅ Builds and installs the app
- ✅ All in one command!

#### **2. Start Emulator + Metro Only:**
```bash
npm run dev
```
**What it does:**
- ✅ Starts the emulator
- ✅ Starts Metro bundler
- ⚠️ You'll need to run `npm run android` separately to install the app

#### **3. Fresh Clean Start:**
```bash
npm run fresh-start
```
**What it does:**
- 🧹 Cleans Android build cache
- 🧹 Cleans React Native cache
- 🚀 Starts everything fresh (emulator + Metro + app)

### **🔧 Individual Commands:**

#### **Emulator:**
```bash
npm run emulator
```
Starts your `Pixel_8_Pro_API_34` emulator.

#### **Metro Bundler:**
```bash
npm start
```
Starts the React Native development server.

#### **Build & Install App:**
```bash
npm run android
```
Builds and installs the app on the connected emulator/device.

#### **Clean Build:**
```bash
npm run clean
```
Cleans Android and React Native caches (use when you have build issues).

### **📋 Original Commands (Still Available):**
```bash
npm run ios          # Run on iOS (if you have Xcode)
npm run lint         # Check code quality
npm test             # Run tests
```

## 🎯 **Recommended Workflow:**

### **After Restarting Computer:**
```bash
npm run dev:full
```
This single command will get everything running!

### **During Development:**
```bash
# If you make code changes, Metro will auto-reload
# If you have build issues:
npm run clean
npm run dev:full
```

### **If App Crashes or Won't Start:**
```bash
npm run fresh-start
```
This will clean everything and start fresh.

## 📱 **What to Expect:**

### **When you run `npm run dev:full`:**

1. **Terminal Output:**
   ```
   [emulator] Starting emulator Pixel_8_Pro_API_34...
   [start] Welcome to Metro v0.83.3
   [android] Installing the app...
   ```

2. **Emulator Window:**
   - Android boot screen → Home screen
   - Your app icon appears
   - App launches automatically

3. **Success Indicators:**
   - ✅ Emulator shows Android home screen
   - ✅ Metro shows "Welcome to Metro"
   - ✅ App installs and launches
   - ✅ You see your OTW app interface

## 🚨 **Troubleshooting:**

### **If Emulator Won't Start:**
```bash
# Check if emulator exists
emulator -list-avds

# Should show: Pixel_8_Pro_API_34
```

### **If Metro Gets Stuck:**
```bash
# Kill Metro and restart
Ctrl+C  # Stop current process
npm run fresh-start
```

### **If App Won't Install:**
```bash
# Check emulator connection
adb devices

# Should show your emulator listed
```

## 🎉 **Ready to Go!**

Now you can start your entire development environment with just:

```bash
npm run dev:full
```

No more juggling multiple terminals or remembering complex commands! 🚀

**Next step:** Try running `npm run dev:full` and let's see your location-based venue discovery app in action! 📍✨