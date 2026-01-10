# Database Setup Instructions

This directory contains SQL scripts to set up the OTW app database schema in Supabase.

## Folder Structure

### `/setup/` - Core Database Setup
Run these scripts in your Supabase SQL Editor in the following order:

1. `checkin-database-setup.sql` - Check-in system
2. `safe-pulse-setup.sql` - User feedback system  
3. `add-max-capacity.sql` - Venue capacity tracking
4. `venue-signup-system.sql` - Complete venue signup and business account system

### `/mockdata/` - Test Data & Samples
- `simple-test.sql` - Creates a basic test venue
- `add-checkins.sql` - Adds sample check-ins for testing
- `cleanup-test.sql` - Removes all test data
- Other sample data scripts (can be deleted after use)

### `/archive/` - Old/Unused Scripts
- Deprecated scripts and old versions

## Venue Signup System Features

The `venue-signup-system.sql` script creates:

### Tables
- **venue_applications**: Stores venue signup applications
- **venue_business_accounts**: Manages approved venue business accounts
- **venue_push_notifications**: Tracks push notification campaigns

### Features
- ✅ Venue application submission and tracking
- ✅ Automatic business account creation on approval
- ✅ Subscription tier management (Free, Core, Pro, Revenue+)
- ✅ Push notification credit system
- ✅ Row Level Security (RLS) policies
- ✅ Admin approval workflow
- ✅ Automatic venue creation on approval

### Subscription Tiers
- **Free ($0)**: Basic venue profile, live activity indicator
- **Core ($79/month)**: 20 push notifications, geo-targeting, analytics
- **Pro ($179/month)**: 60 push notifications, flash offers, advanced features
- **Revenue+ ($299/month)**: Unlimited pushes, automation, priority support

## Admin Functions

To approve venue applications, you'll need admin access. Set a user as admin:

```sql
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb 
WHERE email = 'your-admin-email@example.com';
```

## Testing

After running the scripts, you can:

1. Submit venue applications through the app
2. Check applications in the `venue_applications` table
3. Approve applications (creates venue + business account automatically)
4. Test subscription management and push credit system

## Monitoring

Key queries for monitoring:

```sql
-- Pending applications
SELECT * FROM venue_applications WHERE status = 'pending';

-- Active business accounts
SELECT * FROM venue_business_accounts WHERE account_status = 'active';

-- Subscription distribution
SELECT subscription_tier, COUNT(*) FROM venue_business_accounts GROUP BY subscription_tier;
```

## Quick Testing (Recommended)

For testing the analytics dashboard:

1. **Create test venue:**
   ```sql
   -- Copy and paste database/mockdata/simple-test.sql
   ```

2. **Copy the venue ID** from the results

3. **Add check-ins:**
   ```sql
   -- Copy database/mockdata/add-checkins.sql
   -- Replace 'YOUR_VENUE_ID_HERE' with the actual venue ID
   ```

4. **Test the analytics dashboard** - should show real data!

5. **Cleanup when done:**
   ```sql
   -- Copy and paste database/mockdata/cleanup-test.sql
   ```

This approach is much simpler than the complex sample data scripts.