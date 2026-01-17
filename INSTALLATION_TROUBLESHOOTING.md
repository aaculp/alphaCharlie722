# Installation Troubleshooting Guide

If `npm install` is failing, try these solutions in order:

## Solution 1: Check Node Version

The project requires **Node.js 20 or higher**.

```bash
# Check your Node version
node --version

# Should show: v20.x.x or higher
```

**If your version is lower:**
- Download Node.js 20+ from: https://nodejs.org/
- Install it
- Restart your terminal
- Try `npm install` again

## Solution 2: Clear npm Cache

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Try installing again
npm install
```

**Windows (PowerShell):**
```powershell
npm cache clean --force
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

## Solution 3: Use Legacy Peer Dependencies

Some packages might have peer dependency conflicts.

```bash
npm install --legacy-peer-deps
```

## Solution 4: Try Yarn Instead

If npm continues to fail, try using Yarn:

```bash
# Install Yarn globally
npm install -g yarn

# Install dependencies with Yarn
yarn install
```

## Solution 5: Check Network/Firewall

If you're behind a corporate firewall or VPN:

```bash
# Try using a different registry
npm config set registry https://registry.npmjs.org/

# Or try with verbose logging to see what's failing
npm install --verbose
```

## Solution 6: Install with Specific Flags

```bash
# Skip optional dependencies
npm install --no-optional

# Or force install
npm install --force
```

## Solution 7: Manual Dependency Installation

If a specific package is failing, try installing it separately:

```bash
# Install React Native Firebase manually
npm install @react-native-firebase/app@23.8.2
npm install @react-native-firebase/messaging@23.8.2

# Then install the rest
npm install
```

## Common Error Messages & Solutions

### Error: "ERESOLVE unable to resolve dependency tree"

**Solution:**
```bash
npm install --legacy-peer-deps
```

### Error: "gyp ERR! stack Error: not found: python"

**Solution:**
- Install Python 3.x from https://www.python.org/
- Make sure to check "Add Python to PATH" during installation
- Restart terminal and try again

### Error: "EACCES: permission denied"

**Solution (Mac/Linux):**
```bash
sudo npm install
```

**Solution (Windows):**
- Run PowerShell or Command Prompt as Administrator
- Try `npm install` again

### Error: "Network timeout" or "ETIMEDOUT"

**Solution:**
```bash
# Increase timeout
npm install --timeout=60000

# Or use a different registry
npm config set registry https://registry.npmjs.org/
npm install
```

### Error: "Unsupported engine"

**Solution:**
- Your Node version is too old
- Install Node.js 20+ from https://nodejs.org/
- Restart terminal
- Try again

## Quick Fix Script

Try this all-in-one fix:

**Mac/Linux:**
```bash
#!/bin/bash
echo "Cleaning up..."
rm -rf node_modules package-lock.json
npm cache clean --force

echo "Installing with legacy peer deps..."
npm install --legacy-peer-deps

echo "Done! Try running: npx react-native run-android"
```

**Windows (PowerShell):**
```powershell
Write-Host "Cleaning up..."
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
npm cache clean --force

Write-Host "Installing with legacy peer deps..."
npm install --legacy-peer-deps

Write-Host "Done! Try running: npx react-native run-android"
```

## Still Having Issues?

### Share the Error Message

When asking for help, share:
1. The exact error message
2. Your Node version: `node --version`
3. Your npm version: `npm --version`
4. Your operating system

### Alternative: Use Pre-built APK

If installation continues to fail, you can:
1. Ask the repo owner to build an APK
2. Download the APK file
3. Install directly on your phone:
   ```bash
   adb install app-debug.apk
   ```

## Verification

After successful installation, verify everything is ready:

```bash
# Check Node version
node --version
# Should show: v20.x.x or higher

# Check if node_modules exists
ls node_modules
# Should show many folders

# Check if React Native CLI works
npx react-native --version
# Should show version info

# Try running the app
npx react-native run-android
```

## Success!

If `npm install` completes without errors, you should see:
```
added XXX packages in XXs
```

Then you can proceed with:
```bash
npx react-native run-android
```

---

## Quick Reference

**Most Common Fix:**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

**If that doesn't work:**
```bash
# Try Yarn instead
npm install -g yarn
yarn install
```

**Last Resort:**
```bash
# Use force flag
npm install --force
```
