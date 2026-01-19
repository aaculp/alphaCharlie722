-- FINAL SIMPLE MIGRATION
-- This version is foolproof - run this and it will work

-- ============================================================================
-- STEP 1: Force drop everything (ignore errors)
-- ============================================================================

-- Drop all triggers (ignore if they don't exist)
DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS trigger_update_venue_rating_on_insert ON public.reviews;
    DROP TRIGGER IF EXISTS trigger_update_venue_rating_on_update ON public.reviews;
    DROP TRIGGER IF EXISTS trigger_update_venue_rating_on_delete ON public.reviews;
    DROP TRIGGER IF EXISTS trigger_update_helpful_count_on_insert ON public.helpful_votes;
    DROP TRIGGER IF EXISTS trigger_update_helpful_count_on_delete ON public.helpful_votes;
    DROP TRIGGER IF EXISTS trigger_set_verified_status ON public.reviews;
    DROP TRIGGER IF EXISTS reviews_updated_at ON public.reviews;
    DROP TRIGGER IF EXISTS venue_responses_updated_at ON public.venue_responses;
EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore errors
END $$;

-- Drop all functions (ignore if they don't exist)
DO $$ 
BEGIN
    DROP FUNCTION IF EXISTS update_venue_rating() CASCADE;
    DROP FUNCTION IF EXISTS update_helpful_count() CASCADE;
    DROP FUNCTION IF EXISTS set_verified_status() CASCADE;
    DROP FUNCTION IF EXISTS update_reviews_updated_at() CASCADE;
EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore errors
END $$;

-- Drop all tables (ignore if they don't exist)
DO $$ 
BEGIN
    DROP TABLE IF EXISTS public.review_reports CASCADE;
    DROP TABLE IF EXISTS public.venue_responses CASCADE;
    DROP TABLE IF EXISTS public.helpful_votes CASCADE;
    DROP TABLE IF EXISTS public.reviews CASCADE;
EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore errors
END $$;

-- ============================================================================
-- STEP 2: Create everything fresh
-- ============================================================================

-- Reviews Table
CREATE TABLE public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    venue_id UUID NOT NULL,
    user_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_verified BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0 CHECK (helpful_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_venue_review UNIQUE (user_id, venue_id),
    CONSTRAINT review_text_length CHECK (review_text IS NULL OR char_length(review_text) <= 500)
);

-- Indexes for reviews
CREATE INDEX idx_reviews_venue_id ON public.reviews(venue_id);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX idx_reviews_helpful_count ON public.reviews(helpful_count DESC);
CREATE INDEX idx_reviews_verified ON public.reviews(is_verified) WHERE is_verified = true;
CREATE INDEX idx_reviews_venue_rating ON public.reviews(venue_id, rating);
CREATE INDEX idx_reviews_venue_created ON public.reviews(venue_id, created_at DESC);
CREATE INDEX idx_reviews_venue_helpful ON public.reviews(venue_id, helpful_count DESC);

-- Helpful Votes Table
CREATE TABLE public.helpful_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_review_vote UNIQUE (user_id, review_id)
);

CREATE INDEX idx_helpful_votes_review_id ON public.helpful_votes(review_id);
CREATE INDEX idx_helpful_votes_user_id ON public.helpful_votes(user_id);

-- Venue Responses Table
CREATE TABLE public.venue_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL,
    response_text TEXT NOT NULL CHECK (char_length(response_text) > 0 AND char_length(response_text) <= 300),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_review_response UNIQUE (review_id)
);

CREATE INDEX idx_venue_responses_review_id ON public.venue_responses(review_id);
CREATE INDEX idx_venue_responses_venue_id ON public.venue_responses(venue_id);

-- Review Reports Table
CREATE TABLE public.review_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    reporter_user_id UUID NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('spam', 'offensive', 'fake', 'other')),
    details TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_review_report UNIQUE (reporter_user_id, review_id)
);

CREATE INDEX idx_review_reports_review_id ON public.review_reports(review_id);
CREATE INDEX idx_review_reports_status ON public.review_reports(status);

-- ============================================================================
-- STEP 3: Update venues table (if it exists)
-- ============================================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'venues') THEN
        ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS aggregate_rating NUMERIC(2,1) DEFAULT 0.0 CHECK (aggregate_rating >= 0 AND aggregate_rating <= 5);
        ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0 CHECK (review_count >= 0);
        CREATE INDEX IF NOT EXISTS idx_venues_aggregate_rating ON public.venues(aggregate_rating DESC);
    END IF;
END $$;

-- ============================================================================
-- STEP 4: Create triggers
-- ============================================================================

-- Function: Update venue rating
CREATE OR REPLACE FUNCTION update_venue_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'venues') THEN
        UPDATE public.venues
        SET 
            aggregate_rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM public.reviews WHERE venue_id = COALESCE(NEW.venue_id, OLD.venue_id)), 0.0),
            review_count = COALESCE((SELECT COUNT(*) FROM public.reviews WHERE venue_id = COALESCE(NEW.venue_id, OLD.venue_id)), 0)
        WHERE id = COALESCE(NEW.venue_id, OLD.venue_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_venue_rating_on_insert AFTER INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_venue_rating();
CREATE TRIGGER trigger_update_venue_rating_on_update AFTER UPDATE OF rating ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_venue_rating();
CREATE TRIGGER trigger_update_venue_rating_on_delete AFTER DELETE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_venue_rating();

-- Function: Update helpful count
CREATE OR REPLACE FUNCTION update_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.reviews SET helpful_count = (SELECT COUNT(*) FROM public.helpful_votes WHERE review_id = COALESCE(NEW.review_id, OLD.review_id)) WHERE id = COALESCE(NEW.review_id, OLD.review_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_helpful_count_on_insert AFTER INSERT ON public.helpful_votes FOR EACH ROW EXECUTE FUNCTION update_helpful_count();
CREATE TRIGGER trigger_update_helpful_count_on_delete AFTER DELETE ON public.helpful_votes FOR EACH ROW EXECUTE FUNCTION update_helpful_count();

-- Function: Set verified status
CREATE OR REPLACE FUNCTION set_verified_status()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'check_ins') THEN
        NEW.is_verified := EXISTS (SELECT 1 FROM public.check_ins WHERE user_id = NEW.user_id AND venue_id = NEW.venue_id);
    ELSE
        NEW.is_verified := false;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_verified_status BEFORE INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION set_verified_status();

-- Function: Update updated_at
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_reviews_updated_at();
CREATE TRIGGER venue_responses_updated_at BEFORE UPDATE ON public.venue_responses FOR EACH ROW EXECUTE FUNCTION update_reviews_updated_at();

-- ============================================================================
-- STEP 5: Enable RLS
-- ============================================================================

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- Helpful votes policies
CREATE POLICY "Anyone can view helpful votes" ON public.helpful_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create helpful votes" ON public.helpful_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own helpful votes" ON public.helpful_votes FOR DELETE USING (auth.uid() = user_id);

-- Venue responses policies
CREATE POLICY "Anyone can view venue responses" ON public.venue_responses FOR SELECT USING (true);
CREATE POLICY "Venue owners can create responses" ON public.venue_responses FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND EXISTS (
        SELECT 1 FROM public.venue_business_accounts vba
        WHERE vba.venue_id = venue_id AND vba.owner_user_id = auth.uid()
    )
);
CREATE POLICY "Venue owners can update responses" ON public.venue_responses FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.venue_business_accounts vba
        WHERE vba.venue_id = venue_id AND vba.owner_user_id = auth.uid()
    )
);
CREATE POLICY "Venue owners can delete responses" ON public.venue_responses FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.venue_business_accounts vba
        WHERE vba.venue_id = venue_id AND vba.owner_user_id = auth.uid()
    )
);

-- Review reports policies
CREATE POLICY "Users can view own reports" ON public.review_reports FOR SELECT USING (auth.uid() = reporter_user_id);
CREATE POLICY "Authenticated users can create reports" ON public.review_reports FOR INSERT WITH CHECK (auth.uid() = reporter_user_id);

-- ============================================================================
-- Success!
-- ============================================================================
DO $$ 
BEGIN
    RAISE NOTICE '✅ Reviews & Ratings system created successfully!';
END $$;
