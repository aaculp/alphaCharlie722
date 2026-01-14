# New Venues Spotlight - Testing Setup

This document explains how to populate test data for the New Venues Spotlight feature.

## Overview

The New Venues Spotlight feature displays venues that have signed up within the last 30 days. To test this feature, you need to create test venues with recent signup dates.

## Why SQL Scripts?

The `venue_business_accounts` table has Row-Level Security (RLS) policies that prevent client-side inserts. Therefore, we use SQL scripts that run directly in Supabase with elevated permissions.

## Setup Instructions

### 1. Populate Test Venues

1. Open your Supabase project dashboard
2. Navigate to the **SQL Editor**
3. Open the file `database/populate_new_venues.sql`
4. Copy the entire contents
5. Paste into the Supabase SQL Editor
6. Click **Run** to execute the script

This will create 10 test venues with signup dates ranging from 1-20 days ago:

- **The Fresh Brew** (Coffee Shop) - 2 days ago
- **Neon Nights Club** (Nightclub) - 5 days ago
- **Sunrise Yoga Studio** (Fitness) - 1 day ago
- **Burger Bliss** (Fast Food) - 7 days ago
- **The Craft Tap Room** (Brewery) - 10 days ago
- **Sushi Zen** (Fine Dining) - 3 days ago
- **The Game Lounge** (Sports Bar) - 14 days ago
- **Vegan Vibes** (Restaurant) - 20 days ago
- **The Rooftop Lounge** (Lounge) - 4 days ago
- **Morning Glory Cafe** (Coffee Shop) - 12 days ago

### 2. Verify in the App

1. Open the app
2. Navigate to the Home screen
3. Pull down to refresh
4. You should see the "New Venues" spotlight carousel with the test venues
5. Venues are ordered by signup date (newest first)

### 3. Clear Test Data (Optional)

When you're done testing and want to remove the test venues:

1. Open the Supabase SQL Editor
2. Open the file `database/clear_new_venues.sql`
3. Copy the entire contents
4. Paste into the Supabase SQL Editor
5. Click **Run** to execute the script

This will remove all 10 test venues and their associated business accounts.

## What the Scripts Do

### populate_new_venues.sql

1. **Inserts 10 test venues** into the `venues` table with all required fields
2. **Creates business accounts** in `venue_business_accounts` with:
   - Recent `created_at` timestamps (1-20 days ago)
   - `account_status` = 'active'
   - `verification_status` = 'verified'
   - `subscription_tier` = 'basic'
3. **Verifies the results** by showing all created venues with their signup dates

### clear_new_venues.sql

1. **Deletes business accounts** for the test venues (respects foreign key constraints)
2. **Deletes the venues** themselves
3. **Verifies deletion** by counting remaining test venues (should be 0)

## Troubleshooting

### Venues not appearing in the spotlight

1. Check that the venues were created successfully by running the verification query at the end of `populate_new_venues.sql`
2. Ensure the signup dates are within the last 30 days
3. Pull to refresh on the Home screen to fetch new data
4. Check the console logs for any API errors

### Script fails to run

1. Ensure you're running the script in the Supabase SQL Editor (not in the app)
2. Check that you have the necessary permissions in your Supabase project
3. Verify that the `venues` and `venue_business_accounts` tables exist

### Duplicate venue errors

If you run the populate script multiple times, it will skip venues that already exist (using `ON CONFLICT DO NOTHING`). To start fresh, run the clear script first.

## Notes

- The test venues use real Unsplash image URLs for realistic appearance
- All venues are located in San Francisco, CA for consistency
- Ratings vary from 0 (brand new, no reviews) to 4.9
- Price ranges vary from $ to $$$
- The scripts are idempotent - safe to run multiple times
