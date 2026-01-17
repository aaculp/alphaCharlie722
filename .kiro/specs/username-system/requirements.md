# Requirements Document

## Introduction

This document specifies requirements for adding unique username handles to user profiles and implementing @ prefix search functionality. This feature enables better user discovery and provides a unified search experience for both venues and users.

## Glossary

- **System**: The mobile application and backend services
- **Username**: A unique alphanumeric identifier for a user (e.g., "johnsmith")
- **Handle**: The username prefixed with @ symbol (e.g., "@johnsmith")
- **Display Name**: The user's full name (e.g., "John Smith")
- **Profile**: User account information stored in the profiles table
- **Search Query**: Text input provided by the user in the search bar
- **@ Prefix**: The @ symbol at the start of a search query indicating username search

## Requirements

### Requirement 1: Username Field

**User Story:** As a user, I want to have a unique username, so that other users can easily find and identify me.

#### Acceptance Criteria

1. THE System SHALL store a username field in the profiles table
2. THE System SHALL enforce username uniqueness across all users
3. WHEN a username is provided, THE System SHALL validate it contains only alphanumeric characters and underscores
4. WHEN a username is provided, THE System SHALL validate it is between 3 and 30 characters in length
5. THE System SHALL store usernames in a case-insensitive manner for uniqueness checks
6. THE System SHALL allow the username field to be null for existing users during migration

### Requirement 2: Username Registration

**User Story:** As a new user, I want to choose my username during sign-up, so that I can establish my identity in the app.

#### Acceptance Criteria

1. WHEN a user signs up, THE System SHALL display a username input field
2. WHEN a user enters a username, THE System SHALL validate the format in real-time
3. WHEN a user enters a username, THE System SHALL check availability before submission
4. IF a username is already taken, THEN THE System SHALL display an error message
5. IF a username is invalid format, THEN THE System SHALL display format requirements
6. THE System SHALL require a username for all new user registrations
7. WHEN a user submits the sign-up form, THE System SHALL create the profile with the provided username

### Requirement 3: Username Display

**User Story:** As a user, I want to see usernames displayed throughout the app, so that I can identify users by their handles.

#### Acceptance Criteria

1. WHEN viewing a user profile, THE System SHALL display the username with @ prefix
2. WHEN viewing friend requests, THE System SHALL display the sender's username
3. WHEN viewing the activity feed, THE System SHALL display usernames for all users
4. WHEN viewing friend lists, THE System SHALL display usernames for all friends
5. WHEN viewing search results, THE System SHALL display usernames for all users
6. THE System SHALL display the username below or alongside the display name

### Requirement 4: Username Search

**User Story:** As a user, I want to search for other users by their username, so that I can find specific people.

#### Acceptance Criteria

1. WHEN a user searches by username, THE System SHALL return matching user profiles
2. WHEN searching usernames, THE System SHALL perform case-insensitive matching
3. WHEN searching usernames, THE System SHALL support partial matches
4. WHEN searching usernames, THE System SHALL exclude blocked users from results
5. WHEN searching usernames, THE System SHALL exclude the current user from results
6. WHEN searching usernames, THE System SHALL limit results to 20 users

### Requirement 5: @ Prefix Search Detection

**User Story:** As a user, I want to use @ prefix in search to find users by username, so that I can quickly search for people without switching modes.

#### Acceptance Criteria

1. WHEN a search query starts with @, THE System SHALL interpret it as a username search
2. WHEN a search query starts with @, THE System SHALL remove the @ prefix before searching
3. WHEN a search query does not start with @, THE System SHALL search venues by default
4. WHEN a search query starts with @ and has no additional characters, THE System SHALL show an empty state
5. THE System SHALL update search results in real-time as the user types

### Requirement 6: Unified Search Results

**User Story:** As a user, I want to see user search results in the same search interface, so that I have a consistent search experience.

#### Acceptance Criteria

1. WHEN searching with @ prefix, THE System SHALL display user results in the search screen
2. WHEN displaying user results, THE System SHALL show user avatar, name, and username
3. WHEN displaying user results, THE System SHALL show friendship status (friend, pending, none)
4. WHEN a user taps a user result, THE System SHALL navigate to that user's profile
5. WHEN no users match the search, THE System SHALL display an empty state message
6. THE System SHALL display a loading indicator while searching

### Requirement 7: Existing User Migration

**User Story:** As an existing user, I want to be prompted to set my username, so that I can participate in the new username system.

#### Acceptance Criteria

1. WHEN an existing user logs in without a username, THE System SHALL prompt them to set one
2. WHEN prompted, THE System SHALL allow the user to skip and set username later
3. WHEN a user sets their username, THE System SHALL validate and save it
4. THE System SHALL generate a default username suggestion based on user ID
5. THE System SHALL allow users to change their username from settings (future enhancement)

### Requirement 8: Bio Field

**User Story:** As a user, I want to add a bio to my profile, so that I can share information about myself.

#### Acceptance Criteria

1. THE System SHALL store a bio field in the profiles table
2. THE System SHALL allow bio text up to 500 characters
3. WHEN viewing a user profile, THE System SHALL display the bio if present
4. THE System SHALL allow the bio field to be null
5. THE System SHALL allow users to edit their bio from profile settings

### Requirement 9: Database Performance

**User Story:** As a system administrator, I want username searches to be fast, so that users have a responsive experience.

#### Acceptance Criteria

1. THE System SHALL create a database index on the username column
2. THE System SHALL create a case-insensitive index for username searches
3. WHEN searching usernames, THE System SHALL complete queries in under 200ms
4. THE System SHALL use the username index for all username lookups

### Requirement 10: Error Handling

**User Story:** As a user, I want clear error messages when username operations fail, so that I understand what went wrong.

#### Acceptance Criteria

1. IF username validation fails, THEN THE System SHALL display the specific validation error
2. IF username availability check fails, THEN THE System SHALL display a network error message
3. IF username creation fails, THEN THE System SHALL display an error and allow retry
4. IF username search fails, THEN THE System SHALL display an error message
5. THE System SHALL log all username-related errors for debugging
