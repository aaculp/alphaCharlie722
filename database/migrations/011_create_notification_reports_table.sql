-- Migration 011: Create notification_reports table
-- Purpose: Allow users to report inappropriate notifications
-- Requirement: 15.9 - Allow users to report inappropriate notifications

-- Create notification_reports table
CREATE TABLE IF NOT EXISTS notification_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id UUID NOT NULL REFERENCES social_notifications(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  reason VARCHAR(50) NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'misleading', 'other')),
  details TEXT,
  notification_content JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX idx_notification_reports_notification ON notification_reports(notification_id);
CREATE INDEX idx_notification_reports_reporter ON notification_reports(reporter_id);
CREATE INDEX idx_notification_reports_reported_user ON notification_reports(reported_user_id);
CREATE INDEX idx_notification_reports_status ON notification_reports(status);
CREATE INDEX idx_notification_reports_created_at ON notification_reports(created_at DESC);

-- Prevent duplicate reports for the same notification by the same user
CREATE UNIQUE INDEX idx_notification_reports_unique ON notification_reports(notification_id, reporter_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_reports_updated_at
  BEFORE UPDATE ON notification_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_reports_updated_at();

-- Row Level Security (RLS) Policies
ALTER TABLE notification_reports ENABLE ROW LEVEL SECURITY;

-- Users can view their own reports
CREATE POLICY notification_reports_select_own
  ON notification_reports
  FOR SELECT
  USING (auth.uid() = reporter_id);

-- Users can create reports for notifications they received
CREATE POLICY notification_reports_insert_own
  ON notification_reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Users can update their own pending reports (e.g., add details)
CREATE POLICY notification_reports_update_own
  ON notification_reports
  FOR UPDATE
  USING (auth.uid() = reporter_id AND status = 'pending');

-- Admins can view all reports (requires admin role - to be implemented)
-- CREATE POLICY notification_reports_admin_all
--   ON notification_reports
--   FOR ALL
--   USING (auth.jwt() ->> 'role' = 'admin');

-- Grant permissions
GRANT SELECT, INSERT ON notification_reports TO authenticated;
GRANT UPDATE (details, updated_at) ON notification_reports TO authenticated;

-- Comments for documentation
COMMENT ON TABLE notification_reports IS 'Stores user reports of inappropriate notifications for compliance and moderation';
COMMENT ON COLUMN notification_reports.notification_id IS 'ID of the notification being reported';
COMMENT ON COLUMN notification_reports.reporter_id IS 'ID of the user filing the report';
COMMENT ON COLUMN notification_reports.reported_user_id IS 'ID of the user who sent the notification';
COMMENT ON COLUMN notification_reports.notification_type IS 'Type of notification (friend_request, venue_share, etc.)';
COMMENT ON COLUMN notification_reports.reason IS 'Reason for reporting (spam, harassment, inappropriate, misleading, other)';
COMMENT ON COLUMN notification_reports.details IS 'Optional additional details provided by the reporter';
COMMENT ON COLUMN notification_reports.notification_content IS 'Snapshot of the notification content at time of report';
COMMENT ON COLUMN notification_reports.status IS 'Status of the report (pending, reviewing, resolved, dismissed)';
COMMENT ON COLUMN notification_reports.admin_notes IS 'Notes added by administrators during review';
COMMENT ON COLUMN notification_reports.reviewed_by IS 'ID of the admin who reviewed the report';
COMMENT ON COLUMN notification_reports.reviewed_at IS 'Timestamp when the report was reviewed';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration 011 completed: notification_reports table created successfully';
END $$;
