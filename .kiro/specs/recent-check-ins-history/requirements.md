# Requirements Document

## Introduction

This feature enables users to view their check-in history, displaying the venues they have recently visited in chronological order. The feature will help users track their activity, revisit favorite locations, and maintain a personal venue history.

## Glossary

- **System**: The recent check-ins history feature within the venue discovery mobile application
- **User**: An authenticated customer using the mobile application
- **Check_In**: A record of a user visiting a venue, containing timestamps and venue information
- **Recent_Check_Ins**: Check-ins from the past 30 days, ordered by most recent first
- **Check_In_History**: The complete list of all user check-ins, regardless of date
- **Venue_Details**: Information about a venue including name, location, image, rating, and category
- **History_Screen**: The UI screen displaying the user's recent check-ins
- **History_Service**: The backend service responsible for querying and formatting check-in history data

## Requirements

### Requirement 1: Display Recent Check-Ins

**User Story:** As a user, I want to view my recent check-ins, so that I can see which venues I've visited recently.

#### Acceptance Criteria

1. WHEN a user navigates to the history screen, THE System SHALL display all check-ins from the past 30 days
2. WHEN displaying check-ins, THE System SHALL order them by checked_in_at timestamp in descending order (most recent first)
3. WHEN a check-in is displayed, THE System SHALL show the venue name, location, check-in timestamp, and venue image
4. WHEN the user has no recent check-ins, THE System SHALL display an empty state message
5. WHEN loading check-in history, THE System SHALL show a loading indicator

### Requirement 2: Fetch Check-In History from Backend

**User Story:** As a user, I want the system to retrieve my check-in history efficiently, so that I can view my history quickly.

#### Acceptance Criteria

1. WHEN the history screen loads, THE History_Service SHALL query the check_ins table for the authenticated user's records
2. WHEN querying check-ins, THE History_Service SHALL join with the venues table to retrieve complete venue information
3. WHEN fetching check-ins, THE History_Service SHALL filter records to only include check-ins from the past 30 days
4. WHEN the query completes, THE History_Service SHALL return check-ins with venue details in a single response
5. IF the query fails, THEN THE History_Service SHALL return an error message

### Requirement 3: Navigate to Venue Details

**User Story:** As a user, I want to tap on a check-in to view the venue details, so that I can revisit or learn more about that venue.

#### Acceptance Criteria

1. WHEN a user taps on a check-in item, THE System SHALL navigate to the venue detail screen
2. WHEN navigating to venue details, THE System SHALL pass the venue_id to the detail screen
3. WHEN the venue detail screen loads, THE System SHALL display the full venue information

### Requirement 4: Refresh Check-In History

**User Story:** As a user, I want to refresh my check-in history, so that I can see newly added check-ins.

#### Acceptance Criteria

1. WHEN a user pulls down on the history screen, THE System SHALL trigger a refresh action
2. WHEN refreshing, THE System SHALL re-query the check-in history from the backend
3. WHEN the refresh completes, THE System SHALL update the displayed check-ins
4. WHEN refreshing, THE System SHALL show a refresh indicator

### Requirement 5: Format Check-In Timestamps

**User Story:** As a user, I want to see when I checked in to venues in a readable format, so that I can easily understand my visit history.

#### Acceptance Criteria

1. WHEN displaying a check-in timestamp, THE System SHALL format it as a relative time for recent check-ins (e.g., "2 hours ago", "Yesterday")
2. WHEN a check-in is older than 7 days, THE System SHALL display the full date (e.g., "Jan 5, 2026")
3. WHEN a check-in is from today, THE System SHALL display "Today" with the time (e.g., "Today at 3:45 PM")

### Requirement 6: Display Check-In Duration

**User Story:** As a user, I want to see how long I stayed at each venue, so that I can track my visit patterns.

#### Acceptance Criteria

1. WHEN a check-in has a checked_out_at timestamp, THE System SHALL calculate and display the duration
2. WHEN displaying duration, THE System SHALL format it in hours and minutes (e.g., "2h 30m")
3. WHEN a check-in is still active (no checkout), THE System SHALL display "Currently checked in"
4. WHEN duration is less than 1 hour, THE System SHALL display minutes only (e.g., "45m")

### Requirement 7: Limit History Results

**User Story:** As a user, I want the system to load my history efficiently, so that the app remains responsive.

#### Acceptance Criteria

1. WHEN initially loading history, THE System SHALL fetch a maximum of 50 check-ins
2. WHEN the user scrolls to the bottom of the list, THE System SHALL load the next 50 check-ins
3. WHEN all check-ins have been loaded, THE System SHALL display an end-of-list indicator
4. WHEN loading more check-ins, THE System SHALL show a loading indicator at the bottom of the list

### Requirement 8: Handle Empty States

**User Story:** As a user, I want to see helpful messages when I have no check-in history, so that I understand what to do next.

#### Acceptance Criteria

1. WHEN a user has no check-ins in the past 30 days, THE System SHALL display "No recent check-ins" message
2. WHEN displaying the empty state, THE System SHALL show a suggestion to explore venues
3. WHEN the user taps the suggestion, THE System SHALL navigate to the home screen

### Requirement 9: Display Venue Category

**User Story:** As a user, I want to see the category of each venue in my history, so that I can quickly identify the type of place I visited.

#### Acceptance Criteria

1. WHEN displaying a check-in, THE System SHALL show the venue category (e.g., "Coffee Shop", "Bar", "Restaurant")
2. WHEN displaying the category, THE System SHALL use a badge or chip component
3. WHEN the category is displayed, THE System SHALL use consistent styling with other venue displays

### Requirement 10: Show Check-In Count Badge

**User Story:** As a user, I want to see how many times I've visited each venue, so that I can identify my favorite places.

#### Acceptance Criteria

1. WHEN displaying a check-in, THE System SHALL show the total number of times the user has checked in to that venue
2. WHEN the count is 1, THE System SHALL display "First visit"
3. WHEN the count is greater than 1, THE System SHALL display the count (e.g., "3rd visit", "10th visit")
4. WHEN calculating the count, THE System SHALL include all check-ins regardless of date range
