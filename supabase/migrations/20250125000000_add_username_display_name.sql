-- Migration: Add username and display_name fields to profiles table
-- Date: 2025-01-25
-- Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7

-- Add username column (VARCHAR(30), UNIQUE, with CHECK constraint for format)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username VARCHAR(30) UNIQUE;

-- Add display_name column (VARCHAR(100))
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);

-- Add CHECK constraint for username format (lowercase alphanumeric and underscore only, 3-30 chars)
ALTER TABLE profiles
ADD CONSTRAINT username_format CHECK (
  username IS NULL OR (
    username ~ '^[a-z0-9_]{3,30}$'
  )
);

-- Create index on username for efficient search performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Create GIN index on display_name for full-text search performance
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON profiles USING gin(to_tsvector('english', COALESCE(display_name, '')));

-- Add trigger function to enforce lowercase username
CREATE OR REPLACE FUNCTION enforce_lowercase_username()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.username IS NOT NULL THEN
    NEW.username = LOWER(NEW.username);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce lowercase username on INSERT and UPDATE
DROP TRIGGER IF EXISTS trigger_enforce_lowercase_username ON profiles;
CREATE TRIGGER trigger_enforce_lowercase_username
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION enforce_lowercase_username();

-- Add comment for documentation
COMMENT ON COLUMN profiles.username IS 'Unique username for user search, lowercase alphanumeric and underscore only, 3-30 characters';
COMMENT ON COLUMN profiles.display_name IS 'User-friendly display name shown in UI, can include spaces and mixed case, up to 100 characters';
