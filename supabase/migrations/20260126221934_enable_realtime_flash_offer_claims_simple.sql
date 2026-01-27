-- Migration: Enable real-time subscriptions for flash offer claims
-- Description: Enables Supabase real-time for flash_offer_claims table to support instant claim status updates
-- Requirements: Real-Time Claim Feedback (Requirements 8.1, 8.2, 8.3, 8.4, 8.5)

-- Add flash_offer_claims table to the supabase_realtime publication
-- This allows clients to subscribe to real-time updates for claim status changes
ALTER PUBLICATION supabase_realtime ADD TABLE flash_offer_claims;

-- Success message
SELECT 'Real-time enabled for flash_offer_claims table successfully!' as message;
