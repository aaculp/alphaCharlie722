# Implementation Plan: Flash Offers MVP

## Overview

This implementation plan covers the Flash Offer system - a time-limited, claim-limited promotional feature that allows venues to send push notifications for special offers. Users must be checked in to claim, receive a 6-digit token, and venue staff can redeem tokens through the dashboard.

## Tasks

- [x] 1. Database Setup
  - [x] 1.1 Create database migration files
    - Create `flash_offers` table with all columns and constraints
    - Create `flash_offer_claims` table with uniqueness constraints
    - Create `flash_offer_events` table for analytics tracking
    - Add indexes for performance (venue_id, status, token lookups)
    - _Tech: Supabase SQL migration_
  
  - [x] 1.2 Set up Row Level Security (RLS) policies
    - Venues can read/write their own offers
    - Users can read active offers and their own claims
    - Staff can redeem claims for their venue
    - _Tech: Supabase RLS policies_
  
  - [x] 1.3 Run migrations and verify schema
    - Execute migration in Supabase SQL editor
    - Verify tables, indexes, and constraints created
    - Test RLS policies with test data
    - _Tech: Supabase dashboard_

- [x] 2. Backend Services - Flash Offer Management
  - [x] 2.1 Create FlashOfferService
    - `createFlashOffer(venueId, offerData)` - Create new offer
    - `getVenueOffers(venueId, status?)` - Get venue's offers
    - `getActiveOffers(location, radius)` - Get nearby active offers
    - `updateOfferStatus(offerId, status)` - Update offer status
    - `getOfferDetails(offerId)` - Get single offer with stats
    - _Tech: TypeScript service in `src/services/api/flashOffers.ts`_
  
  - [x] 2.2 Create ClaimService
    - `claimOffer(offerId, userId)` - Claim offer with validation
    - `getUserClaims(userId, status?)` - Get user's claims
    - `getClaimByToken(venueId, token)` - Find claim by token
    - `redeemClaim(claimId, staffUserId)` - Redeem a claim
    - `validateClaimEligibility(offerId, userId)` - Check if user can claim
    - _Tech: TypeScript service in `src/services/api/flashOfferClaims.ts`_
  
  - [x] 2.3 Create token generation utility
    - Generate cryptographically secure 6-digit tokens
    - Ensure uniqueness within offer scope
    - Format with leading zeros (e.g., "004219")
    - _Tech: Utility function in `src/utils/tokenGenerator.ts`_
  
  - [x] 2.4 Implement atomic claim logic
    - Use database transactions for claim creation
    - Lock offer row during claim to prevent race conditions
    - Increment `claimed_count` atomically
    - Handle "offer full" edge case gracefully
    - _Tech: Supabase transaction with row locking_

- [x] 3. Backend Services - Push Notifications
  - [x] 3.1 Create FlashOfferNotificationService
    - `sendFlashOfferPush(offerId)` - Send push to targeted users
    - `getTargetedUsers(venueId, radius, favoritesOnly)` - Get user list
    - Build notification payload with deep link
    - Track push_sent events
    - _Tech: Integrate with existing FCMService_
  
  - [x] 3.2 Implement user targeting logic
    - Query users within radius of venue
    - Filter by favorites if `target_favorites_only` is true
    - Exclude users who already claimed
    - Get FCM tokens for eligible users
    - _Tech: Supabase query with PostGIS distance calculation_
  
  - [x] 3.3 Set up deep linking for offers
    - Configure deep link scheme: `otw://flash-offer/{offerId}`
    - Handle deep link in app navigation
    - Navigate to offer detail screen
    - _Tech: React Navigation deep linking configuration_

- [x] 4. Backend Services - Expiration & Cleanup
  - [x] 4.1 Create expiration background job
    - Expire offers past `end_time`
    - Expire unclaimed tokens past `expires_at`
    - Update offer status to 'full' when `claimed_count >= max_claims`
    - _Tech: Supabase Edge Function or cron job_
  
  - [x] 4.2 Set up scheduled execution
    - Run expiration job every 1-5 minutes
    - Log execution results
    - Handle errors gracefully
    - _Tech: Supabase pg_cron or external scheduler_

- [x] 5. TypeScript Types & Interfaces
  - [x] 5.1 Create flash offer types
    - `FlashOffer` interface matching database schema
    - `FlashOfferStatus` enum
    - `CreateFlashOfferInput` type
    - `UpdateFlashOfferInput` type
    - _Tech: `src/types/flashOffer.types.ts`_
  
  - [x] 5.2 Create claim types
    - `FlashOfferClaim` interface
    - `ClaimStatus` enum
    - `ClaimValidationResult` type
    - _Tech: `src/types/flashOfferClaim.types.ts`_

- [x] 6. Venue Owner UI - Offer Creation
  - [x] 6.1 Create FlashOfferCreationScreen
    - Form with title, description, value cap inputs
    - Max claims input (number)
    - Start/end time pickers
    - Radius selector (default 1 mile)
    - "Send Push Notification" toggle
    - Submit button
    - _Tech: React Native screen in `src/screens/venue/`_
  
  - [x] 6.2 Implement form validation
    - Title: 3-100 characters
    - Description: 10-500 characters
    - Max claims: 1-1000
    - End time must be after start time
    - Start time must be in future (or now for immediate)
    - _Tech: Form validation library or custom validation_
  
  - [x] 6.3 Handle offer creation flow
    - Call `createFlashOffer` API
    - Show loading state during creation
    - On success: show confirmation and navigate to offer list
    - On error: show error message
    - _Tech: React hooks with error handling_

- [x] 7. Venue Owner UI - Offer Management
  - [x] 7.1 Create FlashOfferListScreen
    - Display venue's offers grouped by status (active, scheduled, expired)
    - Show key stats: claims/max, time remaining, status
    - Pull-to-refresh functionality
    - Tap to view details
    - _Tech: React Native FlatList with sections_
  
  - [x] 7.2 Create FlashOfferDetailScreen (Venue View)
    - Show full offer details
    - Display real-time stats: views, claims, redemptions
    - Show claim list with tokens and redemption status
    - "Cancel Offer" button (if active)
    - _Tech: React Native screen with real-time updates_
  
  - [x] 7.3 Add offer management to venue dashboard
    - Add "Flash Offers" card to dashboard
    - Show active offer count
    - Quick action to create new offer
    - Navigate to offer list
    - _Tech: Update existing VenueDashboardScreen_

- [x] 8. Venue Owner UI - Token Redemption
  - [x] 8.1 Create TokenRedemptionScreen
    - 6-digit token input (numeric keypad)
    - Auto-format with leading zeros
    - "Redeem" button
    - Show claim details after validation
    - Confirm redemption flow
    - _Tech: React Native screen with custom input_
  
  - [x] 8.2 Implement token validation
    - Call `getClaimByToken` API
    - Validate token exists and belongs to venue
    - Check claim status (not already redeemed)
    - Check not expired
    - Show appropriate error messages
    - _Tech: API integration with error handling_
  
  - [x] 8.3 Implement redemption confirmation
    - Show claim details: user, offer, claimed time
    - "Confirm Redemption" button
    - Call `redeemClaim` API
    - Show success confirmation
    - Update UI to reflect redeemed status
    - _Tech: React Native modal or screen_

- [x] 9. Customer UI - Offer Discovery
  - [x] 9.1 Add "Flash Offers" section to HomeScreen
    - Horizontal scrolling section below existing content
    - Show active offers within radius
    - Display offer card with title, venue, time remaining, claims left
    - Tap to view details
    - _Tech: Update existing HomeScreen component_
  
  - [x] 9.2 Create FlashOfferCard component
    - Show offer title and venue name
    - Display countdown timer
    - Show remaining claims (e.g., "7 of 10 left")
    - Visual indicator for urgency (low claims, ending soon)
    - _Tech: Reusable component in `src/components/flashOffer/`_
  
  - [x] 9.3 Implement offer fetching
    - Get user's current location
    - Fetch active offers within radius
    - Update when location changes
    - Handle location permission errors
    - _Tech: Use existing LocationContext_

- [x] 10. Customer UI - Offer Detail & Claiming
  - [x] 10.1 Create FlashOfferDetailScreen (Customer View)
    - Show full offer details
    - Display countdown timer (real-time)
    - Show remaining claims (real-time)
    - Display venue information
    - "Claim Now" button (conditional)
    - Check-in requirement message
    - _Tech: React Native screen with real-time updates_
  
  - [x] 10.2 Implement claim eligibility check
    - Check if user is checked into venue
    - Check if offer is still active
    - Check if claims are available
    - Check if user already claimed
    - Enable/disable claim button accordingly
    - Show appropriate messages
    - _Tech: Real-time validation with existing check-in system_
  
  - [x] 10.3 Implement claim flow
    - Call `claimOffer` API on button press
    - Show loading state
    - On success: navigate to claim confirmation
    - On error: show specific error message
    - Handle edge cases (offer just filled, expired)
    - _Tech: API integration with error handling_
  
  - [x] 10.4 Create ClaimConfirmationScreen
    - Show success message
    - Display 6-digit token prominently
    - Show expiration time
    - "Show to Staff" instruction
    - Button to view in "My Claims"
    - _Tech: React Native screen_

- [x] 11. Customer UI - Claim Management
  - [x] 11.1 Create MyClaimsScreen
    - List user's claims grouped by status (active, redeemed, expired)
    - Show offer title, venue, token, status
    - Tap to view claim details
    - Pull-to-refresh
    - _Tech: React Native screen with FlatList_
  
  - [x] 11.2 Create ClaimDetailScreen
    - Show full claim details
    - Display 6-digit token prominently (if not redeemed)
    - Show offer details
    - Display expiration countdown
    - Show redemption details (if redeemed)
    - Navigate to venue detail
    - _Tech: React Native screen_
  
  - [x] 11.3 Add claims to user profile/settings
    - Add "My Flash Offers" menu item
    - Show count of active claims
    - Navigate to MyClaimsScreen
    - _Tech: Update existing ProfileScreen or SettingsScreen_

- [x] 12. Push Notification Handling
  - [x] 12.1 Configure notification payload
    - Title: Offer title
    - Body: Offer description (truncated)
    - Data: `{ type: 'flash_offer', offer_id: '...' }`
    - Deep link: `otw://flash-offer/{offerId}`
    - _Tech: FCM notification format_
  
  - [x] 12.2 Handle notification tap
    - Parse notification data
    - Navigate to FlashOfferDetailScreen
    - Handle app in foreground/background/killed states
    - _Tech: React Native Firebase messaging handlers_
  
  - [x] 12.3 Show in-app notification
    - Display banner when app is in foreground
    - Show offer preview
    - Tap to view details
    - _Tech: Custom in-app notification component_

- [x] 13. Real-Time Updates
  - [x] 13.1 Implement offer countdown timers
    - Update every second
    - Show time remaining in human-readable format
    - Handle expiration (disable claim button, show expired message)
    - _Tech: React hooks with setInterval_
  
  - [x] 13.2 Implement real-time claim count updates
    - Subscribe to offer changes
    - Update remaining claims display
    - Show "Offer Full" when max reached
    - _Tech: Supabase real-time subscriptions_
  
  - [x] 13.3 Handle offer status changes
    - Update UI when offer expires
    - Update UI when offer fills up
    - Show appropriate messages
    - _Tech: Real-time subscription handlers_

- [-] 14. Analytics & Tracking
  - [x] 14.1 Implement event tracking
    - Track `push_sent` when notification sent
    - Track `view` when user views offer detail
    - Track `claim` when user claims offer
    - Track `redeem` when staff redeems token
    - _Tech: Insert into `flash_offer_events` table_
  
  - [x] 14.2 Create analytics dashboard for venues
    - Show offer performance metrics
    - Display push sent, views, claims, redemptions
    - Calculate open rate, claim rate, redemption rate
    - Show time-to-full metric
    - _Tech: Add to FlashOfferDetailScreen (venue view)_
  
  - [x] 14.3 Implement analytics queries
    - Aggregate events by type
    - Calculate conversion rates
    - Get time-series data for charts
    - _Tech: Supabase queries with aggregations_

- [x] 15. Error Handling & Edge Cases
  - [x] 15.1 Handle network errors
    - Show retry options
    - Cache data when offline
    - Sync when back online
    - _Tech: Error boundaries and retry logic_
  
  - [x] 15.2 Handle race conditions
    - Offer fills up while user is claiming
    - Offer expires while user is viewing
    - Token redeemed by another staff member
    - Show appropriate error messages
    - _Tech: Optimistic UI with rollback_
  
  - [x] 15.3 Handle permission errors
    - Location permission denied
    - Notification permission denied
    - Show helpful messages and settings links
    - _Tech: Permission handling utilities_

- [-] 16. Testing & Validation
  - [x] 16.1 Test offer creation flow
    - Create offer with various parameters
    - Verify push notification sent
    - Verify offer appears in list
    - Test validation errors
    - _Manual testing_
  
  - [x] 16.2 Test claim flow
    - Claim offer while checked in
    - Verify token generated
    - Test duplicate claim prevention
    - Test claim limit enforcement
    - Test expiration handling
    - _Manual testing_
  
  - [x] 16.3 Test redemption flow
    - Redeem valid token
    - Test invalid token handling
    - Test already-redeemed token
    - Test expired token
    - Verify counts update correctly
    - _Manual testing_
  
  - [x] 16.4 Test edge cases
    - Offer expires during claim
    - Offer fills up during claim
    - User checks out during claim
    - Network interruption during claim
    - _Manual testing_

- [ ] 17. Polish & Optimization
  - [x] 17.1 Add loading states
    - Skeleton screens for lists
    - Loading spinners for actions
    - Disable buttons during operations
    - _Tech: Loading state management_
  
  - [x] 17.2 Add animations
    - Smooth transitions between screens
    - Animated countdown timers
    - Success animations for claims
    - _Tech: React Native Animated or Reanimated_
  
  - [x] 17.3 Optimize performance
    - Implement pagination for offer lists
    - Cache frequently accessed data
    - Optimize real-time subscriptions
    - _Tech: Performance optimization techniques_
  
  - [x] 17.4 Add haptic feedback
    - Vibrate on successful claim
    - Vibrate on successful redemption
    - Subtle feedback for button presses
    - _Tech: React Native Haptics_

- [ ] 18. Documentation
  - [x] 18.1 Document API endpoints
    - Document all service methods
    - Add JSDoc comments
    - Include example usage
    - _Tech: JSDoc or TypeDoc_
  
  - [x] 18.2 Create user guide
    - How to create flash offers (venue)
    - How to claim offers (customer)
    - How to redeem tokens (venue staff)
    - _Tech: Markdown documentation_
  
  - [x] 18.3 Add inline help
    - Tooltips for complex features
    - Help text for form fields
    - FAQ section in settings
    - _Tech: In-app help components_

## Notes

- **Priority**: Focus on core flow first (create → push → claim → redeem)
- **Testing**: Test with real devices for push notifications and location
- **Performance**: Monitor database query performance with indexes
- **Security**: Ensure RLS policies prevent unauthorized access
- **UX**: Keep the flow simple - users should be able to claim in < 30 seconds
