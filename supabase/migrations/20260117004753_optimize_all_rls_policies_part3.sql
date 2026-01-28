-- Part 3: venue_contributions, venue_applications

-- VENUE_CONTRIBUTIONS
DROP POLICY IF EXISTS "Users can insert their own contributions" ON public.venue_contributions;
CREATE POLICY "Users can insert their own contributions"
  ON public.venue_contributions
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own contributions" ON public.venue_contributions;
CREATE POLICY "Users can update their own contributions"
  ON public.venue_contributions
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own contributions" ON public.venue_contributions;
CREATE POLICY "Users can delete their own contributions"
  ON public.venue_contributions
  FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- VENUE_APPLICATIONS
DROP POLICY IF EXISTS "Users can create their own venue applications" ON public.venue_applications;
CREATE POLICY "Users can create their own venue applications"
  ON public.venue_applications
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = owner_user_id);

DROP POLICY IF EXISTS "Users can view their own venue applications" ON public.venue_applications;
CREATE POLICY "Users can view their own venue applications"
  ON public.venue_applications
  FOR SELECT
  USING ((SELECT auth.uid()) = owner_user_id);

DROP POLICY IF EXISTS "Users can update their own pending applications" ON public.venue_applications;
CREATE POLICY "Users can update their own pending applications"
  ON public.venue_applications
  FOR UPDATE
  USING ((SELECT auth.uid()) = owner_user_id AND status = 'pending');

DROP POLICY IF EXISTS "Admins can manage all venue applications" ON public.venue_applications;
CREATE POLICY "Admins can manage all venue applications"
  ON public.venue_applications
  FOR ALL
  USING ((SELECT auth.jwt()->>'role') = 'admin');;
