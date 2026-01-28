-- Drop and recreate the view without SECURITY DEFINER
DROP VIEW IF EXISTS public.venue_contribution_counts;

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

-- Grant appropriate permissions
GRANT SELECT ON public.venue_contribution_counts TO authenticated, anon;;
