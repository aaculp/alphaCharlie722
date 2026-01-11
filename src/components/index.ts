/**
 * Components Index
 * 
 * This file re-exports all components from their respective domain folders.
 * This maintains backward compatibility for existing imports while supporting
 * the new domain-based organization.
 */

// Root-level components (not yet migrated to domain folders)
export { default as UserSignUpForm } from './UserSignUpForm';

// Re-export all venue components from the venue domain folder
export { 
  TestVenueCard,
  VenueCustomerCount,
  VenueCardDialog,
  VenueEngagementChip,
  VenueSignUpForm,
  WaitTimesCard,
  PopularItemsCard,
  AtmosphereTagsCard,
  ParkingInfoCard,
  VenueInfoCards,
  ModernVenueCards,
  CompactWaitTimes,
  CompactAtmosphere,
  CompactParking
} from './venue';

// Re-export all check-in components from the checkin domain folder
export {
  CheckInButton,
  CheckInModal,
  UserFeedback,
  PulseLikeButton
} from './checkin';

// Re-export all navigation components from the navigation domain folder
export {
  NewFloatingTabBar,
  AnimatedTabBar
} from './navigation';

// Re-export all shared components from the shared domain folder
export {
  OTWLogo
} from './shared';