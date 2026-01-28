-- Move PostGIS extension from public to extensions schema
-- Note: This requires recreating the extension

-- First check if extensions schema exists, create if not
CREATE SCHEMA IF NOT EXISTS extensions;

-- Drop the extension from public and recreate in extensions
DROP EXTENSION IF EXISTS postgis CASCADE;
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- Grant usage on extensions schema
GRANT USAGE ON SCHEMA extensions TO authenticated, anon;;
