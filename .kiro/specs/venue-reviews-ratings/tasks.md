# Implementation Plan: Venue Reviews & Ratings System

## Overview

This implementation plan breaks down the Venue Reviews & Ratings System into discrete, incremental tasks. The system enables users to submit star ratings and written reviews for venues, integrates with the existing check-in flow and analytics dashboard, and includes content moderation and real-time updates.

## Tasks

- [x] 1. Set up database schema and migrations
  - Create reviews, helpful_votes, venue_responses, and review_reports tables
  - Add aggregate_rating and review_count columns to venues table
  - Create database indexes for performance
  - Set up Row Level Security (RLS) policies
  - _Requirements: 14.1, 14.8, 15.1_

- [x] 2. Implement database triggers for aggregate rating updates
  - [x] 2.1 Create update_venue_rating() trigger function
    - Recalculate aggregate_rating and review_count when reviews are inserted/updated/deleted
    - _Requirements: 14.2, 14.3, 14.4_

  - [x] 2.2 Create update_helpful_count() trigger function
    - Recalculate helpful_count when helpful_votes are inserted/deleted
    - _Requirements: 5.2, 5.3_

  - [x] 2.3 Create set_verified_status() trigger function
    - Automatically set is_verified based on check-in history
    - _Requirements: 8.1_

- [x] 3. Checkpoint - Verify database setup
  - Ensure all tables created successfully
  - Verify triggers execute correctly
  - Test RLS policies manually
  - Ask the user if questions arise

- [x] 4. Implement ContentModerationService
  - [x] 4.1 Install and configure bad-words library
    - Set up profanity filter with custom whitelist
    - _Requirements: 19.1, 19.8_

  - [x] 4.2 Implement filterProfanity() method
    - Detect and censor mild profanity with asterisks
    - Reject severe content (hate speech/threats)
    - Use tiered approach (none/mild/severe)
    - _Requirements: 19.2, 19.3, 19.4_

  - [x] 4.3 Implement venue-specific whitelist
    - Add common false positives (cocktails, breast, etc.)
    - _Requirements: 19.5_

- [x] 5. Implement ReviewService API layer
  - [x] 5.1 Create submitReview() method
    - Validate authentication and rating
    - Validate review text (trim, length, whitespace)
    - Apply content moderation
    - Insert review into database
    - _Requirements: 1.7, 1.8, 13.1, 13.2, 13.6, 13.7_

  - [x] 5.2 Create updateReview() method
    - Validate ownership
    - Update rating and/or text
    - Update timestamp
    - _Requirements: 6.3, 6.7_

  - [x] 5.3 Create deleteReview() method
    - Validate ownership
    - Delete review
    - Trigger aggregate rating recalculation
    - _Requirements: 6.5, 6.6_

  - [x] 5.4 Create getVenueReviews() method
    - Implement pagination (20 per page)
    - Support sorting (recent, highest, lowest, helpful)
    - Support filtering by rating
    - Support verified-only filter
    - _Requirements: 3.9, 4.3, 4.5, 14.7_

  - [x] 5.5 Create getUserReviewForVenue() method
    - Check if user has already reviewed venue
    - _Requirements: 1.11, 1.12_

- [x] 6. Implement helpful votes functionality
  - [x] 6.1 Create toggleHelpfulVote() method
    - Check if user has already voted
    - Insert or delete helpful_vote record
    - Return new helpful count
    - Prevent users from voting on own reviews
    - _Requirements: 5.2, 5.3, 5.4, 5.6_

- [x] 7. Implement venue owner response functionality
  - [x] 7.1 Create submitVenueResponse() method
    - Validate venue ownership
    - Validate response text (max 300 chars)
    - Insert response into database
    - Send notification to reviewer
    - _Requirements: 9.3, 9.6, 9.7_

  - [x] 7.2 Create updateVenueResponse() method
    - Validate venue ownership
    - Update response text
    - _Requirements: 9.5_

  - [x] 7.3 Create deleteVenueResponse() method
    - Validate venue ownership
    - Delete response
    - _Requirements: 9.5_

- [x] 8. Implement review reporting functionality
  - [x] 8.1 Create reportReview() method
    - Validate authentication
    - Create review_report record
    - Prevent duplicate reports
    - _Requirements: 10.4, 10.6_

- [x] 9. Checkpoint - Verify backend functionality
  - Test all API endpoints manually
  - Verify triggers update aggregate ratings correctly
  - Test content moderation with sample inputs
  - Ask the user if questions arise

- [x] 10. Create ReviewSubmissionModal component
  - [x] 10.1 Implement 5-star rating selector
    - Highlight selected star and all stars to the left
    - Enable text input when rating selected
    - _Requirements: 1.3, 1.4, 1.5_

  - [x] 10.2 Implement review text input
    - Character counter (500 max)
    - Warning color at 450 chars
    - Prevent input beyond 500 chars
    - _Requirements: 1.6, 13.2, 13.3, 13.4, 13.5_

  - [x] 10.3 Implement submission logic
    - Validate rating required
    - Apply content moderation
    - Show success/error messages
    - Handle edit mode (pre-populate existing review)
    - _Requirements: 1.7, 1.9, 1.10, 6.2_

- [x] 11. Create ReviewPromptModal component
  - [x] 11.1 Implement optional vibe selection chips
    - Display Low-key, Vibey, Poppin, Lit, Maxed chips
    - Reuse existing ActivityLevel system from src/utils/formatting/activity.ts
    - Make selection optional (can skip)
    - Check if backend storage for vibes already exists
    - _Requirements: 2.2_

  - [x] 11.2 Implement quick rating selector
    - Compact 5-star selector
    - Auto-submit on star selection
    - Include optional vibe in submission
    - _Requirements: 2.3_

  - [x] 11.3 Implement "Add written review" button
    - Open full ReviewSubmissionModal
    - Pass selected rating and vibe
    - _Requirements: 2.4, 2.5_

- [x] 12. Create ReviewCard component
  - [x] 12.1 Implement review display
    - Show reviewer name, profile picture, rating, text, timestamp
    - Show verified badge if is_verified = true
    - Show "Edited" indicator if updated_at > created_at
    - _Requirements: 3.6, 8.2, 6.8_

  - [x] 12.2 Implement helpful button
    - Display helpful count
    - Toggle active state based on user vote
    - Disable for user's own reviews
    - _Requirements: 3.7, 5.1, 5.5, 5.6_

  - [x] 12.3 Implement edit/delete options
    - Show only for user's own reviews
    - Confirmation dialog for delete
    - _Requirements: 6.1, 6.4_

  - [x] 12.4 Implement venue owner response display
    - Show response below review
    - Display "Response from [Venue Name]" label
    - Show "Responded" indicator on card
    - _Requirements: 9.3, 9.4, 9.8_

- [x] 13. Create ReviewList component
  - [x] 13.1 Implement review list display
    - Show reviews in cards
    - Implement pagination (20 per page)
    - Pull-to-refresh
    - Empty state message
    - _Requirements: 3.4, 3.8, 14.7_

  - [x] 13.2 Implement filter UI
    - Filter by rating (All, 5★, 4★, 3★, 2★, 1★)
    - Verified-only filter
    - Display active filter count
    - Clear filters button
    - _Requirements: 4.4, 4.5, 4.6, 4.7, 8.4_

  - [x] 13.3 Implement sort UI
    - Sort options: Most Recent, Highest Rated, Lowest Rated, Most Helpful
    - Apply sort to review list
    - _Requirements: 4.2, 4.3_

- [x] 14. Create AggregateRatingDisplay component
  - [x] 14.1 Implement rating display
    - Show filled/half-filled/empty stars
    - Show numerical rating (e.g., "4.5")
    - Show review count (e.g., "(127 reviews)")
    - Highlight color for ratings >= 4.5
    - _Requirements: 3.1, 3.2, 7.2, 7.3, 7.6_

- [x] 15. Checkpoint - Verify UI components
  - Test all components in isolation manually
  - Verify styling and responsiveness
  - Test on iOS and Android emulators
  - Ask the user if questions arise

- [x] 16. Integrate review prompt with check-out flow
  - [x] 16.1 Update CheckInModal to trigger review prompt
    - Show ReviewPromptModal after check-out
    - Only show if user hasn't reviewed venue
    - Show only once per check-out
    - _Requirements: 2.1, 2.7, 2.8_

- [x] 17. Integrate reviews into VenueDetailScreen
  - [x] 17.1 Add AggregateRatingDisplay to venue header
    - Show aggregate rating and review count
    - _Requirements: 3.1_

  - [x] 17.2 Add "Write a Review" / "Edit Your Review" button
    - Check if user has reviewed venue
    - Change button text accordingly
    - Open ReviewSubmissionModal on tap
    - _Requirements: 1.1, 1.2, 1.12_

  - [x] 17.3 Add Reviews section
    - Show most recent 3 reviews
    - "See All Reviews" button
    - Navigate to full ReviewList screen
    - _Requirements: 3.3, 3.4, 3.5_

- [x] 18. Integrate ratings into home feed venue cards
  - [x] 18.1 Add AggregateRatingDisplay to venue cards
    - Show rating and review count
    - Show "No reviews yet" if zero reviews
    - _Requirements: 7.1, 7.4_

  - [x] 18.2 Implement real-time rating updates
    - Subscribe to review changes
    - Update venue card when new review submitted
    - _Requirements: 7.7_

- [x] 19. Integrate reviews into venue dashboard analytics
  - [x] 19.1 Update VenueAnalyticsService to use real review data
    - Remove mock data fallbacks for ratings
    - Query reviews table for today's rating
    - Query reviews table for weekly avg rating
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 19.2 Add "Recent Reviews" section to dashboard
    - Show 5 most recent reviews
    - Display with venue owner response options
    - _Requirements: 11.5, 9.1_

  - [x] 19.3 Add rating distribution chart
    - Show counts for 5★, 4★, 3★, 2★, 1★
    - Make bars interactive (filter on tap)
    - _Requirements: 11.6, 11.7_

- [x] 20. Checkpoint - Verify integrations
  - Test check-out → review prompt flow manually
  - Test venue detail screen reviews
  - Test home feed ratings
  - Test dashboard analytics
  - Ask the user if questions arise

- [x] 21. Implement review notifications
  - [x] 21.1 Create notification for venue owner responses
    - Send push notification when owner responds
    - Navigate to review on tap
    - _Requirements: 12.1, 12.7_

  - [x] 21.2 Create notification for helpful vote milestones
    - Send notification at 5, 10, 25, 50 votes
    - _Requirements: 12.2_

  - [x] 21.3 Create notification for new reviews (venue owners)
    - Send push notification when new review received
    - Batch notifications (max 1 per hour per venue)
    - _Requirements: 12.5, 12.6_

- [x] 22. Implement rate limiting
  - [x] 22.1 Add rate limit check to submitReview()
    - Check if user has submitted 5+ reviews in past hour
    - Return error with time until reset
    - _Requirements: 18.5_

- [x] 23. Implement caching for review lists
  - [x] 23.1 Add cache layer to getVenueReviews()
    - Cache review lists with 5-minute TTL
    - Invalidate cache on new review submission
    - _Requirements: 14.5, 14.6_

- [x] 24. Implement quality badges
  - [x] 24.1 Add badge logic to ReviewCard
    - "Detailed Review" badge for 200+ chars
    - "Top Review" badge for 10+ helpful votes
    - "Frequent Reviewer" badge for 10+ reviews
    - "Trusted Reviewer" badge for >70% helpful ratio
    - _Requirements: 16.1, 16.2, 16.3, 16.4_

- [x] 25. Add photo upload placeholder
  - [x] 25.1 Add photo button to ReviewSubmissionModal
    - Display "Photos coming soon" message
    - Reserve UI space for thumbnails
    - _Requirements: 17.1, 17.2_

- [x] 26. Checkpoint - Core functionality complete
  - Test complete user flow: check-out → review prompt → submit review
  - Test complete venue owner flow: receive review → respond → notification sent
  - Test edge cases manually: deleted users, zero reviews, rate limits
  - Test on physical devices (iOS and Android)
  - Ask the user if questions arise

- [x] 27. Write comprehensive test suite
  - [x] 27.1 Write property tests for backend
    - **Property 1**: Review submission requires authentication and rating
    - **Property 2**: One review per user per venue
    - **Property 3**: Review text validation
    - **Property 5**: Profanity filtering with tiered approach
    - **Property 8**: Review sorting
    - **Property 9**: Review filtering
    - **Property 11**: Helpful vote toggle behavior
    - **Property 12**: Helpful vote tracking
    - **Property 16**: Aggregate rating calculation
    - **Property 17**: Real-time rating updates
    - **Property 18**: Venue owner response permissions
    - **Property 19**: Response display and notification
    - **Property 20**: Report submission constraints
    - **Property 22**: Review event notifications
    - **Property 23**: Helpful vote milestone notifications
    - **Property 25**: Rate limiting
    - _Requirements: All backend requirements_

  - [x] 27.2 Write unit tests for backend services
    - Test ReviewService CRUD operations
    - Test ContentModerationService filtering
    - Test helpful vote toggle
    - Test venue owner responses
    - Test review reporting
    - Test rate limiting
    - Test caching
    - _Requirements: All backend requirements_

  - [x] 27.3 Write unit tests for UI components
    - Test ReviewSubmissionModal (star selection, character counter, validation)
    - Test ReviewPromptModal (vibe selection, quick rating)
    - Test ReviewCard (display, helpful button, edit/delete)
    - Test ReviewList (filtering, sorting, pagination)
    - Test AggregateRatingDisplay (star rendering, highlight color)
    - _Requirements: All UI requirements_

  - [x] 27.4 Write property tests for UI components
    - **Property 7**: Review display completeness
    - **Property 10**: Venue card rating display
    - **Property 27**: Review quality badges
    - **Property 28**: Star rating selector behavior
    - **Property 29**: Review prompt display logic
    - **Property 30**: Button text conditional rendering
    - _Requirements: All UI requirements_

  - [x] 27.5 Write integration tests
    - Test check-out → review prompt integration
    - Test venue detail screen integration
    - Test home feed integration
    - Test dashboard analytics integration
    - Test notification integration
    - Test real-time updates
    - _Requirements: All integration requirements_

  - [x] 27.6 Write performance tests
    - Test review fetch time (<300ms)
    - Test review submission time (<500ms)
    - Test concurrent submissions
    - Test cache performance
    - _Requirements: 18.1, 18.2, 18.7_

- [x] 28. Performance optimization and final polish
  - [x] 28.1 Verify database indexes are used
    - Check query execution plans
    - Add additional indexes if needed
    - _Requirements: 14.8, 18.3_

  - [x] 28.2 Optimize aggregate rating trigger
    - Ensure trigger executes efficiently
    - Monitor trigger execution time
    - _Requirements: 14.4_

  - [x] 28.3 Update API documentation
    - Document all ReviewService endpoints
    - Document request/response formats
    - Document error codes

  - [x] 28.4 Create database migration scripts
    - Production-ready migration SQL
    - Rollback scripts
    - _Requirements: 14.1_

  - [x] 28.5 Update user-facing documentation
    - How to write a review
    - How to respond to reviews (venue owners)
    - Community guidelines

  - [x] 28.6 Deploy to production
    - Run database migrations
    - Deploy backend changes
    - Deploy frontend changes
    - Enable feature flag gradually (10%, 50%, 100%)

## Notes

- All tests are consolidated in Task 27 after core functionality is complete
- This allows you to build a solid foundation first, then write comprehensive tests once everything works
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties (Task 27.1 and 27.4)
- Unit tests validate specific examples and edge cases (Task 27.2 and 27.3)
- Integration tests validate cross-component behavior (Task 27.5)
- Performance tests validate speed requirements (Task 27.6)
- The vibe selection feature reuses existing ActivityLevel system from `src/utils/formatting/activity.ts`
- During implementation, check if backend storage for user-submitted vibes already exists
