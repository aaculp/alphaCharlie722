-- Fix the remaining security issues

-- 1. Enable RLS on flash_offers_expiration_log
ALTER TABLE public.flash_offers_expiration_log ENABLE ROW LEVEL SECURITY;

-- Add policy for viewing logs (admin/service role only in practice)
CREATE POLICY "Service can manage expiration logs"
  ON public.flash_offers_expiration_log
  FOR ALL
  USING (false)  -- No direct user access, service role bypasses RLS
  WITH CHECK (false);

-- 2. Fix search_path for new functions
ALTER FUNCTION public.run_flash_offers_expiration_job() SET search_path = public, extensions;
ALTER FUNCTION public.run_flash_offers_expiration_job_with_logging() SET search_path = public, extensions;

-- 3. Recreate flash_offers_expiration_summary view without SECURITY DEFINER
DROP VIEW IF EXISTS public.flash_offers_expiration_summary CASCADE;

CREATE VIEW public.flash_offers_expiration_summary AS
SELECT 
  created_at,
  offers_activated,
  offers_expired,
  offers_marked_full,
  claims_expired,
  execution_time,
  CASE
    WHEN array_length(errors, 1) > 0 THEN 'Has Errors'::text
    ELSE 'Success'::text
  END AS status,
  errors
FROM flash_offers_expiration_log
ORDER BY created_at DESC;

GRANT SELECT ON public.flash_offers_expiration_summary TO authenticated;

-- 4. Recreate venue_contribution_counts without SECURITY DEFINER
DROP VIEW IF EXISTS public.venue_contribution_counts CASCADE;

CREATE VIEW public.venue_contribution_counts AS
SELECT 
  venue_id,
  contribution_type,
  option_text,
  count(*) AS count,
  max(created_at) AS last_contributed
FROM venue_contributions
GROUP BY venue_id, contribution_type, option_text
ORDER BY venue_id, contribution_type, count(*) DESC;

GRANT SELECT ON public.venue_contribution_counts TO authenticated, anon;;
