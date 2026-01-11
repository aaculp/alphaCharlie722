# Implementation Plan: Folder Structure Refactor

## Overview

This plan outlines the step-by-step reorganization of the OTW application's folder structure. The approach is incremental, moving one domain at a time to minimize disruption and allow for testing at each step.

## Tasks

- [x] 1. Create new directory structure
  - Create `src/components/ui/` directory
  - Create `src/components/venue/` directory
  - Create `src/components/checkin/` directory
  - Create `src/components/navigation/` directory
  - Create `src/components/shared/` directory
  - Create `src/screens/customer/` directory
  - Create `src/screens/venue/` directory
  - Create `src/screens/auth/` directory
  - Create `src/types/` directory
  - Create `src/services/api/` directory
  - Create `src/utils/formatting/` directory
  - Create `src/utils/validation/` directory
  - Create `src/utils/constants/` directory
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 3.1, 4.1, 5.1, 5.2, 5.3_

- [x] 2. Migrate venue components
  - [x] 2.1 Move venue-related components
    - Move `TestVenueCard.tsx` to `src/components/venue/`
    - Move `VenueCustomerCount.tsx` to `src/components/venue/`
    - Move `ModernVenueCards.tsx` to `src/components/venue/`
    - Move `VenueInfoComponents.tsx` to `src/components/venue/`
    - Move `CompactParking.tsx` to `src/components/venue/`
    - _Requirements: 1.6_
  
  - [x] 2.2 Create venue components index file
    - Create `src/components/venue/index.ts`
    - Export all venue components
    - _Requirements: 1.7, 8.1, 8.6_
  
  - [x] 2.3 Update venue component imports
    - Update imports in HomeScreen
    - Update imports in SearchScreen
    - Update imports in VenueDetailScreen
    - Update imports in other consuming files
    - _Requirements: 1.9, 7.1_
  
  - [x] 2.4 Verify venue components work
    - Test venue cards display correctly
    - Test customer count displays correctly
    - Verify no console errors
    - _Requirements: 1.10, 9.2_

- [x] 3. Migrate check-in components
  - [x] 3.1 Move check-in related components
    - Move `CheckInButton.tsx` to `src/components/checkin/`
    - Move `CheckInModal.tsx` to `src/components/checkin/`
    - Move `UserFeedback.tsx` to `src/components/checkin/`
    - Move `PulseLikeButton.tsx` to `src/components/checkin/`
    - _Requirements: 1.6_
  
  - [x] 3.2 Create check-in components index file
    - Create `src/components/checkin/index.ts`
    - Export all check-in components
    - _Requirements: 1.7, 8.1, 8.6_
  
  - [x] 3.3 Update check-in component imports
    - Update imports in HomeScreen
    - Update imports in VenueDetailScreen
    - Update imports in other consuming files
    - _Requirements: 1.9, 7.1_
  
  - [x] 3.4 Verify check-in components work
    - Test check-in button works
    - Test check-in modal displays
    - Test user feedback works
    - Verify no console errors
    - _Requirements: 1.10, 9.2_

- [x] 4. Migrate navigation components
  - [x] 4.1 Move navigation components
    - Move `NewFloatingTabBar.tsx` to `src/components/navigation/`
    - Move `AnimatedTabBar.tsx` to `src/components/navigation/`
    - _Requirements: 1.6_
  
  - [x] 4.2 Create navigation components index file
    - Create `src/components/navigation/index.ts`
    - Export all navigation components
    - _Requirements: 1.7, 8.1, 8.6_
  
  - [x] 4.3 Update navigation component imports
    - Update imports in AppNavigator
    - _Requirements: 1.9, 7.1_
  
  - [x] 4.4 Verify navigation components work
    - Test tab bar displays correctly
    - Test tab navigation works
    - Verify no console errors
    - _Requirements: 1.10, 9.2_

- [x] 5. Migrate shared components
  - [x] 5.1 Move shared components
    - Move `OTWLogo.tsx` to `src/components/shared/`
    - _Requirements: 1.6_
  
  - [x] 5.2 Create shared components index file
    - Create `src/components/shared/index.ts`
    - Export all shared components
    - _Requirements: 1.7, 8.1, 8.6_
  
  - [x] 5.3 Update shared component imports
    - Update imports in all consuming files
    - _Requirements: 1.9, 7.1_
  
  - [x] 5.4 Verify shared components work
    - Test logo displays correctly
    - Verify no console errors
    - _Requirements: 1.10, 9.2_

- [x] 6. Update main components index
  - Update `src/components/index.ts` to re-export from domain folders
  - Maintain backward compatibility for existing imports
  - _Requirements: 1.8_

- [x] 7. Checkpoint - Verify all components work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Migrate customer screens
  - [x] 8.1 Move customer screens
    - Move `HomeScreen.tsx` to `src/screens/customer/`
    - Move `SearchScreen.tsx` to `src/screens/customer/`
    - Move `VenueDetailScreen.tsx` to `src/screens/customer/`
    - Move `FavoritesScreen.tsx` to `src/screens/customer/`
    - Move `SettingsScreen.tsx` to `src/screens/customer/`
    - Move `QuickPicksScreen.tsx` to `src/screens/customer/`
    - _Requirements: 2.4_
  
  - [x] 8.2 Create customer screens index file
    - Create `src/screens/customer/index.ts`
    - Export all customer screens
    - _Requirements: 2.7, 8.2, 8.6_
  
  - [x] 8.3 Update customer screen imports in navigation
    - Update imports in AppNavigator
    - Update stack navigator imports
    - _Requirements: 2.8, 7.2_
  
  - [x] 8.4 Verify customer screens work
    - Test all customer screens load
    - Test navigation between screens
    - Verify no console errors
    - _Requirements: 2.9, 9.1_

- [x] 9. Migrate venue owner screens
  - [x] 9.1 Move venue owner screens
    - Move `VenueDashboardScreen.tsx` to `src/screens/venue/`
    - _Requirements: 2.5_
  
  - [x] 9.2 Create venue screens index file
    - Create `src/screens/venue/index.ts`
    - Export all venue screens
    - _Requirements: 2.7, 8.2, 8.6_
  
  - [x] 9.3 Update venue screen imports in navigation
    - Update imports in AppNavigator
    - _Requirements: 2.8, 7.2_
  
  - [x] 9.4 Verify venue screens work
    - Test venue dashboard loads
    - Verify no console errors
    - _Requirements: 2.9, 9.1_

- [x] 10. Migrate auth screens
  - [x] 10.1 Move auth screens
    - Move `AuthScreen.tsx` to `src/screens/auth/`
    - Move `SplashScreen.tsx` to `src/screens/auth/`
    - _Requirements: 2.6_
  
  - [x] 10.2 Create auth screens index file
    - Create `src/screens/auth/index.ts`
    - Export all auth screens
    - _Requirements: 2.7, 8.2, 8.6_
  
  - [x] 10.3 Update auth screen imports in navigation
    - Update imports in AppNavigator
    - _Requirements: 2.8, 7.2_
  
  - [x] 10.4 Verify auth screens work
    - Test splash screen displays
    - Test auth screen loads
    - Verify no console errors
    - _Requirements: 2.9, 9.1_

- [x] 11. Update main screens index
  - Update `src/screens/index.ts` to re-export from user type folders
  - Maintain backward compatibility for existing imports
  - _Requirements: 2.10_

- [x] 12. Checkpoint - Verify all screens work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Create and migrate type definitions
  - [x] 13.1 Create venue types file
    - Create `src/types/venue.types.ts`
    - Extract Venue type from service files
    - Extract VenueInsert type
    - Extract VenueQueryOptions interface
    - _Requirements: 3.2, 3.7_
  
  - [x] 13.2 Create user types file
    - Create `src/types/user.types.ts`
    - Extract User type
    - Extract UserType type
    - _Requirements: 3.3, 3.7_
  
  - [x] 13.3 Create navigation types file
    - Create `src/types/navigation.types.ts`
    - Extract RootTabParamList from AppNavigator
    - Extract SettingsStackParamList
    - Extract HomeStackParamList
    - Extract SearchStackParamList
    - _Requirements: 3.4, 3.7_
  
  - [x] 13.4 Create check-in types file
    - Create `src/types/checkin.types.ts`
    - Extract CheckIn interface from service
    - Extract VenueCheckInStats interface
    - _Requirements: 3.5, 3.7_
  
  - [x] 13.5 Create types index file
    - Create `src/types/index.ts`
    - Export all types
    - _Requirements: 3.6, 8.3, 8.6_
  
  - [x] 13.6 Update type imports across codebase
    - Update imports in services
    - Update imports in components
    - Update imports in screens
    - Update imports in hooks
    - Update imports in navigation
    - _Requirements: 3.9, 7.3_
  
  - [x] 13.7 Verify TypeScript compilation
    - Run `npx tsc --noEmit`
    - Fix any type errors
    - _Requirements: 3.10, 9.5_

- [x] 14. Checkpoint - Verify types work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Migrate services to api directory
  - [x] 15.1 Move service files
    - Move `venueService.ts` to `src/services/api/venues.ts`
    - Move `checkInService.ts` to `src/services/api/checkins.ts`
    - Move `authService.ts` to `src/services/api/auth.ts` (if exists)
    - Move `favoriteService.ts` to `src/services/api/favorites.ts`
    - Move `userFeedbackService.ts` to `src/services/api/feedback.ts`
    - _Requirements: 4.2, 4.3, 4.4, 4.5_
  
  - [x] 15.2 Create services api index file
    - Create `src/services/api/index.ts`
    - Export all services
    - _Requirements: 4.6, 8.4, 8.6_
  
  - [x] 15.3 Update service imports
    - Update imports in hooks
    - Update imports in screens
    - Update imports in components
    - _Requirements: 4.8, 7.4_
  
  - [x] 15.4 Verify services work
    - Test venue fetching
    - Test check-in operations
    - Test favorites operations
    - Verify no console errors
    - _Requirements: 4.7, 4.9, 9.3_

- [x] 16. Checkpoint - Verify services work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Migrate formatting utilities
  - [x] 17.1 Move activity level utility
    - Move `activityLevel.ts` to `src/utils/formatting/activity.ts`
    - _Requirements: 5.5_
  
  - [x] 17.2 Create formatting utilities index
    - Create `src/utils/formatting/index.ts`
    - Export all formatting utilities
    - _Requirements: 5.7, 8.5, 8.6_
  
  - [x] 17.3 Update formatting utility imports
    - Update imports in screens
    - Update imports in components
    - _Requirements: 5.8, 7.5_
  
  - [x] 17.4 Verify formatting utilities work
    - Test activity level calculation
    - Verify no console errors
    - _Requirements: 5.9_

- [x] 18. Create constants
  - [x] 18.1 Extract color constants
    - Create `src/utils/constants/colors.ts`
    - Extract activity colors
    - Extract theme colors (if applicable)
    - _Requirements: 5.6, 5.10_
  
  - [x] 18.2 Extract spacing constants
    - Create `src/utils/constants/spacing.ts`
    - Extract spacing values from theme
    - _Requirements: 5.6, 5.10_
  
  - [x] 18.3 Create constants index
    - Create `src/utils/constants/index.ts`
    - Export all constants
    - _Requirements: 5.7, 8.5, 8.6_
  
  - [x] 18.4 Update constant usage
    - Replace magic numbers with constants
    - Update imports
    - _Requirements: 5.8, 5.10_

- [x] 19. Checkpoint - Verify utilities work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 20. Clean up and verify
  - [x] 20.1 Remove old empty directories
    - Remove old `src/components/` files (if empty)
    - Remove old `src/screens/` files (if empty)
    - Remove old `src/services/` files (if empty)
    - Remove old `src/utils/` files (if empty)
  
  - [x] 20.2 Verify no broken imports
    - Search for import errors in IDE
    - Run TypeScript compiler
    - _Requirements: 7.10, 9.9_
  
  - [x] 20.3 Remove unused imports
    - Clean up unused imports across codebase
    - _Requirements: 7.9_
  
  - [x] 20.4 Verify application works
    - Run application
    - Test all screens
    - Test all user interactions
    - Verify no console errors
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.9_

- [x] 21. Update documentation
  - [x] 21.1 Update README.md
    - Document new folder structure
    - Add folder structure diagram
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  
  - [x] 21.2 Document import patterns
    - Add examples of relative imports
    - Add examples of absolute imports
    - Document naming conventions
    - _Requirements: 10.7, 10.8_
  
  - [x] 21.3 Create migration guide
    - Document file placement guidelines
    - Add examples for future features
    - _Requirements: 10.9, 10.10_

- [x] 22. Final checkpoint - Complete refactoring
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Each migration phase should be committed separately
- Test thoroughly after each phase before proceeding
- Keep git history clean for easy rollback
- Run TypeScript compiler after each major change
- Verify no console errors after each phase
- Maintain backward compatibility during migration
