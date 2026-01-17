# Secrets Management Guide

## How Your Secrets Are Stored

Your app uses **different secret storage methods** depending on the environment:

---

## 📱 Client App (React Native)

### Location: `src/lib/supabase.ts`

**Hardcoded in source code:**
```typescript
const supabaseUrl = 'https://cznhaaigowjhqdjtfeyz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**Status:** ✅ **This is SAFE and correct!**

**Why it's safe:**
- These are **client-side keys** (meant to be public)
- The `anon` key is designed to be bundled in your app
- Protected by Row Level Security (RLS) policies in Supabase
- Cannot access admin functions or bypass security rules

**Alternative (Optional):**
You could use environment variables, but it's not necessary for client keys:
```typescript
const supabaseUrl = process.env.SUPABASE_URL || 'https://...';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJ...';
```

---

## 🔧 Edge Function (Backend)

### Location: Supabase Secrets (Production)

**How secrets are stored:**
```bash
# Stored in Supabase's secure secret management
supabase secrets set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
```

**View your secrets:**
```bash
supabase secrets list --project-ref cznhaaigowjhqdjtfeyz
```

**Current secrets:**
- `FIREBASE_SERVICE_ACCOUNT` - Firebase admin credentials (private key)

**Status:** ✅ **Secure** - Stored in Supabase's encrypted secret storage

---

## 💻 Local Development

### Location: `supabase/functions/.env.local`

**File exists:** ✅ Yes
**Gitignored:** ✅ Yes
**Contains:** Placeholder credentials for local testing

**Content:**
```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"placeholder",...}
```

**Status:** ✅ **Safe** - Only placeholders, file is gitignored

---

## 🔐 Firebase Configuration

### Android: `android/app/google-services.json`
### iOS: `ios/alphaCharlie722/GoogleService-Info.plist`

**Contains:**
- Firebase project ID
- Client API keys
- App configuration

**Status:** ✅ **Safe to commit** - These are client-side configs

---

## Summary Table

| Secret Type | Location | Storage Method | Safe to Commit? |
|-------------|----------|----------------|-----------------|
| **Supabase Anon Key** | `src/lib/supabase.ts` | Hardcoded | ✅ YES (client key) |
| **Supabase URL** | `src/lib/supabase.ts` | Hardcoded | ✅ YES (public URL) |
| **Firebase Admin Key** | Supabase Secrets | Encrypted secrets | ❌ NO (admin key) |
| **Firebase Client Config** | `google-services.json` | Committed file | ✅ YES (client config) |
| **Local Dev Secrets** | `.env.local` | Gitignored file | ❌ NO (gitignored) |

---

## ❓ Do You Need a .env File?

### For the React Native App: **NO** ❌

Your app currently hardcodes the Supabase credentials, which is **perfectly fine** for client-side keys.

**Current approach (recommended):**
```typescript
// src/lib/supabase.ts
const supabaseUrl = 'https://cznhaaigowjhqdjtfeyz.supabase.co';
const supabaseAnonKey = 'eyJ...'; // This is safe to hardcode
```

### For Edge Functions: **Already Handled** ✅

- **Production:** Uses Supabase Secrets
- **Local Dev:** Uses `.env.local` (already exists)

---

## 🔄 If You Want to Use .env Files (Optional)

If you prefer environment variables for the React Native app:

### Step 1: Install react-native-dotenv

```bash
npm install react-native-dotenv
```

### Step 2: Create .env file

```env
# .env
SUPABASE_URL=https://cznhaaigowjhqdjtfeyz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Update babel.config.js

```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
    }],
  ],
};
```

### Step 4: Update supabase.ts

```typescript
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

const supabaseUrl = SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY;
```

### Step 5: Add to .gitignore

```gitignore
.env
.env.local
```

**But honestly, this is overkill for client-side keys!** Your current approach is simpler and equally secure.

---

## 🎯 Recommended Approach (Current Setup)

### ✅ Keep as-is:

1. **Client keys hardcoded** in `src/lib/supabase.ts`
   - Simple, no extra dependencies
   - Safe for client-side keys
   - Works perfectly

2. **Admin secrets in Supabase Secrets**
   - Secure, encrypted storage
   - Managed by Supabase
   - Never in git

3. **Local dev uses `.env.local`**
   - Already gitignored
   - Only for local testing
   - Contains placeholders

---

## 🔍 Verify Your Setup

### Check what's in Supabase Secrets:
```bash
supabase secrets list --project-ref cznhaaigowjhqdjtfeyz
```

### Check what's gitignored:
```bash
git check-ignore supabase/functions/.env.local
# Should output: supabase/functions/.env.local
```

### Check what's in your app:
```bash
# View the client config
cat src/lib/supabase.ts | grep "const supabase"
```

---

## 🚨 What NOT to Do

❌ **Don't commit:**
- `.env` files with real credentials
- Firebase admin service account JSON files
- Private keys or certificates
- Database passwords

✅ **Safe to commit:**
- Client-side API keys (Supabase anon key)
- Firebase client config (`google-services.json`)
- Public URLs and project IDs
- Test credentials in documentation

---

## 📝 Quick Reference

### Where are my secrets?

| Secret | Location | How to Access |
|--------|----------|---------------|
| Supabase Anon Key | `src/lib/supabase.ts` | View in code |
| Firebase Admin Key | Supabase Secrets | `supabase secrets list` |
| Local Dev Secrets | `.env.local` | View file (gitignored) |
| Firebase Client Config | `google-services.json` | View file (committed) |

### How to update secrets?

| Secret | Command |
|--------|---------|
| Supabase Anon Key | Edit `src/lib/supabase.ts` |
| Firebase Admin Key | `supabase secrets set FIREBASE_SERVICE_ACCOUNT='...'` |
| Local Dev Secrets | Edit `.env.local` |

---

## ✅ Your Current Setup is Perfect!

You don't need to change anything. Your secrets are properly managed:

1. ✅ Client keys are hardcoded (safe and simple)
2. ✅ Admin keys are in Supabase Secrets (secure)
3. ✅ Local dev uses `.env.local` (gitignored)
4. ✅ No sensitive data in git history

**No .env file needed for the React Native app!** Your current approach is the recommended way for client-side keys.
