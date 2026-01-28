-- Explicitly set views to SECURITY INVOKER
ALTER VIEW public.venue_contribution_counts SET (security_invoker = true);
ALTER VIEW public.flash_offers_expiration_summary SET (security_invoker = true);;
