-- Fix the admin policy and consolidate duplicate policies

-- 1. Fix admin policy on venue_applications
DROP POLICY IF EXISTS "Admins can manage all venue applications" ON public.venue_applications;
CREATE POLICY "Admins can manage all venue applications"
  ON public.venue_applications
  FOR ALL
  USING ((SELECT auth.jwt()->>'role') = 'admin');

-- 2. Consolidate venue_business_accounts duplicate SELECT policies
DROP POLICY IF EXISTS "Allow public read access to venue business accounts" ON public.venue_business_accounts;
DROP POLICY IF EXISTS "Venue owners can view their own business accounts" ON public.venue_business_accounts;
CREATE POLICY "View venue business accounts"
  ON public.venue_business_accounts
  FOR SELECT
  USING (true OR (SELECT auth.uid()) = owner_user_id);

-- 3. Consolidate venues duplicate SELECT policies
DROP POLICY IF EXISTS "Allow public read access to venues" ON public.venues;
DROP POLICY IF EXISTS "Anyone can view venues" ON public.venues;
DROP POLICY IF EXISTS "venues_public_read" ON public.venues;
CREATE POLICY "Anyone can view venues"
  ON public.venues
  FOR SELECT
  USING (true);;
