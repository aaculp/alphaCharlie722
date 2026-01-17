## Flash Offer Push Notification Testing Setup

This guide explains how to set up test accounts to test flash offer push notifications.

## Quick Answer to Your Question

**Yes, you're correct!** The system has a `target_favorites_only` field:
- **`false`** (default): Sends to ALL users within the radius
- **`true`**: Sends ONLY to users who have favorited/followed that venue

## Setup Steps

### Step 1: Create Venue Owner Account

1. **Create Auth User in Supabase Dashboard:**
   - Go to: Authentication > Users > Add User
   - Email: `venueowner@test.com`
   - Password: `password123`
   - Auto Confirm User: ✅ **YES**
   - Click "Create User"
   - **Copy the UUID** that gets generated

2. **Run the Venue Owner Script:**
   - Open `database/mockdata/create-test-venue-owner.sql`
   - Replace `'YOUR-USER-UUID-HERE'` with your copied UUID (line 21)
   - Run the script in Supabase SQL Editor
   - You'll see: ✅ TEST VENUE OWNER SETUP COMPLETE!

3. **What Gets Created:**
   - Profile for venue owner
   - Venue: "Test Flash Offer Cafe" in San Francisco
   - Business account (active, verified, premium tier)
   - Device token for testing

### Step 2: Create Test Customers

1. **Create 3 Auth Users in Supabase Dashboard:**
   - Customer 1: `customer1@test.com` / `password123` (Auto Confirm: YES)
   - Customer 2: `customer2@test.com` / `password123` (Auto Confirm: YES)
   - Customer 3: `customer3@test.com` / `password123` (Auto Confirm: YES)
   - **Copy all 3 UUIDs**

2. **Run the Customers Script:**
   - Open `database/mockdata/create-test-customers-for-flash-offers.sql`
   - Replace the 3 UUIDs (lines 18-20)
   - Run the script in Supabase SQL Editor

3. **What Gets Created:**
   - **Customer 1**: Will receive ALL flash offers (within radius)
   - **Customer 2**: Has FAVORITED the venue (will receive targeted offers)
   - **Customer 3**: Has notifications DISABLED (will NOT receive offers)

## Testing Scenarios

### Scenario 1: Send to Everyone (target_favorites_only = false)

1. Log in as venue owner: `venueowner@test.com` / `password123`
2. Create a flash offer with:
   - **Target Favorites Only**: ❌ OFF (unchecked)
   - **Send Push Notification**: ✅ ON (checked)
   - **Radius**: 10 miles (default)
3. Expected Results:
   - Customer 1: ✅ Receives notification
   - Customer 2: ✅ Receives notification
   - Customer 3: ❌ Does NOT receive (notifications disabled)

### Scenario 2: Send to Favorites Only (target_favorites_only = true)

1. Log in as venue owner: `venueowner@test.com` / `password123`
2. Create a flash offer with:
   - **Target Favorites Only**: ✅ ON (checked)
   - **Send Push Notification**: ✅ ON (checked)
3. Expected Results:
   - Customer 1: ❌ Does NOT receive (hasn't favorited venue)
   - Customer 2: ✅ Receives notification (has favorited venue)
   - Customer 3: ❌ Does NOT receive (notifications disabled)

### Scenario 3: Test Radius Targeting

1. Create a flash offer with:
   - **Radius**: 1 mile (very small)
   - **Target Favorites Only**: ❌ OFF
2. Expected Results:
   - Only customers within 1 mile of venue (37.7749, -122.4194) receive notification
   - All test customers are at same location, so all should receive (except Customer 3)

## How to Test

### Option A: Test on Android Emulator (Recommended)

1. **Start Android Emulator with Google Play:**
   - In Android Studio: Tools → Device Manager
   - Start an emulator with "Play Store" icon
   - Sign in with a Google account

2. **Run the App:**
   ```bash
   npx react-native run-android
   ```

3. **Log in as Customer:**
   - Use `customer1@test.com` / `password123`
   - Grant notification permissions when prompted

4. **Create Flash Offer (on another device/emulator):**
   - Log in as `venueowner@test.com` / `password123`
   - Navigate to venue dashboard
   - Create a flash offer with push notifications enabled

5. **Verify Notification:**
   - Customer device should receive push notification
   - Tap notification to open flash offer detail

### Option B: Test on Physical Device

Same steps as above, but use a physical Android phone or iPhone instead of emulator.

**Note:** iOS simulators do NOT support push notifications. Use physical iPhone for iOS testing.

## Verification Queries

Run these in Supabase SQL Editor to verify setup:

### Check Venue Owner Setup
```sql
SELECT 
  v.id,
  v.name,
  vba.account_status,
  vba.verification_status,
  vba.subscription_tier
FROM venues v
INNER JOIN venue_business_accounts vba ON v.id = vba.venue_id
WHERE v.name = 'Test Flash Offer Cafe';
```

### Check Customer Setup
```sql
SELECT 
  p.email,
  CASE 
    WHEN f.venue_id IS NOT NULL THEN '✅ Favorited'
    ELSE '❌ Not Favorited'
  END as venue_favorite_status,
  CASE 
    WHEN np.friend_requests THEN '✅ Enabled'
    ELSE '❌ Disabled'
  END as notifications_status
FROM profiles p
LEFT JOIN favorites f ON p.id = f.user_id 
  AND f.venue_id = (SELECT id FROM venues WHERE name = 'Test Flash Offer Cafe' LIMIT 1)
LEFT JOIN notification_preferences np ON p.id = np.user_id
WHERE p.email IN ('customer1@test.com', 'customer2@test.com', 'customer3@test.com')
ORDER BY p.email;
```

### Check Device Tokens
```sql
SELECT 
  p.email,
  dt.platform,
  dt.is_active,
  dt.last_used_at
FROM device_tokens dt
INNER JOIN profiles p ON dt.user_id = p.id
WHERE p.email IN (
  'venueowner@test.com',
  'customer1@test.com',
  'customer2@test.com',
  'customer3@test.com'
)
ORDER BY p.email;
```

## Troubleshooting

### "Venue not found" when creating flash offer
- Make sure you're logged in as `venueowner@test.com`
- Verify the venue was created by running the verification query above

### "No notifications received"
- Check that Firebase is configured (`google-services.json` in place)
- Verify device token was registered (check logs)
- Confirm notification permissions were granted
- Check that customer has notifications enabled in preferences

### "Push notification would be sent" in logs
- The notification sending is currently a TODO in the code
- You'll need to implement the actual notification sending logic
- See `src/components/venue/FlashOfferCreationModal.tsx` line 167

## Next Steps

After setup, you can:
1. Test different targeting options (favorites only vs everyone)
2. Test different radius values
3. Test notification preferences (enable/disable)
4. Test with multiple devices
5. Monitor notification delivery in Firebase Console

## Summary

- **Venue Owner**: `venueowner@test.com` / `password123`
- **Customer 1**: `customer1@test.com` / `password123` (receives all offers)
- **Customer 2**: `customer2@test.com` / `password123` (favorited venue, receives targeted offers)
- **Customer 3**: `customer3@test.com` / `password123` (notifications disabled, receives nothing)

The `target_favorites_only` field controls whether offers go to everyone or just followers!
