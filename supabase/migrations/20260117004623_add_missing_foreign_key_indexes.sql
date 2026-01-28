-- Add indexes for unindexed foreign keys to improve join performance

CREATE INDEX IF NOT EXISTS idx_activity_feed_collection_id 
  ON public.activity_feed(collection_id);

CREATE INDEX IF NOT EXISTS idx_notification_reports_reviewed_by 
  ON public.notification_reports(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_social_notifications_actor_id 
  ON public.social_notifications(actor_id);

CREATE INDEX IF NOT EXISTS idx_venue_applications_owner_user_id 
  ON public.venue_applications(owner_user_id);

CREATE INDEX IF NOT EXISTS idx_venue_applications_reviewed_by 
  ON public.venue_applications(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_venue_business_accounts_application_id 
  ON public.venue_business_accounts(application_id);

CREATE INDEX IF NOT EXISTS idx_venue_push_notifications_venue_business_account_id 
  ON public.venue_push_notifications(venue_business_account_id);;
