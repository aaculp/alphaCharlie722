# Creating Test Users

There are two ways to create test users for development:

## Option 1: Using Supabase Dashboard (Recommended)

This is the easiest and most reliable method:

### Steps:
1. **Go to Supabase Dashboard**
   - Navigate to: Authentication > Users

2. **Create a new user**
   - Click "Add User" button
   - Fill in:
     - Email: `testuser@example.com`
     - Password: `password123`
     - Auto Confirm User: ✅ **YES** (important!)
   - Click "Create User"

3. **Copy the User UUID**
   - After creation, you'll see the user in the list
   - Copy the UUID (it will look like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

4. **Run the profile creation script**
   - Open `add-test-user-simple.sql`
   - Replace the UUID on line 17 with your copied UUID
   - Run the script in Supabase SQL Editor

### Result:
- ✅ Auth user created (can log in)
- ✅ Profile created
- ✅ Device token added
- ✅ Privacy settings configured

---

## Option 2: Using Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Create auth user
supabase auth users create testuser@example.com --password password123

# Get the user ID from the output, then run the SQL script
```

---

## Test User Credentials

After setup, you can log in with:
- **Email**: `testuser@example.com`
- **Password**: `password123`

---

## Multiple Test Users

To create multiple test users:
1. Repeat Option 1 for each user with different emails:
   - `testuser1@example.com`
   - `testuser2@example.com`
   - `testuser3@example.com`
2. Use the same password: `password123`
3. Run the profile creation script for each user

---

## Troubleshooting

### "Login Failed: database error querying"
- This means the auth user exists but the profile doesn't
- Run the `add-test-user-simple.sql` script with the correct UUID

### "User already exists"
- The auth user is already created
- Just run the profile creation script

### "Foreign key constraint violation"
- The profile is trying to reference a non-existent auth user
- Create the auth user in Supabase Dashboard first

---

## Quick Test User Setup (Copy-Paste)

1. **Create in Supabase Dashboard:**
   - Email: `testuser@example.com`
   - Password: `password123`
   - Auto Confirm: YES

2. **Run this SQL (replace UUID):**
```sql
DO $
DECLARE
  test_user_id UUID := 'YOUR-UUID-HERE'::uuid; -- Replace with actual UUID
BEGIN
  INSERT INTO profiles (id, email, name, created_at, updated_at)
  VALUES (test_user_id, 'testuser@example.com', 'Test User', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, updated_at = NOW();
  
  INSERT INTO device_tokens (user_id, token, platform, is_active, last_used_at)
  VALUES (test_user_id, 'test-fcm-token-' || gen_random_uuid()::text, 'ios', true, NOW())
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE '✅ Test user ready!';
END $;
```

3. **Log in to your app:**
   - Email: `testuser@example.com`
   - Password: `password123`
