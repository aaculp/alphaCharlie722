-- Migration: Create venue reviews and ratings system tables
-- Description: Implements star ratings, written reviews, helpful votes, venue responses, and content moderation
-- Requirements: Venue Reviews & Ratings System (Requirements 14.1, 14.8, 15.1)

-- ============================================================================
-- Reviews Table
-- ============================================================================
-- Stores user reviews with star ratings and optional text
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    venue_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    -- Review content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT, -- Optional, max 500 chars enforced in app
    
    -- Verification and engagement
    is_verified BOOLEAN DEFAULT false, -- User checked in before reviewing
    helpful_count INTEGER DEFAULT 0 CHECK (helpful_count >= 0),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT unique_user_venue_review UNIQUE (user_id, venue_id),
    CONSTRAINT review_text_length CHECK (review_text IS NULL OR char_length(review_text) <= 500)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_venue_id ON public.reviews(venue_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_helpful_count ON public.reviews(helpful_count DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_verified ON public.reviews(is_verified) WHERE is_verified = true;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_reviews_venue_rating ON public.reviews(venue_id, rating);
CREATE INDEX IF NOT EXISTS idx_reviews_venue_created ON public.reviews(venue_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_venue_helpful ON public.reviews(venue_id, helpful_count DESC);

-- Comments
COMMENT ON TABLE public.reviews IS 'User reviews with star ratings and optional text for venues';
COMMENT ON COLUMN public.reviews.venue_id IS 'Reference to the venue being reviewed';
COMMENT ON COLUMN public.reviews.user_id IS 'User who submitted the review';
COMMENT ON COLUMN public.reviews.rating IS 'Star rating from 1 to 5';
COMMENT ON COLUMN public.reviews.review_text IS 'Optional written review (max 500 characters)';
COMMENT ON COLUMN public.reviews.is_verified IS 'True if user checked in to venue before reviewing';
COMMENT ON COLUMN public.reviews.helpful_count IS 'Number of users who marked this review as helpful';

-- ============================================================================
-- Helpful Votes Table
-- ============================================================================
-- Tracks which users found which reviews helpful
CREATE TABLE IF NOT EXISTS public.helpful_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT unique_user_review_vote UNIQUE (user_id, review_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_helpful_votes_review_id ON public.helpful_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_helpful_votes_user_id ON public.helpful_votes(user_id);

-- Comments
COMMENT ON TABLE public.helpful_votes IS 'Tracks which users found which reviews helpful';
COMMENT ON COLUMN public.helpful_votes.review_id IS 'Reference to the review';
COMMENT ON COLUMN public.helpful_votes.user_id IS 'User who marked the review as helpful';

-- ============================================================================
-- Venue Responses Table
-- ============================================================================
-- Stores venue owner responses to customer reviews
CREATE TABLE IF NOT EXISTS public.venue_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL,
    response_text TEXT NOT NULL CHECK (char_length(response_text) > 0 AND char_length(response_text) <= 300),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT unique_review_response UNIQUE (review_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_venue_responses_review_id ON public.venue_responses(review_id);
CREATE INDEX IF NOT EXISTS idx_venue_responses_venue_id ON public.venue_responses(venue_id);

-- Comments
COMMENT ON TABLE public.venue_responses IS 'Venue owner responses to customer reviews';
COMMENT ON COLUMN public.venue_responses.review_id IS 'Reference to the review being responded to';
COMMENT ON COLUMN public.venue_responses.venue_id IS 'Reference to the venue (for ownership verification)';
COMMENT ON COLUMN public.venue_responses.response_text IS 'Response text (max 300 characters)';

-- ============================================================================
-- Review Reports Table
-- ============================================================================
-- Stores user reports of inappropriate reviews for moderation
CREATE TABLE IF NOT EXISTS public.review_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    reporter_user_id UUID NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('spam', 'offensive', 'fake', 'other')),
    details TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT unique_user_review_report UNIQUE (reporter_user_id, review_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_review_reports_review_id ON public.review_reports(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_status ON public.review_reports(status);
CREATE INDEX IF NOT EXISTS idx_review_reports_pending ON public.review_reports(status) WHERE status = 'pending';

-- Comments
COMMENT ON TABLE public.review_reports IS 'User reports of inappropriate reviews for moderation';
COMMENT ON COLUMN public.review_reports.review_id IS 'Reference to the reported review';
COMMENT ON COLUMN public.review_reports.reporter_user_id IS 'User who submitted the report';
COMMENT ON COLUMN public.review_reports.reason IS 'Report reason: spam, offensive, fake, other';
COMMENT ON COLUMN public.review_reports.details IS 'Optional additional details about the report';
COMMENT ON COLUMN public.review_reports.status IS 'Moderation status: pending, reviewed, resolved, dismissed';

-- ============================================================================
-- Update Venues Table
-- ============================================================================
-- Add aggregate rating columns to existing venues table (if it exists)
DO $$ 
BEGIN
    -- Check if venues table exists before altering it
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'venues') THEN
        -- Add columns if they don't exist
        ALTER TABLE public.venues 
        ADD COLUMN IF NOT EXISTS aggregate_rating NUMERIC(2,1) DEFAULT 0.0 CHECK (aggregate_rating >= 0 AND aggregate_rating <= 5),
        ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0 CHECK (review_count >= 0);

        -- Index for sorting by rating
        CREATE INDEX IF NOT EXISTS idx_venues_aggregate_rating ON public.venues(aggregate_rating DESC);

        -- Comments
        COMMENT ON COLUMN public.venues.aggregate_rating IS 'Average star rating from all reviews (0.0 to 5.0)';
        COMMENT ON COLUMN public.venues.review_count IS 'Total number of reviews for this venue';
        
        RAISE NOTICE 'Venues table updated with aggregate_rating and review_count columns';
    ELSE
        RAISE NOTICE 'Venues table does not exist - skipping venue table updates';
    END IF;
END $$;

-- ============================================================================
-- Database Triggers
-- ============================================================================

-- Function to update venue aggregate rating and review count
CREATE OR REPLACE FUNCTION update_venue_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if venues table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'venues') THEN
        -- Recalculate aggregate rating and review count for the venue
        UPDATE public.venues
        SET 
            aggregate_rating = COALESCE(
                (SELECT ROUND(AVG(rating)::numeric, 1) 
                 FROM public.reviews 
                 WHERE venue_id = COALESCE(NEW.venue_id, OLD.venue_id)),
                0.0
            ),
            review_count = COALESCE(
                (SELECT COUNT(*) 
                 FROM public.reviews 
                 WHERE venue_id = COALESCE(NEW.venue_id, OLD.venue_id)),
                0
            )
        WHERE id = COALESCE(NEW.venue_id, OLD.venue_id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger on INSERT
CREATE TRIGGER trigger_update_venue_rating_on_insert
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_venue_rating();

-- Trigger on UPDATE (only when rating changes)
CREATE TRIGGER trigger_update_venue_rating_on_update
AFTER UPDATE OF rating ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_venue_rating();

-- Trigger on DELETE
CREATE TRIGGER trigger_update_venue_rating_on_delete
AFTER DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_venue_rating();

-- Function to update helpful count on reviews
CREATE OR REPLACE FUNCTION update_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate helpful count for the review
    UPDATE public.reviews
    SET helpful_count = (
        SELECT COUNT(*) 
        FROM public.helpful_votes 
        WHERE review_id = COALESCE(NEW.review_id, OLD.review_id)
    )
    WHERE id = COALESCE(NEW.review_id, OLD.review_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger on INSERT
CREATE TRIGGER trigger_update_helpful_count_on_insert
AFTER INSERT ON public.helpful_votes
FOR EACH ROW
EXECUTE FUNCTION update_helpful_count();

-- Trigger on DELETE
CREATE TRIGGER trigger_update_helpful_count_on_delete
AFTER DELETE ON public.helpful_votes
FOR EACH ROW
EXECUTE FUNCTION update_helpful_count();

-- Function to set verified status based on check-in history
CREATE OR REPLACE FUNCTION set_verified_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user has checked in to this venue (only if check_ins table exists)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'check_ins') THEN
        NEW.is_verified := EXISTS (
            SELECT 1 
            FROM public.check_ins 
            WHERE user_id = NEW.user_id 
            AND venue_id = NEW.venue_id
        );
    ELSE
        -- Default to false if check_ins table doesn't exist
        NEW.is_verified := false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on INSERT
CREATE TRIGGER trigger_set_verified_status
BEFORE INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION set_verified_status();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for reviews
CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();

-- Trigger for venue_responses
CREATE TRIGGER venue_responses_updated_at
  BEFORE UPDATE ON public.venue_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Reviews Table RLS Policies
-- ============================================================================

-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews" 
ON public.reviews FOR SELECT 
USING (true);

-- Authenticated users can create reviews (one per venue)
CREATE POLICY "Authenticated users can create reviews" 
ON public.reviews FOR INSERT 
WITH CHECK (
    auth.role() = 'authenticated' 
    AND auth.uid() = user_id
);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews" 
ON public.reviews FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews" 
ON public.reviews FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================================================
-- Helpful Votes Table RLS Policies
-- ============================================================================

-- Anyone can view helpful votes
CREATE POLICY "Anyone can view helpful votes" 
ON public.helpful_votes FOR SELECT 
USING (true);

-- Authenticated users can create helpful votes
CREATE POLICY "Authenticated users can create helpful votes" 
ON public.helpful_votes FOR INSERT 
WITH CHECK (
    auth.role() = 'authenticated' 
    AND auth.uid() = user_id
);

-- Users can delete their own helpful votes
CREATE POLICY "Users can delete own helpful votes" 
ON public.helpful_votes FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================================================
-- Venue Responses Table RLS Policies
-- ============================================================================

-- Anyone can view venue responses
CREATE POLICY "Anyone can view venue responses" 
ON public.venue_responses FOR SELECT 
USING (true);

-- Venue owners can create responses
CREATE POLICY "Venue owners can create responses" 
ON public.venue_responses FOR INSERT 
WITH CHECK (
    auth.role() = 'authenticated' 
    AND EXISTS (
        SELECT 1 FROM public.venue_business_accounts vba
        JOIN public.venues v ON v.id = vba.venue_id
        WHERE v.id = venue_id 
        AND vba.user_id = auth.uid()
    )
);

-- Venue owners can update their responses
CREATE POLICY "Venue owners can update responses" 
ON public.venue_responses FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.venue_business_accounts vba
        JOIN public.venues v ON v.id = vba.venue_id
        WHERE v.id = venue_id 
        AND vba.user_id = auth.uid()
    )
);

-- Venue owners can delete their responses
CREATE POLICY "Venue owners can delete responses" 
ON public.venue_responses FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.venue_business_accounts vba
        JOIN public.venues v ON v.id = vba.venue_id
        WHERE v.id = venue_id 
        AND vba.user_id = auth.uid()
    )
);

-- ============================================================================
-- Review Reports Table RLS Policies
-- ============================================================================

-- Users can view their own reports
CREATE POLICY "Users can view own reports" 
ON public.review_reports FOR SELECT 
USING (auth.uid() = reporter_user_id);

-- Authenticated users can create reports
CREATE POLICY "Authenticated users can create reports" 
ON public.review_reports FOR INSERT 
WITH CHECK (
    auth.role() = 'authenticated' 
    AND auth.uid() = reporter_user_id
);

-- ============================================================================
-- Grant Permissions
-- ============================================================================

-- Grant permissions for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.helpful_votes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.venue_responses TO authenticated;
GRANT SELECT, INSERT ON public.review_reports TO authenticated;

-- Grant read-only permissions for anonymous users
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT ON public.helpful_votes TO anon;
GRANT SELECT ON public.venue_responses TO anon;

-- Success message
SELECT 'Venue reviews and ratings system tables created successfully!' as message;
