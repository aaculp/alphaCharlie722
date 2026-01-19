# Requirements Document: Venue Reviews & Ratings System

## Introduction

This document outlines the requirements for implementing a comprehensive reviews and ratings system in the OTW application. The system enables users to leave star ratings and written reviews for venues they've visited, providing valuable feedback to venue owners and social proof to other customers. Reviews are integrated into the venue detail screen, home feed, and venue owner dashboard analytics.

## Glossary

- **Review**: A user-submitted evaluation of a venue consisting of a star rating and optional written text
- **Rating**: A numerical score from 1 to 5 stars indicating overall satisfaction with a venue
- **Review_Text**: Optional written feedback accompanying a star rating
- **Verified_Review**: A review submitted by a user who has checked in to the venue
- **Review_Prompt**: A system notification or UI element encouraging users to leave a review after visiting a venue
- **Aggregate_Rating**: The average of all ratings for a venue
- **Review_Count**: The total number of reviews submitted for a venue
- **Helpful_Vote**: A user action indicating a review was useful or informative
- **Review_Feed**: A chronological list of reviews for a venue
- **Review_Filter**: Options to sort or filter reviews (most recent, highest rated, most helpful)
- **Venue_Owner_Response**: A reply from the venue owner to a customer review
- **Review_Report**: A user action flagging a review as inappropriate or spam
- **Review_Card**: A UI component displaying review information on venue cards in the home feed

## Requirements

### Requirement 1: Review Submission from Venue Detail Screen

**User Story:** As a user who has visited a venue, I want to leave a star rating and written review from the venue detail screen, so that I can share my experience with others and provide feedback to the venue.

#### Acceptance Criteria

1. WHEN a user views a venue detail screen, THE System SHALL display a "Write a Review" button
2. WHEN a user taps "Write a Review", THE System SHALL display a review submission modal
3. WHEN the review modal opens, THE System SHALL display a 5-star rating selector
4. WHEN a user taps a star, THE System SHALL highlight that star and all stars to the left
5. WHEN a user selects a rating, THE System SHALL enable the optional text input field
6. WHEN a user enters review text, THE System SHALL allow up to 500 characters
7. WHEN a user submits a review, THE System SHALL require at least a star rating (text is optional)
8. WHEN a user submits a review, THE System SHALL validate the user is authenticated
9. WHEN a review is submitted successfully, THE System SHALL display a success message
10. WHEN a review submission fails, THE System SHALL display an error message and allow retry
11. THE System SHALL prevent users from submitting multiple reviews for the same venue
12. WHEN a user has already reviewed a venue, THE "Write a Review" button SHALL change to "Edit Your Review"

### Requirement 2: Post-Check-Out Review Prompt

**User Story:** As a user who just checked out of a venue, I want to be prompted to leave a review, so that I can easily share my experience while it's fresh in my mind.

#### Acceptance Criteria

1. WHEN a user checks out from a venue, THE System SHALL display a review prompt modal
2. WHEN the review prompt appears, THE System SHALL show the venue name and a 5-star rating selector
3. WHEN a user selects a rating in the prompt, THE System SHALL immediately submit the rating
4. WHEN a user selects a rating, THE System SHALL display an option to "Add written review"
5. WHEN a user taps "Add written review", THE System SHALL open the full review modal
6. WHEN a user dismisses the prompt without rating, THE System SHALL close the modal
7. THE System SHALL only show the review prompt once per check-out
8. WHEN a user has already reviewed the venue, THE System SHALL not show the review prompt

### Requirement 3: Review Display on Venue Detail Screen

**User Story:** As a user browsing venues, I want to see reviews and ratings on the venue detail screen, so that I can make informed decisions about where to visit.

#### Acceptance Criteria

1. WHEN a user views a venue detail screen, THE System SHALL display the aggregate rating and review count
2. WHEN displaying the aggregate rating, THE System SHALL show filled stars representing the average rating
3. WHEN a venue has reviews, THE System SHALL display a "Reviews" section below venue information
4. WHEN displaying reviews, THE System SHALL show the most recent 3 reviews by default
5. WHEN a user taps "See All Reviews", THE System SHALL navigate to a full reviews screen
6. WHEN displaying a review, THE System SHALL show the reviewer's name, profile picture, rating, review text, and timestamp
7. WHEN displaying a review, THE System SHALL show a "Helpful" button with vote count
8. WHEN a venue has no reviews, THE System SHALL display "No reviews yet. Be the first to review!"
9. THE System SHALL display reviews in reverse chronological order (newest first)

### Requirement 4: Review Filtering and Sorting

**User Story:** As a user viewing reviews, I want to filter and sort them by different criteria, so that I can find the most relevant reviews for my needs.

#### Acceptance Criteria

1. WHEN a user views the full reviews screen, THE System SHALL display filter and sort options
2. THE System SHALL provide sort options: "Most Recent", "Highest Rated", "Lowest Rated", "Most Helpful"
3. WHEN a user selects a sort option, THE System SHALL reorder reviews accordingly
4. THE System SHALL provide filter options: "All Ratings", "5 Stars", "4 Stars", "3 Stars", "2 Stars", "1 Star"
5. WHEN a user selects a rating filter, THE System SHALL show only reviews matching that rating
6. WHEN filters are applied, THE System SHALL display the active filter count
7. WHEN a user taps "Clear Filters", THE System SHALL reset to default view (Most Recent, All Ratings)

### Requirement 5: Helpful Votes on Reviews

**User Story:** As a user reading reviews, I want to mark reviews as helpful, so that useful reviews are highlighted for other users.

#### Acceptance Criteria

1. WHEN a user views a review, THE System SHALL display a "Helpful" button with the current vote count
2. WHEN a user taps "Helpful", THE System SHALL increment the helpful count by 1
3. WHEN a user taps "Helpful" again, THE System SHALL decrement the count (toggle off)
4. THE System SHALL track which reviews each user has marked as helpful
5. WHEN a user has marked a review helpful, THE "Helpful" button SHALL appear in an active state
6. THE System SHALL prevent users from marking their own reviews as helpful
7. WHEN sorting by "Most Helpful", THE System SHALL prioritize reviews with higher helpful counts

### Requirement 6: Review Editing and Deletion

**User Story:** As a user who has left a review, I want to edit or delete my review, so that I can update my feedback or remove it if my opinion changes.

#### Acceptance Criteria

1. WHEN a user views their own review, THE System SHALL display "Edit" and "Delete" options
2. WHEN a user taps "Edit", THE System SHALL open the review modal with existing rating and text
3. WHEN a user updates their review, THE System SHALL save the changes and update the timestamp
4. WHEN a user taps "Delete", THE System SHALL display a confirmation dialog
5. WHEN a user confirms deletion, THE System SHALL remove the review and update the venue's aggregate rating
6. WHEN a review is deleted, THE System SHALL decrement the venue's review count
7. THE System SHALL allow users to edit their reviews unlimited times
8. WHEN a review is edited, THE System SHALL display "Edited" indicator with the edit timestamp

### Requirement 7: Review Cards on Home Feed Venue Cards

**User Story:** As a user browsing the home feed, I want to see rating information on venue cards, so that I can quickly assess venue quality without navigating to the detail screen.

#### Acceptance Criteria

1. WHEN a venue card is displayed on the home feed, THE System SHALL show the aggregate rating and review count
2. WHEN displaying the rating, THE System SHALL show filled stars and the numerical rating (e.g., "4.5 ⭐")
3. WHEN displaying the review count, THE System SHALL show the count in parentheses (e.g., "(127 reviews)")
4. WHEN a venue has no reviews, THE System SHALL display "No reviews yet"
5. THE System SHALL position the rating information prominently on the venue card
6. WHEN a venue has a high rating (4.5+), THE System SHALL use a highlighted color for the stars
7. THE System SHALL update venue card ratings in real-time when new reviews are submitted

### Requirement 8: Verified Review Badge

**User Story:** As a user reading reviews, I want to see which reviews are from verified visitors, so that I can trust the authenticity of the feedback.

#### Acceptance Criteria

1. WHEN a user has checked in to a venue before reviewing, THE System SHALL mark the review as verified
2. WHEN displaying a verified review, THE System SHALL show a "Verified Visit" badge
3. THE System SHALL use a checkmark icon and distinct color for the verified badge
4. WHEN filtering reviews, THE System SHALL provide a "Verified Only" filter option
5. WHEN sorting by "Most Helpful", THE System SHALL give slight priority to verified reviews
6. THE System SHALL display the verification status on both the venue detail screen and full reviews screen

### Requirement 9: Venue Owner Response to Reviews

**User Story:** As a venue owner, I want to respond to customer reviews, so that I can address feedback, thank customers, and show engagement.

#### Acceptance Criteria

1. WHEN a venue owner views reviews on their dashboard, THE System SHALL display a "Respond" button for each review
2. WHEN a venue owner taps "Respond", THE System SHALL open a response input modal
3. WHEN a venue owner submits a response, THE System SHALL save it and display it below the review
4. WHEN displaying a venue owner response, THE System SHALL show "Response from [Venue Name]" label
5. THE System SHALL allow venue owners to edit or delete their responses
6. WHEN a venue owner responds to a review, THE System SHALL notify the reviewer
7. THE System SHALL limit venue owner responses to 300 characters
8. WHEN a review has a response, THE System SHALL display a "Responded" indicator on the review card

### Requirement 10: Review Reporting and Moderation

**User Story:** As a user, I want to report inappropriate reviews, so that the platform maintains quality and prevents abuse.

#### Acceptance Criteria

1. WHEN a user views a review, THE System SHALL display a "Report" option (three-dot menu)
2. WHEN a user taps "Report", THE System SHALL display report reason options
3. THE System SHALL provide report reasons: "Spam", "Offensive Content", "Fake Review", "Other"
4. WHEN a user submits a report, THE System SHALL create a moderation ticket
5. WHEN a review is reported, THE System SHALL not immediately hide it (pending moderation)
6. THE System SHALL prevent users from reporting the same review multiple times
7. WHEN a review receives multiple reports, THE System SHALL flag it for priority moderation
8. THE System SHALL allow venue owners to report reviews as fake or inappropriate

### Requirement 11: Review Analytics for Venue Dashboard

**User Story:** As a venue owner, I want to see review analytics on my dashboard, so that I can track customer satisfaction and identify areas for improvement.

#### Acceptance Criteria

1. WHEN a venue owner views their dashboard, THE System SHALL display "Today's Rating" in the Today's Performance section
2. WHEN calculating "Today's Rating", THE System SHALL average all reviews submitted today
3. WHEN no reviews were submitted today, THE System SHALL display the overall average rating
4. WHEN a venue owner views weekly analytics, THE System SHALL display "Avg. Rating" for the week
5. THE System SHALL display a "Recent Reviews" section showing the 5 most recent reviews
6. THE System SHALL display a rating distribution chart (5-star, 4-star, 3-star, 2-star, 1-star counts)
7. WHEN a venue owner taps on a rating distribution bar, THE System SHALL filter reviews by that rating
8. THE System SHALL display review trends (improving, declining, stable) based on recent ratings
9. THE System SHALL highlight reviews that need responses (unanswered reviews)
10. THE System SHALL display average response time to reviews

### Requirement 12: Review Notifications

**User Story:** As a user, I want to receive notifications about review-related activities, so that I stay informed about engagement with my reviews.

#### Acceptance Criteria

1. WHEN a venue owner responds to a user's review, THE System SHALL send a push notification to the reviewer
2. WHEN a user's review receives helpful votes, THE System SHALL send a notification after reaching milestones (5, 10, 25, 50 votes)
3. WHEN a user checks out from a venue, THE System SHALL send a notification prompting them to review
4. THE System SHALL allow users to configure review notification preferences
5. WHEN a venue owner receives a new review, THE System SHALL send a push notification
6. THE System SHALL batch review notifications to avoid spam (max 1 per hour per venue)
7. WHEN a user taps a review notification, THE System SHALL navigate to the relevant review or venue

### Requirement 13: Review Character Limits and Validation

**User Story:** As a user writing a review, I want clear guidance on character limits and requirements, so that I can submit a valid review.

#### Acceptance Criteria

1. THE System SHALL enforce a minimum of 1 star rating (required)
2. THE System SHALL enforce a maximum of 500 characters for review text (optional)
3. WHEN a user types review text, THE System SHALL display a character counter
4. WHEN a user reaches 450 characters, THE System SHALL change the counter color to warning
5. WHEN a user reaches 500 characters, THE System SHALL prevent further input
6. THE System SHALL trim leading and trailing whitespace from review text
7. THE System SHALL prevent submission of reviews containing only whitespace
8. THE System SHALL use a content moderation library to detect inappropriate language
9. WHEN validation fails, THE System SHALL display specific error messages

### Requirement 19: Content Moderation and Profanity Filtering

**User Story:** As a platform administrator, I want to automatically filter inappropriate content in reviews, so that the platform maintains a respectful environment without being overly restrictive.

#### Acceptance Criteria

1. THE System SHALL use a content moderation library (e.g., bad-words, profanity-check, or Perspective API) to scan review text
2. WHEN a review contains profanity, THE System SHALL automatically censor offensive words with asterisks (e.g., "f***")
3. WHEN a review contains extreme hate speech or threats, THE System SHALL reject the submission and display a warning
4. THE System SHALL use a tiered approach: mild profanity (censor), severe content (reject), normal content (allow)
5. THE System SHALL allow venue-related terms that might be flagged (e.g., "cocktails", "breast" in "chicken breast")
6. WHEN content is censored, THE System SHALL notify the user that some words were filtered
7. THE System SHALL log flagged content for manual review without blocking submission (for mild cases)
8. THE System SHALL provide a whitelist for common false positives in restaurant/venue context
9. WHEN a review is rejected for severe content, THE System SHALL provide guidance on community guidelines
10. THE System SHALL allow users to appeal rejected reviews through a support channel

### Requirement 14: Review Aggregation and Caching

**User Story:** As a system administrator, I want review data to be efficiently aggregated and cached, so that users experience fast load times and the system scales well.

#### Acceptance Criteria

1. THE System SHALL store aggregate rating and review count directly on the venues table
2. WHEN a new review is submitted, THE System SHALL update the venue's aggregate rating immediately
3. WHEN a review is deleted, THE System SHALL recalculate the venue's aggregate rating
4. THE System SHALL use database triggers or functions to maintain aggregate data consistency
5. THE System SHALL cache review lists for each venue with a 5-minute TTL
6. WHEN a new review is submitted, THE System SHALL invalidate the cache for that venue
7. THE System SHALL implement pagination for review lists (20 reviews per page)
8. THE System SHALL index the reviews table on venue_id, created_at, and rating for efficient queries

### Requirement 15: Review Privacy and Permissions

**User Story:** As a user, I want control over my review visibility and privacy, so that I can share feedback comfortably.

#### Acceptance Criteria

1. THE System SHALL require authentication to submit reviews
2. THE System SHALL display the reviewer's name and profile picture with each review
3. THE System SHALL allow users to use their display name or username for reviews
4. THE System SHALL prevent anonymous reviews
5. WHEN a user deletes their account, THE System SHALL anonymize their reviews (show as "Former User")
6. THE System SHALL allow users to view all their submitted reviews in their profile
7. THE System SHALL display a "My Reviews" section in the user's profile settings
8. WHEN a user views "My Reviews", THE System SHALL show all reviews with edit and delete options

### Requirement 16: Review Quality Indicators

**User Story:** As a user reading reviews, I want to see quality indicators, so that I can quickly identify trustworthy and detailed reviews.

#### Acceptance Criteria

1. WHEN a review has 200+ characters, THE System SHALL display a "Detailed Review" badge
2. WHEN a review has 10+ helpful votes, THE System SHALL display a "Top Review" badge
3. WHEN a reviewer has submitted 10+ reviews, THE System SHALL display a "Frequent Reviewer" badge
4. WHEN a reviewer has a high helpful vote ratio (>70%), THE System SHALL display a "Trusted Reviewer" badge
5. THE System SHALL prioritize reviews with quality indicators in the default sort order
6. THE System SHALL display reviewer statistics (total reviews, helpful votes received) on their profile

### Requirement 17: Review Photos (Future Enhancement Placeholder)

**User Story:** As a user writing a review, I want to attach photos to my review, so that I can visually illustrate my experience.

#### Acceptance Criteria

1. THE System SHALL provide a placeholder for photo upload functionality in the review modal
2. THE System SHALL display a "Photos coming soon" message when users tap the photo button
3. THE System SHALL design the review data model to support photo attachments in future updates
4. THE System SHALL reserve UI space for photo thumbnails in review cards

### Requirement 18: Performance and Scalability

**User Story:** As a system administrator, I want the review system to perform efficiently at scale, so that users have a fast and responsive experience.

#### Acceptance Criteria

1. WHEN loading a venue detail screen, THE System SHALL fetch reviews within 300ms
2. WHEN submitting a review, THE System SHALL complete the operation within 500ms
3. THE System SHALL implement database indexes on frequently queried fields (venue_id, user_id, created_at, rating)
4. THE System SHALL use pagination for review lists to limit data transfer
5. THE System SHALL implement rate limiting on review submissions (max 5 reviews per hour per user)
6. THE System SHALL cache aggregate ratings and review counts with appropriate TTL
7. THE System SHALL handle concurrent review submissions gracefully without race conditions
8. THE System SHALL implement optimistic UI updates for helpful votes to improve perceived performance
