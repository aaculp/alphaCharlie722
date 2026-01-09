# Database Setup Files

This directory contains SQL scripts for setting up the Supabase database for the venue discovery app.

## Setup Order

Run these scripts in your Supabase SQL Editor in the following order:

### 1. Core Database Setup
- **`safe-pulse-setup.sql`** - Creates user_tags and tag_likes tables for the Pulse community feedback system
- **`pulse-permissions.sql`** - Sets up Row Level Security (RLS) policies and permissions for Pulse tables

### 2. Check-in System
- **`checkin-database-setup.sql`** - Creates check_ins table for venue check-in/out functionality

### 3. Venue Contributions System
- **`clean-venue-contributions-setup.sql`** - Creates venue_contributions table for user-generated venue information (authentication required)

### 4. Venue Enhancements (Optional)
- **`add-max-capacity.sql`** - Adds max_capacity column to venues table for activity level calculation

### 4. Test Data (Optional)
- **`pulse-test-data-fixed.sql`** - Adds sample Pulse tags and likes for testing
- **`simulate-checkins.sql`** - Generates random check-ins for all venues for testing

## File Descriptions

### Core Tables
- **user_tags**: Community-generated tags for venues with like counts
- **tag_likes**: Individual user likes for tags (many-to-many relationship)
- **check_ins**: User check-ins/check-outs at venues with timestamps
- **venue_contributions**: User-generated venue information (wait times, mood, popular items, amenities) with contribution counts
- **venues**: Enhanced with max_capacity for activity level calculation

### Security
All tables use Row Level Security (RLS) with policies that:
- Allow public read access for tags, check-ins, and venue contributions
- Require authentication for creating/modifying data
- Ensure users can only modify their own data
- Venue contributions require authenticated users (no anonymous contributions)

### Performance
Includes optimized indexes for:
- Venue-based queries
- User-based queries  
- Like count sorting
- Time-based queries

## Usage Notes

1. Make sure you have venues populated in your database before running test data scripts
2. The Pulse system requires authenticated users to create tags and likes
3. Venue contributions require authenticated users (gamification strategy for quality control)
4. Check-ins automatically expire after 12 hours for data cleanup
5. All scripts are designed to be re-runnable (use IF NOT EXISTS, ON CONFLICT, etc.)