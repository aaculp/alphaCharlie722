# Design Document: Venue Reviews & Ratings System

## Overview

The Venue Reviews & Ratings System enables users to submit star ratings (1-5) and optional written reviews for venues they've visited. The system integrates with the existing check-in flow, venue analytics dashboard, and home feed to provide social proof and valuable feedback. Reviews are displayed on venue detail screens, aggregated on venue cards, and analyzed in the venue owner dashboard.

### Key Design Goals

1. **Seamless Integration**: Reviews trigger naturally after check-out, integrating with existing check-in flow
2. **Performance**: Aggregate ratings cached and updated efficiently via database triggers
3. **Content Quality**: Automated profanity filtering with tiered moderation approach
4. **Social Proof**: Verified review badges for users who checked in before reviewing
5. **Engagement**: Helpful votes, venue owner responses, and quality indicators
6. **Analytics**: Real-time review data feeding into venue dashboard metrics

### Technology Stack

- **Frontend**: React Native with TypeScript
- **Backend**: Supabase (PostgreSQL + Row Level Security)
- **Content Moderation**: `bad-words` library (client-side) with optional Perspective API (backend)
- **Caching**: 5-minute TTL for review lists, immediate invalidation on new reviews
- **Real-time**: Supabase real-time subscriptions for live review updates

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile Application                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Review Modal │  │ Review List  │  │ Review Card  │     │
│  │  Component   │  │  Component   │  │  Component   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                            │                                │
│                   ┌────────▼────────┐                       │
│                   │  Review Service │                       │
│                   │  (API Layer)    │                       │
│                   └────────┬────────┘                       │
└────────────────────────────┼─────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Supabase API  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│  reviews table │  │  venues table   │  │ profiles table │
│  (new)         │  │  (updated)      │  │  (existing)    │
└────────────────┘  └─────────────────┘  └────────────────┘
        │
┌───────▼────────────────┐
│  Database Triggers     │
│  - update_venue_rating │
│  - update_review_count │
└────────────────────────┘
```

### Data Flow

1. **Review Submission**:
   - User checks out → Review prompt modal appears
   - User optionally selects current vibe (chips from venue card: Low-key, Vibey, Poppin, Lit, Maxed)
   - User selects rating (required) + optional text
   - Client-side profanity filter scans text
   - API validates and inserts review (vibe selection stored separately if provided)
   - Database trigger updates venue aggregate rating
   - Cache invalidated for venue reviews

2. **Review Display**:
   - Venue detail screen loads → Fetch cached reviews
   - Home feed loads → Fetch aggregate ratings for all venues
   - Real-time subscription updates reviews when new ones arrive

3. **Analytics Integration**:
   - Venue dashboard queries reviews table for today's/weekly ratings
   - Aggregate rating displayed in "Today's Performance" section
   - Recent reviews shown in activity feed

## Components and Interfaces

### Frontend Components

#### 1. ReviewSubmissionModal

**Purpose**: Modal for submitting new reviews or editing existing ones

**Props**:
```typescript
interface ReviewSubmissionModalProps {
  visible: boolean;
  onClose: () => void;
  venueId: string;
  venueName: string;
  existingReview?: Review; // For editing
  onSubmitSuccess: () => void;
}
```

**Features**:
- 5-star rating selector (required)
- Text input with 500 character limit and counter
- Character counter changes color at 450 chars (warning)
- Real-time profanity filtering with censoring
- Submit button disabled until rating selected
- Loading state during submission
- Error handling with retry option

#### 2. ReviewPromptModal

**Purpose**: Quick review prompt after check-out

**Props**:
```typescript
interface ReviewPromptModalProps {
  visible: boolean;
  onClose: () => void;
  venueId: string;
  venueName: string;
  onQuickRating: (rating: number, vibe?: string) => void;
  onFullReview: () => void;
}
```

**Features**:
- Optional vibe selection chips (Low-key, Vibey, Poppin, Lit, Maxed) - displayed first
- Compact 5-star selector (required)
- "Add written review" button (opens full modal)
- "Maybe later" dismiss option
- Auto-submit on star selection (vibe is optional, can be skipped)

#### 3. ReviewCard

**Purpose**: Display individual review in list

**Props**:
```typescript
interface ReviewCardProps {
  review: Review;
  onHelpfulToggle: (reviewId: string) => void;
  onEdit?: () => void; // Only for user's own reviews
  onDelete?: () => void; // Only for user's own reviews
  onReport?: () => void;
  onVenueResponse?: () => void; // Only for venue owners
  currentUserId?: string;
  isVenueOwner?: boolean;
}
```

**Features**:
- Reviewer name, profile picture, rating, timestamp
- Review text with "Read more" expansion for long reviews
- Verified badge for users who checked in
- Helpful button with vote count
- Edit/Delete options for own reviews
- Report option (three-dot menu)
- Venue owner response display

#### 4. ReviewList

**Purpose**: Paginated list of reviews with filtering/sorting

**Props**:
```typescript
interface ReviewListProps {
  venueId: string;
  currentUserId?: string;
  isVenueOwner?: boolean;
}
```

**Features**:
- Filter by rating (All, 5★, 4★, 3★, 2★, 1★)
- Sort by: Most Recent, Highest Rated, Lowest Rated, Most Helpful
- Pagination (20 reviews per page)
- Pull-to-refresh
- Empty state with "Be the first to review!" message
- Loading skeleton

#### 5. AggregateRatingDisplay

**Purpose**: Show aggregate rating and review count

**Props**:
```typescript
interface AggregateRatingDisplayProps {
  rating: number; // 0-5, one decimal place
  reviewCount: number;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
}
```

**Features**:
- Filled/half-filled/empty stars
- Numerical rating (e.g., "4.5")
- Review count (e.g., "(127 reviews)")
- Highlighted color for high ratings (4.5+)

### Backend API Endpoints

#### Review Service (`src/services/api/reviews.ts`)

```typescript
export class ReviewService {
  // Submit a new review
  static async submitReview(params: {
    venueId: string;
    userId: string;
    rating: number; // 1-5
    reviewText?: string; // Optional, max 500 chars
  }): Promise<Review>;

  // Update existing review
  static async updateReview(params: {
    reviewId: string;
    userId: string;
    rating: number;
    reviewText?: string;
  }): Promise<Review>;

  // Delete review
  static async deleteReview(reviewId: string, userId: string): Promise<void>;

  // Get reviews for a venue
  static async getVenueReviews(params: {
    venueId: string;
    limit?: number; // Default 20
    offset?: number; // Default 0
    sortBy?: 'recent' | 'highest' | 'lowest' | 'helpful'; // Default 'recent'
    filterRating?: 1 | 2 | 3 | 4 | 5; // Optional
    verifiedOnly?: boolean; // Optional
  }): Promise<{ reviews: Review[]; total: number; hasMore: boolean }>;

  // Get user's review for a venue
  static async getUserReviewForVenue(
    userId: string,
    venueId: string
  ): Promise<Review | null>;

  // Toggle helpful vote
  static async toggleHelpfulVote(
    reviewId: string,
    userId: string
  ): Promise<{ helpful: boolean; newCount: number }>;

  // Report review
  static async reportReview(params: {
    reviewId: string;
    userId: string;
    reason: 'spam' | 'offensive' | 'fake' | 'other';
    details?: string;
  }): Promise<void>;

  // Venue owner response
  static async submitVenueResponse(params: {
    reviewId: string;
    venueId: string;
    responseText: string; // Max 300 chars
  }): Promise<VenueResponse>;

  // Update venue response
  static async updateVenueResponse(params: {
    responseId: string;
    venueId: string;
    responseText: string;
  }): Promise<VenueResponse>;

  // Delete venue response
  static async deleteVenueResponse(
    responseId: string,
    venueId: string
  ): Promise<void>;

  // Check if user has checked in to venue (for verified badge)
  static async hasUserCheckedIn(
    userId: string,
    venueId: string
  ): Promise<boolean>;
}
```

### Content Moderation Service

```typescript
export class ContentModerationService {
  // Filter profanity in review text
  static filterProfanity(text: string): {
    filtered: string;
    hadProfanity: boolean;
    severity: 'none' | 'mild' | 'severe';
  };

  // Validate review text
  static validateReviewText(text: string): {
    valid: boolean;
    error?: string;
  };

  // Check for hate speech/threats (severe content)
  static containsSevereContent(text: string): boolean;
}
```

## Data Models

### Database Schema

#### reviews table (NEW)

```sql
CREATE TABLE public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT, -- Optional, max 500 chars enforced in app
    is_verified BOOLEAN DEFAULT false, -- User checked in before reviewing
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT unique_user_venue_review UNIQUE (user_id, venue_id),
    CONSTRAINT review_text_length CHECK (char_length(review_text) <= 500)
);

-- Indexes
CREATE INDEX idx_reviews_venue_id ON public.reviews(venue_id);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX idx_reviews_helpful_count ON public.reviews(helpful_count DESC);
CREATE INDEX idx_reviews_verified ON public.reviews(is_verified) WHERE is_verified = true;

-- Composite indexes for common queries
CREATE INDEX idx_reviews_venue_rating ON public.reviews(venue_id, rating);
CREATE INDEX idx_reviews_venue_created ON public.reviews(venue_id, created_at DESC);
CREATE INDEX idx_reviews_venue_helpful ON public.reviews(venue_id, helpful_count DESC);
```

#### helpful_votes table (NEW)

```sql
CREATE TABLE public.helpful_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT unique_user_review_vote UNIQUE (user_id, review_id)
);

-- Indexes
CREATE INDEX idx_helpful_votes_review_id ON public.helpful_votes(review_id);
CREATE INDEX idx_helpful_votes_user_id ON public.helpful_votes(user_id);
```

#### venue_responses table (NEW)

```sql
CREATE TABLE public.venue_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    response_text TEXT NOT NULL CHECK (char_length(response_text) <= 300),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT unique_review_response UNIQUE (review_id)
);

-- Indexes
CREATE INDEX idx_venue_responses_review_id ON public.venue_responses(review_id);
CREATE INDEX idx_venue_responses_venue_id ON public.venue_responses(venue_id);
```

#### review_reports table (NEW)

```sql
CREATE TABLE public.review_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    reporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (reason IN ('spam', 'offensive', 'fake', 'other')),
    details TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT unique_user_review_report UNIQUE (reporter_user_id, review_id)
);

-- Indexes
CREATE INDEX idx_review_reports_review_id ON public.review_reports(review_id);
CREATE INDEX idx_review_reports_status ON public.review_reports(status);
```

#### venues table (UPDATED)

```sql
-- Add new columns to existing venues table
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS aggregate_rating NUMERIC(2,1) DEFAULT 0.0 CHECK (aggregate_rating >= 0 AND aggregate_rating <= 5),
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0 CHECK (review_count >= 0);

-- Index for sorting by rating
CREATE INDEX IF NOT EXISTS idx_venues_aggregate_rating ON public.venues(aggregate_rating DESC);
```

### Database Triggers

#### Update Venue Aggregate Rating

```sql
CREATE OR REPLACE FUNCTION update_venue_rating()
RETURNS TRIGGER AS $$
BEGIN
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
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger on INSERT, UPDATE, DELETE
CREATE TRIGGER trigger_update_venue_rating_on_insert
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_venue_rating();

CREATE TRIGGER trigger_update_venue_rating_on_update
AFTER UPDATE OF rating ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_venue_rating();

CREATE TRIGGER trigger_update_venue_rating_on_delete
AFTER DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_venue_rating();
```

#### Update Helpful Count

```sql
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

-- Trigger on INSERT, DELETE
CREATE TRIGGER trigger_update_helpful_count_on_insert
AFTER INSERT ON public.helpful_votes
FOR EACH ROW
EXECUTE FUNCTION update_helpful_count();

CREATE TRIGGER trigger_update_helpful_count_on_delete
AFTER DELETE ON public.helpful_votes
FOR EACH ROW
EXECUTE FUNCTION update_helpful_count();
```

#### Set Verified Status

```sql
CREATE OR REPLACE FUNCTION set_verified_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user has checked in to this venue
    NEW.is_verified := EXISTS (
        SELECT 1 
        FROM public.check_ins 
        WHERE user_id = NEW.user_id 
        AND venue_id = NEW.venue_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on INSERT
CREATE TRIGGER trigger_set_verified_status
BEFORE INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION set_verified_status();
```

### Row Level Security (RLS) Policies

#### reviews table

```sql
-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

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
```

#### helpful_votes table

```sql
-- Enable RLS
ALTER TABLE public.helpful_votes ENABLE ROW LEVEL SECURITY;

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
```

#### venue_responses table

```sql
-- Enable RLS
ALTER TABLE public.venue_responses ENABLE ROW LEVEL SECURITY;

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
```

#### review_reports table

```sql
-- Enable RLS
ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;

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
```

### TypeScript Interfaces

```typescript
// Review types
export interface Review {
  id: string;
  venue_id: string;
  user_id: string;
  rating: number; // 1-5
  review_text?: string;
  is_verified: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  
  // Joined data (optional)
  reviewer?: {
    id: string;
    display_name: string;
    profile_picture_url?: string;
  };
  venue_response?: VenueResponse;
  user_has_voted_helpful?: boolean; // For current user
}

export interface VenueResponse {
  id: string;
  review_id: string;
  venue_id: string;
  response_text: string;
  created_at: string;
  updated_at: string;
}

export interface HelpfulVote {
  id: string;
  review_id: string;
  user_id: string;
  created_at: string;
}

export interface ReviewReport {
  id: string;
  review_id: string;
  reporter_user_id: string;
  reason: 'spam' | 'offensive' | 'fake' | 'other';
  details?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
}

// API request/response types
export interface SubmitReviewParams {
  venueId: string;
  userId: string;
  rating: number;
  reviewText?: string;
}

export interface GetVenueReviewsParams {
  venueId: string;
  limit?: number;
  offset?: number;
  sortBy?: 'recent' | 'highest' | 'lowest' | 'helpful';
  filterRating?: 1 | 2 | 3 | 4 | 5;
  verifiedOnly?: boolean;
}

export interface GetVenueReviewsResponse {
  reviews: Review[];
  total: number;
  hasMore: boolean;
}

export interface AggregateRating {
  rating: number; // 0-5, one decimal place
  reviewCount: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Core Review Submission Properties

**Property 1: Review submission requires authentication and rating**
*For any* review submission attempt, the system should reject it if the user is not authenticated OR if no rating (1-5) is provided, and should accept it if both conditions are met.
**Validates: Requirements 1.7, 1.8**

**Property 2: One review per user per venue**
*For any* user-venue pair, the system should allow exactly one review to exist, preventing duplicate submissions and allowing updates to existing reviews.
**Validates: Requirements 1.11**

**Property 3: Review text validation**
*For any* review text input, the system should trim leading/trailing whitespace, reject text that is only whitespace, reject text exceeding 500 characters, and accept valid text within the limit.
**Validates: Requirements 13.2, 13.6, 13.7**

**Property 4: Verified review status**
*For any* review submission, if the user has previously checked in to the venue, the review should be marked as verified (is_verified = true), otherwise it should be marked as not verified (is_verified = false).
**Validates: Requirements 8.1**

### Content Moderation Properties

**Property 5: Profanity filtering with tiered approach**
*For any* review text containing profanity, the system should censor mild profanity with asterisks, reject severe content (hate speech/threats), and allow normal content unchanged, while whitelisting venue-specific terms.
**Validates: Requirements 19.2, 19.3, 19.4, 19.5**

**Property 6: Moderation feedback**
*For any* review submission where content is censored, the system should notify the user that words were filtered, and for rejected submissions, should provide community guidelines.
**Validates: Requirements 19.6, 19.9**

### Review Display Properties

**Property 7: Review display completeness**
*For any* review displayed in the UI, the system should show all required fields: reviewer name, profile picture, rating (as stars), review text (if present), timestamp, helpful button with count, and verified badge (if applicable).
**Validates: Requirements 3.6, 3.7, 5.1, 8.2**

**Property 8: Review sorting**
*For any* list of reviews with a specified sort order (Most Recent, Highest Rated, Lowest Rated, Most Helpful), the reviews should be ordered correctly according to the selected criterion (created_at DESC, rating DESC, rating ASC, helpful_count DESC respectively).
**Validates: Requirements 3.9, 4.3, 5.7**

**Property 9: Review filtering**
*For any* rating filter selection (1-5 stars), the system should display only reviews matching that exact rating value, and should display all reviews when "All Ratings" is selected.
**Validates: Requirements 4.5**

**Property 10: Venue card rating display**
*For any* venue card displayed, the system should show the aggregate rating as filled stars with numerical value, review count in parentheses, and use highlighted color for ratings >= 4.5.
**Validates: Requirements 7.1, 7.2, 7.3, 7.6**

### Helpful Votes Properties

**Property 11: Helpful vote toggle behavior**
*For any* review, when a user taps "Helpful" twice in succession, the helpful count should return to its original value (idempotent toggle), and the button state should return to inactive.
**Validates: Requirements 5.2, 5.3**

**Property 12: Helpful vote tracking**
*For any* user-review pair, the system should track whether the user has voted helpful, prevent the user from voting on their own reviews, and display the button in active state only for reviews the user has voted helpful.
**Validates: Requirements 5.4, 5.5, 5.6**

### Review Editing and Deletion Properties

**Property 13: Review ownership permissions**
*For any* review, edit and delete options should be visible only when the current user is the review author, and edit/delete operations should succeed only for the review owner.
**Validates: Requirements 6.1**

**Property 14: Review update persistence**
*For any* review update, the system should save the new rating and/or text, update the updated_at timestamp to be later than created_at, and display an "Edited" indicator when updated_at > created_at.
**Validates: Requirements 6.3, 6.8**

**Property 15: Review deletion side effects**
*For any* review deletion, the system should remove the review from the database, decrement the venue's review_count by exactly 1, and recalculate the venue's aggregate_rating based on remaining reviews.
**Validates: Requirements 6.5, 6.6**

### Aggregate Rating Properties

**Property 16: Aggregate rating calculation**
*For any* venue, the aggregate_rating should equal the average of all review ratings for that venue (rounded to one decimal place), and the review_count should equal the total number of reviews for that venue.
**Validates: Requirements 11.2, 14.1**

**Property 17: Real-time rating updates**
*For any* review submission, update, or deletion, the venue's aggregate_rating and review_count should be recalculated immediately via database trigger, and venue cards should reflect the new rating.
**Validates: Requirements 14.2, 14.3, 7.7**

### Venue Owner Response Properties

**Property 18: Venue owner response permissions**
*For any* review, venue owners should be able to create, edit, and delete responses only for reviews of their own venue, and responses should be limited to 300 characters.
**Validates: Requirements 9.5, 9.7**

**Property 19: Response display and notification**
*For any* venue owner response submission, the system should save the response, display it below the review with "Response from [Venue Name]" label, show a "Responded" indicator on the review card, and send a notification to the reviewer.
**Validates: Requirements 9.3, 9.4, 9.8, 9.6**

### Review Reporting Properties

**Property 20: Report submission constraints**
*For any* user-review pair, the system should allow exactly one report to exist, preventing duplicate reports, and should create a moderation ticket record when a report is submitted.
**Validates: Requirements 10.4, 10.6**

**Property 21: Reported review visibility**
*For any* review that has been reported, the system should continue displaying the review (not hide it) until moderation is complete.
**Validates: Requirements 10.5**

### Notification Properties

**Property 22: Review event notifications**
*For any* review-related event (venue owner response, new review for venue owner), the system should send a push notification to the relevant user, and should batch notifications to a maximum of 1 per hour per venue.
**Validates: Requirements 12.1, 12.5, 12.6**

**Property 23: Helpful vote milestone notifications**
*For any* review, when the helpful_count reaches a milestone value (5, 10, 25, or 50), the system should send a notification to the review author.
**Validates: Requirements 12.2**

### Performance and Caching Properties

**Property 24: Review pagination**
*For any* request for venue reviews, the system should return at most 20 reviews per page, include a hasMore flag indicating if more reviews exist, and include the total count of reviews.
**Validates: Requirements 14.7**

**Property 25: Rate limiting**
*For any* user, the system should reject review submissions if the user has already submitted 5 or more reviews within the past hour.
**Validates: Requirements 18.5**

**Property 26: Concurrent submission handling**
*For any* set of concurrent review submissions for the same user-venue pair, exactly one review should be created, and the others should be rejected with a duplicate error.
**Validates: Requirements 18.7**

### Quality Indicator Properties

**Property 27: Review quality badges**
*For any* review, the system should display a "Detailed Review" badge if review_text length >= 200 characters, a "Top Review" badge if helpful_count >= 10, and should display reviewer badges ("Frequent Reviewer" if user has 10+ reviews, "Trusted Reviewer" if helpful vote ratio > 70%).
**Validates: Requirements 16.1, 16.2, 16.3, 16.4**

### UI Interaction Properties

**Property 28: Star rating selector behavior**
*For any* star position (1-5) tapped in the rating selector, the system should highlight that star and all stars to the left, and should enable the text input field.
**Validates: Requirements 1.4, 1.5**

**Property 29: Review prompt display logic**
*For any* check-out event, the system should display the review prompt modal exactly once if the user has not already reviewed the venue, and should not display the prompt if the user has already reviewed the venue.
**Validates: Requirements 2.7, 2.8**

**Property 30: Button text conditional rendering**
*For any* venue detail screen, if the current user has already reviewed the venue, the button text should be "Edit Your Review", otherwise it should be "Write a Review".
**Validates: Requirements 1.12**

## Error Handling

### Client-Side Error Handling

1. **Network Errors**:
   - Retry logic with exponential backoff for failed submissions
   - Offline queue for review submissions when network unavailable
   - Clear error messages: "Unable to submit review. Please check your connection."

2. **Validation Errors**:
   - Real-time validation feedback as user types
   - Specific error messages for each validation failure:
     - "Please select a rating before submitting"
     - "Review text cannot exceed 500 characters"
     - "Review text cannot be empty or contain only spaces"
     - "This content violates our community guidelines"

3. **Duplicate Review Errors**:
   - Detect existing review before submission
   - Redirect to edit flow instead of showing error
   - Message: "You've already reviewed this venue. Would you like to edit your review?"

4. **Authentication Errors**:
   - Redirect to login if user not authenticated
   - Preserve review draft during authentication flow
   - Message: "Please sign in to submit a review"

5. **Rate Limit Errors**:
   - Display time until rate limit resets
   - Message: "You've reached the review limit. Try again in [X] minutes."

### Server-Side Error Handling

1. **Database Errors**:
   - Transaction rollback on failure
   - Log errors for monitoring
   - Return generic error to client: "Unable to process request. Please try again."

2. **Concurrent Modification**:
   - Use database constraints to prevent race conditions
   - Return conflict error if review already exists
   - Handle optimistic locking for updates

3. **Content Moderation Failures**:
   - Fallback to basic profanity filter if API unavailable
   - Log moderation service failures
   - Allow submission with warning if moderation service down

4. **Trigger Failures**:
   - Ensure aggregate rating updates are atomic
   - Retry trigger execution on failure
   - Alert monitoring if triggers consistently fail

### Edge Cases

1. **Deleted User Reviews**:
   - Anonymize reviews when user deletes account
   - Display as "Former User" with generic avatar
   - Preserve review content and ratings

2. **Deleted Venue Reviews**:
   - Cascade delete all reviews when venue deleted
   - Update user review counts accordingly

3. **Empty Review Lists**:
   - Display friendly empty state: "No reviews yet. Be the first to review!"
   - Show "Write a Review" CTA prominently

4. **Very Long Reviewer Names**:
   - Truncate names longer than 30 characters with ellipsis
   - Show full name on tap/hover

5. **Zero Helpful Votes**:
   - Display "0" instead of hiding the count
   - Encourage engagement with clear button label

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs
- Both types are complementary and necessary for comprehensive coverage

### Unit Testing

Unit tests focus on:

1. **Specific Examples**:
   - Submitting a 5-star review with text
   - Submitting a 1-star review without text
   - Editing an existing review
   - Deleting a review
   - Toggling helpful vote on/off

2. **Edge Cases**:
   - Review with exactly 500 characters
   - Review with only whitespace
   - Review from deleted user
   - Venue with zero reviews
   - Review with zero helpful votes

3. **Error Conditions**:
   - Submitting review without authentication
   - Submitting duplicate review
   - Exceeding rate limit
   - Network failure during submission
   - Invalid rating value (0, 6, negative)

4. **Integration Points**:
   - Check-in system triggering review prompt
   - Analytics service querying reviews
   - Notification system sending review alerts
   - Real-time updates to venue cards

### Property-Based Testing

Property tests verify universal properties across randomized inputs. Each property test should:

- Run minimum 100 iterations (due to randomization)
- Reference its design document property number
- Use tag format: **Feature: venue-reviews-ratings, Property {number}: {property_text}**

#### Property Test Configuration

**Testing Library**: Use `fast-check` for TypeScript/JavaScript property-based testing

**Example Property Test Structure**:

```typescript
import fc from 'fast-check';

describe('Feature: venue-reviews-ratings', () => {
  it('Property 3: Review text validation', () => {
    // Feature: venue-reviews-ratings, Property 3: Review text validation
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 600 }), // Generate various strings
        (reviewText) => {
          const trimmed = reviewText.trim();
          const isValid = trimmed.length > 0 && trimmed.length <= 500;
          
          const result = validateReviewText(reviewText);
          
          if (isValid) {
            expect(result.valid).toBe(true);
            expect(result.trimmedText).toBe(trimmed);
          } else {
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

#### Key Properties to Test

1. **Property 1**: Authentication and rating requirements (generate auth states and rating values)
2. **Property 2**: One review per user-venue pair (generate multiple submission attempts)
3. **Property 3**: Text validation (generate strings of various lengths and content)
4. **Property 5**: Profanity filtering (generate text with varying profanity levels)
5. **Property 8**: Review sorting (generate review lists and verify sort order)
6. **Property 11**: Helpful vote toggle (generate vote sequences)
7. **Property 16**: Aggregate rating calculation (generate review sets and verify average)
8. **Property 17**: Real-time rating updates (generate review operations and verify updates)
9. **Property 26**: Concurrent submission handling (generate concurrent requests)

### Test Data Generators

Create smart generators for property tests:

```typescript
// Generate valid ratings (1-5)
const validRatingArb = fc.integer({ min: 1, max: 5 });

// Generate invalid ratings
const invalidRatingArb = fc.oneof(
  fc.integer({ max: 0 }),
  fc.integer({ min: 6 })
);

// Generate review text within limits
const validReviewTextArb = fc.string({ minLength: 1, maxLength: 500 })
  .filter(s => s.trim().length > 0);

// Generate review text exceeding limits
const invalidReviewTextArb = fc.string({ minLength: 501, maxLength: 1000 });

// Generate profanity levels
const profanityLevelArb = fc.constantFrom('none', 'mild', 'severe');

// Generate user-venue pairs
const userVenuePairArb = fc.record({
  userId: fc.uuid(),
  venueId: fc.uuid()
});

// Generate review lists for sorting tests
const reviewListArb = fc.array(
  fc.record({
    id: fc.uuid(),
    rating: validRatingArb,
    helpful_count: fc.integer({ min: 0, max: 100 }),
    created_at: fc.date()
  }),
  { minLength: 0, maxLength: 50 }
);
```

### Performance Testing

1. **Load Time Tests**:
   - Measure review list fetch time (target: <300ms)
   - Measure review submission time (target: <500ms)
   - Test with varying review counts (10, 100, 1000 reviews)

2. **Concurrency Tests**:
   - Simulate 10 concurrent review submissions
   - Verify no race conditions or data corruption
   - Ensure proper locking and transaction handling

3. **Cache Performance**:
   - Verify cache hits reduce database queries
   - Measure cache invalidation speed
   - Test cache behavior under high load

### Integration Testing

1. **Check-In Integration**:
   - Verify review prompt appears after check-out
   - Verify verified badge set correctly for users who checked in
   - Test review prompt suppression for existing reviews

2. **Analytics Integration**:
   - Verify venue dashboard displays correct ratings
   - Verify "Today's Rating" calculation
   - Verify "Weekly Avg Rating" calculation
   - Test with zero reviews (fallback behavior)

3. **Notification Integration**:
   - Verify notifications sent on venue owner response
   - Verify notifications sent on helpful vote milestones
   - Verify notification batching (max 1 per hour)

4. **Real-Time Updates**:
   - Verify venue cards update when new review submitted
   - Verify aggregate rating updates immediately
   - Test with multiple clients subscribed to same venue

### Manual Testing Checklist

1. **UI/UX Testing**:
   - Review modal appearance and behavior
   - Star rating selector interaction
   - Character counter color changes
   - Review list scrolling and pagination
   - Filter and sort UI responsiveness

2. **Content Moderation Testing**:
   - Test with various profanity levels
   - Verify censoring works correctly
   - Test whitelist terms (cocktails, breast, etc.)
   - Verify rejection messages for severe content

3. **Cross-Platform Testing**:
   - Test on iOS and Android
   - Verify consistent behavior across platforms
   - Test on various screen sizes

4. **Accessibility Testing**:
   - Screen reader compatibility
   - Keyboard navigation
   - Color contrast for ratings
   - Touch target sizes

### Continuous Integration

1. **Automated Test Runs**:
   - Run all unit tests on every commit
   - Run property tests on every PR
   - Run integration tests before deployment

2. **Test Coverage Goals**:
   - Minimum 80% code coverage for review service
   - 100% coverage for validation logic
   - 100% coverage for content moderation

3. **Performance Benchmarks**:
   - Fail CI if review fetch exceeds 300ms
   - Fail CI if review submission exceeds 500ms
   - Monitor aggregate rating calculation time

## Implementation Notes

### Phase 1: Database and Backend (Priority 1)

1. Create database tables (reviews, helpful_votes, venue_responses, review_reports)
2. Add aggregate_rating and review_count columns to venues table
3. Implement database triggers for aggregate rating updates
4. Set up RLS policies for all tables
5. Create indexes for performance

### Phase 2: API Layer (Priority 1)

1. Implement ReviewService with all CRUD operations
2. Implement ContentModerationService with profanity filtering
3. Add validation logic for review submissions
4. Implement helpful vote toggle logic
5. Implement venue owner response endpoints

### Phase 3: UI Components (Priority 2)

1. Create ReviewSubmissionModal component
2. Create ReviewPromptModal component (with optional vibe selection chips)
3. Create ReviewCard component
4. Create ReviewList component with filtering/sorting
5. Create AggregateRatingDisplay component

**Note on Vibe Selection**: The vibe chips (Low-key, Vibey, Poppin, Lit, Maxed) are included in the review prompt as an optional selection before rating. This captures the user's perception of the venue's current atmosphere at checkout time. **The vibe/activity level system already exists in the codebase** (`src/utils/formatting/activity.ts`) and is used for venue cards. We'll reuse this existing implementation and the vibe data can be stored for future analytics or venue atmosphere tracking. During implementation, check if backend storage for user-submitted vibes already exists - if so, we can leverage that infrastructure.

### Phase 4: Integration (Priority 2)

1. Integrate review prompt with check-out flow
2. Update venue detail screen to display reviews
3. Update home feed venue cards to show ratings
4. Update venue dashboard to show review analytics
5. Implement notification triggers for review events

### Phase 5: Polish and Optimization (Priority 3)

1. Implement caching with 5-minute TTL
2. Add real-time subscriptions for live updates
3. Implement quality badges (Detailed Review, Top Review, etc.)
4. Add review photos placeholder UI
5. Performance optimization and monitoring

### Migration Strategy

1. **Database Migration**:
   - Run migrations in production during low-traffic period
   - Create tables and indexes first
   - Add triggers after tables are created
   - Backfill aggregate_rating for existing venues (set to 0.0)

2. **Feature Flag**:
   - Deploy backend with feature flag disabled
   - Enable for internal testing first
   - Gradual rollout to users (10%, 50%, 100%)

3. **Data Validation**:
   - Monitor aggregate rating calculations
   - Verify trigger execution logs
   - Check for any data inconsistencies

4. **Rollback Plan**:
   - Keep old analytics mock data as fallback
   - Disable feature flag if issues arise
   - Database rollback scripts prepared

### Security Considerations

1. **Input Sanitization**:
   - Sanitize all review text to prevent XSS
   - Validate rating values server-side
   - Prevent SQL injection via parameterized queries

2. **Rate Limiting**:
   - Implement per-user rate limits (5 reviews/hour)
   - Implement per-IP rate limits for anonymous requests
   - Monitor for abuse patterns

3. **Content Moderation**:
   - Log all flagged content for review
   - Implement appeal process for rejected reviews
   - Regular updates to profanity filter dictionary

4. **Privacy**:
   - Anonymize reviews from deleted users
   - Allow users to delete their reviews
   - Comply with GDPR/CCPA data deletion requests

### Monitoring and Alerts

1. **Key Metrics**:
   - Review submission rate
   - Review submission success/failure rate
   - Average review length
   - Profanity filter trigger rate
   - Aggregate rating calculation time
   - Cache hit/miss ratio

2. **Alerts**:
   - Alert if review submission failure rate > 5%
   - Alert if aggregate rating trigger fails
   - Alert if review fetch time > 500ms
   - Alert if profanity filter service down

3. **Dashboards**:
   - Real-time review submission dashboard
   - Content moderation dashboard
   - Performance metrics dashboard
   - User engagement metrics (reviews per user, helpful votes, etc.)

---

**Design Document Complete**

This design provides a comprehensive blueprint for implementing the Venue Reviews & Ratings System. The system integrates seamlessly with existing check-in and analytics features while maintaining high performance through caching and database triggers. Content moderation ensures platform quality, and property-based testing provides confidence in correctness across all inputs.
