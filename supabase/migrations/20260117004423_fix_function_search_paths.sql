-- Fix search_path for all functions to prevent security issues
-- This prevents search_path hijacking attacks

ALTER FUNCTION public.mark_full_flash_offers() SET search_path = public, extensions;
ALTER FUNCTION public.are_friends(uuid, uuid) SET search_path = public, extensions;
ALTER FUNCTION public.get_nearby_venues(numeric, numeric, numeric, integer) SET search_path = public, extensions;
ALTER FUNCTION public.update_notification_reports_updated_at() SET search_path = public, extensions;
ALTER FUNCTION public.expire_flash_offers() SET search_path = public, extensions;
ALTER FUNCTION public.update_flash_offers_updated_at() SET search_path = public, extensions;
ALTER FUNCTION public.create_business_account_on_approval() SET search_path = public, extensions;
ALTER FUNCTION public.activate_scheduled_flash_offers() SET search_path = public, extensions;
ALTER FUNCTION public.get_activity_feed(uuid, integer, integer) SET search_path = public, extensions;
ALTER FUNCTION public.create_default_privacy_settings() SET search_path = public, extensions;
ALTER FUNCTION public.get_friends(uuid) SET search_path = public, extensions;
ALTER FUNCTION public.claim_flash_offer_atomic(uuid, uuid, character varying, timestamp with time zone) SET search_path = public, extensions;
ALTER FUNCTION public.expire_flash_offer_claims() SET search_path = public, extensions;
ALTER FUNCTION public.update_venue_contributions_updated_at() SET search_path = public, extensions;
ALTER FUNCTION public.get_mutual_friends(uuid, uuid) SET search_path = public, extensions;
ALTER FUNCTION public.is_close_friend(uuid, uuid) SET search_path = public, extensions;
ALTER FUNCTION public.get_friend_count(uuid) SET search_path = public, extensions;
ALTER FUNCTION public.auto_checkout_old_checkins() SET search_path = public, extensions;
ALTER FUNCTION public.handle_new_user() SET search_path = public, extensions;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, extensions;
ALTER FUNCTION public.update_device_tokens_updated_at() SET search_path = public, extensions;;
