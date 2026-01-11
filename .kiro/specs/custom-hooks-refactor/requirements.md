# Requirements Document

## Introduction

This specification outlines the refactoring of the OTW (On The Way) React Native application to extract reusable custom hooks from screen components. The goal is to improve code maintainability, reduce duplication, and establish a scalable pattern for business logic separation.

## Glossary

- **Custom Hook**: A JavaScript function that starts with "use" and can call other hooks, encapsulating reusable stateful logic
- **Screen Component**: A top-level component that represents a full screen in the navigation stack
- **Business Logic**: Code that handles data fetching, state management, and application rules (separate from UI rendering)
- **Service Layer**: Existing classes (VenueService, CheckInService, etc.) that handle API calls to Supabase
- **Hook Consumer**: A component that uses a custom hook

## Requirements

### Requirement 1: Create Venue Management Hook

**User Story:** As a developer, I want a reusable hook for venue data management, so that I can fetch and manage venues consistently across screens.

#### Acceptance Criteria

1. THE Hook SHALL provide venue data, loading state, and error state
2. WHEN the hook is called with query options, THE Hook SHALL fetch venues matching those options
3. WHEN the hook is called without options, THE Hook SHALL fetch all venues
4. THE Hook SHALL support featured venues filtering
5. THE Hook SHALL support search query filtering
6. THE Hook SHALL support category filtering
7. THE Hook SHALL provide a refetch function for manual data refresh
8. WHEN an error occurs during fetching, THE Hook SHALL capture and expose the error state
9. THE Hook SHALL automatically fetch data on mount
10. THE Hook SHALL clean up subscriptions on unmount

### Requirement 2: Create Favorites Management Hook

**User Story:** As a developer, I want a reusable hook for favorites management, so that I can handle favorite venues consistently across screens.

#### Acceptance Criteria

1. THE Hook SHALL provide the current user's favorite venue IDs as a Set
2. THE Hook SHALL provide a loading state for favorites
3. WHEN a user is not logged in, THE Hook SHALL return an empty favorites set
4. WHEN a user is logged in, THE Hook SHALL fetch their favorites on mount
5. THE Hook SHALL provide a toggleFavorite function
6. WHEN toggleFavorite is called, THE Hook SHALL optimistically update the UI
7. WHEN toggleFavorite succeeds, THE Hook SHALL persist the change
8. WHEN toggleFavorite fails, THE Hook SHALL revert the optimistic update
9. WHEN toggleFavorite is called without authentication, THE Hook SHALL return an error indicator
10. THE Hook SHALL clean up subscriptions on unmount

### Requirement 3: Create Check-In Stats Hook

**User Story:** As a developer, I want a reusable hook for check-in statistics, so that I can display venue activity consistently across screens.

#### Acceptance Criteria

1. THE Hook SHALL accept an array of venue IDs
2. THE Hook SHALL return a Map of venue IDs to check-in statistics
3. THE Hook SHALL provide a loading state
4. WHEN venue IDs change, THE Hook SHALL fetch updated statistics
5. THE Hook SHALL include user check-in status for each venue
6. THE Hook SHALL support single venue ID queries
7. THE Hook SHALL support multiple venue ID queries
8. WHEN an error occurs, THE Hook SHALL return empty statistics rather than crashing
9. THE Hook SHALL debounce rapid venue ID changes
10. THE Hook SHALL clean up subscriptions on unmount

### Requirement 4: Create Check-In Action Hook

**User Story:** As a developer, I want a reusable hook for check-in actions, so that I can handle check-ins/check-outs consistently across screens.

#### Acceptance Criteria

1. THE Hook SHALL provide checkIn and checkOut functions
2. THE Hook SHALL provide loading state for check-in operations
3. WHEN checkIn is called, THE Hook SHALL check the user into the specified venue
4. WHEN checkOut is called, THE Hook SHALL check the user out of the specified venue
5. THE Hook SHALL automatically check out from previous venues when checking into a new venue
6. WHEN a check-in operation succeeds, THE Hook SHALL invoke a success callback
7. WHEN a check-in operation fails, THE Hook SHALL invoke an error callback
8. THE Hook SHALL prevent duplicate check-in requests
9. WHEN a user is not authenticated, THE Hook SHALL return an error indicator
10. THE Hook SHALL expose the current check-in state

### Requirement 5: Create Debounce Utility Hook

**User Story:** As a developer, I want a reusable debounce hook, so that I can optimize search and filter operations.

#### Acceptance Criteria

1. THE Hook SHALL accept a value and delay in milliseconds
2. THE Hook SHALL return the debounced value
3. WHEN the input value changes, THE Hook SHALL wait for the specified delay
4. WHEN the delay expires without new changes, THE Hook SHALL update the debounced value
5. WHEN the input value changes before delay expires, THE Hook SHALL reset the timer
6. THE Hook SHALL use a default delay of 300ms if not specified
7. THE Hook SHALL clean up timers on unmount
8. THE Hook SHALL handle rapid value changes efficiently

### Requirement 6: Refactor HomeScreen to Use Hooks

**User Story:** As a developer, I want HomeScreen to use custom hooks, so that the component focuses on UI rendering.

#### Acceptance Criteria

1. THE HomeScreen SHALL use the useVenues hook for venue data
2. THE HomeScreen SHALL use the useFavorites hook for favorites management
3. THE HomeScreen SHALL use the useCheckInStats hook for activity data
4. THE HomeScreen SHALL remove all data fetching logic from the component
5. THE HomeScreen SHALL remove all state management for venues, favorites, and check-ins
6. THE HomeScreen SHALL maintain all existing UI functionality
7. THE HomeScreen SHALL maintain all existing user interactions
8. WHEN the screen mounts, THE HomeScreen SHALL display the same data as before
9. THE HomeScreen SHALL be reduced to under 200 lines of code
10. THE HomeScreen SHALL maintain pull-to-refresh functionality

### Requirement 7: Refactor SearchScreen to Use Hooks

**User Story:** As a developer, I want SearchScreen to use custom hooks, so that the component focuses on search UI.

#### Acceptance Criteria

1. THE SearchScreen SHALL use the useVenues hook for venue data
2. THE SearchScreen SHALL use the useFavorites hook for favorites management
3. THE SearchScreen SHALL use the useDebounce hook for search query optimization
4. THE SearchScreen SHALL remove all data fetching logic from the component
5. THE SearchScreen SHALL remove all state management for venues and favorites
6. THE SearchScreen SHALL maintain all existing filter functionality
7. THE SearchScreen SHALL maintain all existing search functionality
8. WHEN the search query changes, THE SearchScreen SHALL debounce the search
9. THE SearchScreen SHALL be reduced to under 600 lines of code
10. THE SearchScreen SHALL maintain filter drawer functionality

### Requirement 8: Refactor VenueDetailScreen to Use Hooks

**User Story:** As a developer, I want VenueDetailScreen to use custom hooks, so that the component focuses on detail UI.

#### Acceptance Criteria

1. THE VenueDetailScreen SHALL use a custom hook for single venue fetching
2. THE VenueDetailScreen SHALL use the useCheckInStats hook for venue activity
3. THE VenueDetailScreen SHALL remove all data fetching logic from the component
4. THE VenueDetailScreen SHALL maintain all existing UI functionality
5. THE VenueDetailScreen SHALL maintain mock data fallback for testing
6. WHEN the venue ID changes, THE VenueDetailScreen SHALL fetch new venue data
7. THE VenueDetailScreen SHALL maintain scroll-to-top behavior
8. THE VenueDetailScreen SHALL maintain all contact action handlers
9. THE VenueDetailScreen SHALL be reduced to under 300 lines of code
10. THE VenueDetailScreen SHALL maintain loading and error states

### Requirement 9: Create Hooks Directory Structure

**User Story:** As a developer, I want a well-organized hooks directory, so that I can easily find and maintain custom hooks.

#### Acceptance Criteria

1. THE System SHALL create a src/hooks directory
2. THE System SHALL organize hooks by feature domain
3. THE System SHALL provide an index.ts file for hook exports
4. THE System SHALL include TypeScript types for all hook parameters and return values
5. THE System SHALL include JSDoc comments for all hooks
6. THE System SHALL follow the naming convention use[Feature][Action]
7. THE System SHALL export all hooks from the index file
8. THE System SHALL maintain consistent file naming (camelCase)
9. THE System SHALL group related hooks in the same file when appropriate
10. THE System SHALL include usage examples in JSDoc comments

### Requirement 10: Maintain Backward Compatibility

**User Story:** As a developer, I want the refactoring to maintain all existing functionality, so that users experience no disruptions.

#### Acceptance Criteria

1. THE System SHALL maintain all existing screen functionality
2. THE System SHALL maintain all existing user interactions
3. THE System SHALL maintain all existing data flows
4. THE System SHALL maintain all existing error handling
5. THE System SHALL maintain all existing loading states
6. THE System SHALL maintain all existing navigation behavior
7. THE System SHALL maintain all existing prop types
8. THE System SHALL maintain all existing service layer calls
9. WHEN the refactoring is complete, THE System SHALL pass all existing tests
10. WHEN the refactoring is complete, THE System SHALL have no new console errors
