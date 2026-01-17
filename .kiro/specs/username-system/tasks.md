# Implementation Plan: Username System

## Overview

Implement unique username handles for users with @ prefix search functionality. This enables better user discovery and provides a unified search experience.

## Tasks

- [ ] 1. Database Schema Updates
  - Run SQL migration to add username and bio columns to profiles table
  - Add uniqueness constraint on username (case-insensitive)
  - Add format validation constraint
  - Create indexes for username search performance
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 9.1, 9.2_

- [ ] 2. Update Type Definitions
  - [ ] 2.1 Update Database types in `src/lib/supabase.ts`
    - Add username and bio fields to profiles Row type
    - Add username and bio to profiles Insert type
    - Add username and bio to profiles Update type
    - _Requirements: 1.1_

  - [ ]* 2.2 Write property test for type consistency
    - **Property 1: Username Format Validation**
    - **Validates: Requirements 1.3, 1.4**

- [ ] 3. Create Username Validation Utility
  - [ ] 3.1 Create `src/utils/validation/username.ts`
    - Implement UsernameValidator class
    - Add validate() method for format checking
    - Add checkAvailability() method for uniqueness checking
    - Add constants for min/max length and pattern
    - _Requirements: 1.3, 1.4, 2.3, 2.4_

  - [ ]* 3.2 Write unit tests for username validation
    - Test format validation (valid/invalid patterns)
    - Test length validation (too short, too long, valid)
    - Test character validation (special chars, spaces, etc.)
    - _Requirements: 1.3, 1.4_

  - [ ]* 3.3 Write property test for username validation
    - **Property 2: Username Format Validation**
    - **Validates: Requirements 1.3, 1.4**

- [ ] 4. Update Friend Search Service
  - [ ] 4.1 Update `FriendsService.searchUsers()` in `src/services/api/friends.ts`
    - Add @ prefix detection logic
    - Update SELECT to include username and bio fields
    - Add username to search query (OR condition)
    - Implement username-only search when @ prefix detected
    - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2_

  - [ ]* 4.2 Write unit tests for search service
    - Test @ prefix detection
    - Test username search
    - Test combined name/username/email search
    - Test blocked user filtering
    - _Requirements: 4.4, 4.5, 5.1, 5.2_

  - [ ]* 4.3 Write property test for search filtering
    - **Property 4: Search Result Filtering**
    - **Validates: Requirements 4.4, 4.5**

- [ ] 5. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Update Sign-Up Form
  - [ ] 6.1 Update `src/components/UserSignUpForm.tsx`
    - Add username state and error state
    - Add username input field with @ prefix display
    - Implement real-time format validation
    - Implement debounced availability checking
    - Add loading indicator for availability check
    - Add helper text for username requirements
    - Update form submission to include username
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7_

  - [ ]* 6.2 Write unit tests for sign-up form
    - Test username input validation
    - Test availability checking
    - Test error display
    - Test form submission with username
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 7. Update Search Screen
  - [ ] 7.1 Update `src/screens/customer/SearchScreen.tsx`
    - Add search mode state (venues/users)
    - Add user results state
    - Implement @ prefix detection in search handler
    - Add debounced user search function
    - Create renderUserItem component
    - Add conditional rendering for venue vs user results
    - Add empty state for user search
    - Add loading state for user search
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.5, 6.6_

  - [ ]* 7.2 Write property test for @ prefix detection
    - **Property 3: Search Prefix Detection**
    - **Validates: Requirements 5.1, 5.2**

  - [ ]* 7.3 Write unit tests for search screen
    - Test @ prefix detection
    - Test search mode switching
    - Test user result rendering
    - Test empty state display
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 8. Create Friendship Status Badge Component
  - [ ] 8.1 Create `src/components/social/FriendshipStatusBadge.tsx`
    - Display friendship status (friend, pending, none)
    - Show "Add Friend" button if not friends
    - Show "Pending" badge if request sent
    - Show "Friends" badge if already friends
    - Handle add friend action
    - _Requirements: 6.3_

  - [ ]* 8.2 Write unit tests for status badge
    - Test status display for each state
    - Test add friend action
    - _Requirements: 6.3_

- [ ] 9. Update Profile Display Components
  - [ ] 9.1 Update `src/components/social/FriendRequestCard.tsx`
    - Add username display below name
    - Style username with @ prefix
    - _Requirements: 3.2_

  - [ ] 9.2 Update `src/components/social/FriendActivityFeed.tsx`
    - Add username display in activity items
    - _Requirements: 3.3_

  - [ ] 9.3 Update `src/screens/customer/ProfileScreen.tsx`
    - Add username display in hero section
    - Add bio display in about section
    - Add bio editing capability
    - _Requirements: 3.1, 8.3, 8.4_

  - [ ] 9.4 Update `src/components/profile/FollowersCard.tsx`
    - Add username display for followers
    - _Requirements: 3.4_

  - [ ]* 9.5 Write unit tests for profile components
    - Test username display
    - Test bio display
    - Test @ prefix formatting
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 10. Checkpoint - Ensure UI tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement Existing User Migration
  - [ ] 11.1 Create username prompt modal component
    - Create `src/components/social/UsernamePromptModal.tsx`
    - Display modal on login if username is null
    - Show username input with validation
    - Allow skip option
    - Generate default username suggestion
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 11.2 Add migration check to AuthContext
    - Check if user has username on login
    - Show username prompt modal if needed
    - _Requirements: 7.1_

  - [ ]* 11.3 Write unit tests for migration flow
    - Test modal display logic
    - Test username setting
    - Test skip functionality
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 12. Add Username to Profile Service
  - [ ] 12.1 Update `src/services/api/profile.ts`
    - Add updateUsername() method
    - Add updateBio() method
    - Update fetchCompleteUserProfile() to include username and bio
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

  - [ ]* 12.2 Write unit tests for profile service
    - Test username update
    - Test bio update
    - Test profile fetch with new fields
    - _Requirements: 8.1, 8.2, 8.3_

- [ ] 13. Error Handling and Validation
  - [ ] 13.1 Add error handling to all username operations
    - Add try-catch blocks
    - Display user-friendly error messages
    - Log errors for debugging
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 13.2 Write unit tests for error handling
    - Test validation error display
    - Test network error handling
    - Test database error handling
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 14. Performance Optimization
  - [ ] 14.1 Verify database indexes are created
    - Check username index exists
    - Check case-insensitive index exists
    - Test query performance
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ]* 14.2 Write performance tests
    - Test search query execution time
    - Test availability check execution time
    - _Requirements: 9.3_

- [ ] 15. Final Integration Testing
  - [ ] 15.1 Test complete sign-up flow with username
    - Test new user registration
    - Test username validation
    - Test availability checking
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.7_

  - [ ] 15.2 Test @ prefix search flow
    - Test @ prefix detection
    - Test user search results
    - Test navigation to user profile
    - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.4_

  - [ ] 15.3 Test username display across app
    - Test profile screen
    - Test friend requests
    - Test activity feed
    - Test friend lists
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 15.4 Test existing user migration
    - Test login without username
    - Test username prompt display
    - Test username setting
    - Test skip functionality
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 16. Final Checkpoint - Complete testing
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Database migration should be run first before any code changes
- Username validation should be implemented before sign-up form updates
- Search service updates should be completed before UI updates
- Existing user migration can be implemented last as it's not blocking
