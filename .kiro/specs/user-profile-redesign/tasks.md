# Implementation Plan: User Profile Redesign

## Overview

This implementation plan breaks down the user profile redesign into discrete, testable tasks. The approach follows an incremental development strategy, building from core components to full integration.

## Tasks

- [x] 1. Set up project structure and types
  - Create TypeScript interfaces for UserProfile, ProfileScreenState, and component props
  - Define SettingType enum
  - Set up test file structure
  - _Requirements: All_

- [x] 2. Implement HeroSection component
  - [x] 2.1 Create HeroSection component with profile image display
    - Implement full-width image container (400pt height)
    - Add placeholder image support
    - Handle image loading states
    - _Requirements: 1.1, 1.2_

  - [ ]* 2.2 Write property test for placeholder display
    - **Property 1: Placeholder Display**
    - **Validates: Requirements 1.2**

  - [x] 2.3 Add username overlay at bottom-left
    - Position username text with proper styling
    - Add semi-transparent background for readability
    - _Requirements: 1.5_

  - [x] 2.4 Add share and camera buttons at bottom-right
    - Create camera button with icon
    - Create share button with icon
    - Position buttons with proper spacing
    - _Requirements: 1.6, 1.7_

  - [ ]* 2.5 Write unit tests for HeroSection layout
    - Test username positioning
    - Test button positioning
    - Test placeholder rendering
    - _Requirements: 1.5, 1.6, 1.7_

- [x] 3. Implement photo picker integration
  - [x] 3.1 Set up react-native-image-picker
    - Install and configure library
    - Add iOS/Android permissions
    - Create photo picker utility function
    - _Requirements: 1.3, 6.1_

  - [x] 3.2 Implement photo selection handler
    - Handle camera button press
    - Open image picker with configuration
    - Validate selected image format
    - _Requirements: 1.3, 1.4, 6.1_

  - [ ]* 3.3 Write property test for image format validation
    - **Property 10: Image Format Validation**
    - **Validates: Requirements 6.1**

  - [x] 3.3 Implement image compression
    - Resize image to max 1000x1000px
    - Compress with 0.8 quality
    - Convert to appropriate format
    - _Requirements: 6.2_

  - [ ]* 3.4 Write property test for image compression
    - **Property 11: Image Compression**
    - **Validates: Requirements 6.2**

  - [x] 3.5 Implement photo upload to backend
    - Create upload API service
    - Handle upload progress
    - Handle upload errors
    - _Requirements: 6.3, 6.4_

  - [ ]* 3.6 Write property test for photo URL storage
    - **Property 12: Photo URL Storage**
    - **Validates: Requirements 6.4**

  - [ ]* 3.7 Write property test for photo update consistency
    - **Property 2: Photo Update Consistency**
    - **Validates: Requirements 1.4**

- [x] 4. Checkpoint - Ensure hero section and photo upload work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement AboutMeSection component
  - [x] 5.1 Create AboutMeSection with read mode
    - Display "About me" title with edit icon
    - Display about text in read-only mode
    - Style with proper typography
    - _Requirements: 2.1, 2.6_

  - [x] 5.2 Implement edit mode toggle
    - Add edit button handler
    - Switch between read and edit modes
    - Show checkmark icon in edit mode
    - _Requirements: 2.2, 2.7_

  - [ ]* 5.3 Write property test for edit mode state transition
    - **Property 3: Edit Mode State Transition**
    - **Validates: Requirements 2.2**

  - [ ]* 5.4 Write property test for edit icon visibility
    - **Property 5: Edit Icon Visibility**
    - **Validates: Requirements 2.6, 2.7**

  - [x] 5.5 Create edit mode with TextInput
    - Add multiline TextInput
    - Implement character limit (500 chars)
    - Add save button
    - _Requirements: 2.3, 2.4_

  - [x] 5.6 Implement save functionality
    - Persist about text to backend
    - Update local state
    - Exit edit mode
    - Handle save errors
    - _Requirements: 2.4, 2.5_

  - [ ]* 5.7 Write property test for about text persistence
    - **Property 4: About Text Persistence**
    - **Validates: Requirements 2.4, 2.5**

  - [ ]* 5.8 Write unit tests for AboutMeSection
    - Test edit mode toggle
    - Test save button
    - Test character limit
    - _Requirements: 2.2, 2.3, 2.4_

- [x] 6. Implement TabNavigation component
  - [x] 6.1 Create TabNavigation with two tabs
    - Create Main Info tab
    - Create Settings tab
    - Set Main Info as default active
    - _Requirements: 3.1, 3.2_

  - [x] 6.2 Implement tab switching logic
    - Handle tab press events
    - Update active tab state
    - Trigger content change
    - _Requirements: 3.3, 3.4_

  - [x] 6.3 Add active tab styling
    - Add bottom border indicator
    - Apply bold text to active tab
    - _Requirements: 3.5, 3.6_

  - [ ]* 6.4 Write property test for active tab styling
    - **Property 6: Active Tab Styling**
    - **Validates: Requirements 3.5, 3.6**

  - [ ]* 6.5 Write unit tests for TabNavigation
    - Test default active tab
    - Test tab switching
    - Test active styling
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 7. Implement Main Info tab content
  - [x] 7.1 Create FollowersCard component
    - Display follower count
    - Show avatar row (up to 4 avatars)
    - Add "Invite friend" button
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 7.2 Write property test for follower avatar rendering
    - **Property 8: Follower Avatar Rendering**
    - **Validates: Requirements 4.3**

  - [x] 7.3 Create StatisticsCard component
    - Display check-ins stat with location icon
    - Display favorites stat with heart icon
    - Display friends stat with people icon
    - _Requirements: 4.5, 4.6, 4.7, 4.8_

  - [ ]* 7.4 Write property test for statistics display
    - **Property 7: Statistics Display**
    - **Validates: Requirements 4.6, 4.7, 4.8**

  - [ ]* 7.5 Write unit tests for Main Info components
    - Test FollowersCard rendering
    - Test StatisticsCard rendering
    - Test invite button
    - _Requirements: 4.1, 4.2, 4.4, 4.5_

- [x] 8. Implement Settings tab content
  - [x] 8.1 Create SettingsMenu component
    - Create settings list structure
    - Add Notifications option with icon
    - Add Privacy option with icon
    - Add Security option with icon
    - Add Help & Support option with icon
    - Add Log Out option with red styling
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 8.2 Implement setting navigation handlers
    - Handle setting option press
    - Trigger navigation with setting type
    - _Requirements: 5.7_

  - [ ]* 8.3 Write property test for setting navigation
    - **Property 9: Setting Navigation**
    - **Validates: Requirements 5.7**

  - [ ]* 8.4 Write unit tests for SettingsMenu
    - Test all options render
    - Test logout styling
    - Test navigation callbacks
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 9. Checkpoint - Ensure tabs and content work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement data fetching and state management
  - [x] 10.1 Create profile data service
    - Implement fetchUserProfile API call
    - Implement updateAboutText API call
    - Implement uploadProfilePhoto API call
    - _Requirements: 6.5_

  - [x] 10.2 Set up ProfileScreen state management
    - Initialize state with default values
    - Implement data fetching on mount
    - Handle loading states
    - Handle error states
    - _Requirements: 6.5, 6.6_

  - [ ]* 10.3 Write property test for conditional photo display
    - **Property 13: Conditional Photo Display**
    - **Validates: Requirements 6.6**

  - [ ]* 10.4 Write unit tests for data fetching
    - Test profile load
    - Test error handling
    - Test loading states
    - _Requirements: 6.5, 6.7_

- [x] 11. Implement accessibility features
  - [x] 11.1 Add accessibility labels to all interactive elements
    - Add labels to hero buttons
    - Add labels to edit button
    - Add labels to tabs
    - Add labels to settings options
    - _Requirements: 8.1_

  - [ ]* 11.2 Write property test for accessibility labels
    - **Property 15: Accessibility Labels**
    - **Validates: Requirements 8.1**

  - [x] 11.3 Implement screen reader announcements
    - Announce tab changes
    - Announce edit mode entry
    - _Requirements: 8.2, 8.3_

  - [ ]* 11.4 Write property test for tab change announcements
    - **Property 16: Tab Change Announcements**
    - **Validates: Requirements 8.2**

  - [ ]* 11.5 Write property test for edit mode announcements
    - **Property 17: Edit Mode Announcements**
    - **Validates: Requirements 8.3**

  - [x] 11.6 Ensure touch target sizes
    - Verify all buttons meet 44pt minimum
    - Add minHeight/minWidth where needed
    - _Requirements: 7.3, 8.4_

  - [ ]* 11.7 Write property test for touch target accessibility
    - **Property 14: Touch Target Accessibility**
    - **Validates: Requirements 7.3, 8.4**

- [x] 12. Implement responsive layout
  - [x] 12.1 Add responsive hero section height
    - Calculate height based on screen dimensions
    - Maintain aspect ratio
    - _Requirements: 7.1_

  - [x] 12.2 Add responsive spacing
    - Adjust padding for small screens
    - Maintain spacing for large screens
    - _Requirements: 7.4_

  - [ ]* 12.3 Write unit tests for responsive layout
    - Test hero height calculation
    - Test spacing adjustments
    - _Requirements: 7.1, 7.4_

- [x] 13. Implement error handling
  - [x] 13.1 Add photo upload error handling
    - Handle network errors
    - Handle invalid format errors
    - Handle file size errors
    - Display appropriate error messages
    - _Requirements: 6.7_

  - [x] 13.2 Add about text save error handling
    - Handle network errors
    - Handle validation errors
    - Display appropriate error messages
    - _Requirements: 2.4_

  - [ ]* 13.3 Write unit tests for error handling
    - Test photo upload errors
    - Test save errors
    - Test error message display
    - _Requirements: 6.7_

- [x] 14. Integration and polish
  - [x] 14.1 Wire all components together in ProfileScreen
    - Integrate HeroSection
    - Integrate AboutMeSection
    - Integrate TabNavigation
    - Integrate tab content
    - _Requirements: All_

  - [x] 14.2 Add loading states and animations
    - Add photo upload progress indicator
    - Add save loading state
    - Add tab transition animation
    - _Requirements: 3.7_

  - [x] 14.3 Apply final styling and theming
    - Apply color scheme
    - Apply typography
    - Apply shadows and borders
    - Ensure dark mode support
    - _Requirements: All_

  - [ ]* 14.4 Write integration tests
    - Test complete photo upload flow
    - Test complete about edit flow
    - Test tab switching with content
    - _Requirements: All_

- [x] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
