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
  VenueCardDialog,
  VenueSignUpForm,
  VenueInfoComponents,
  FlashOfferCreationModal
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
  default as OTWLogo,
  HelpTooltip,
  HelpText,
  FAQSection
} from './shared';
export type { FAQItem } from './shared';

// Re-export all UI components from the ui domain folder
export {
  VenueCustomerCountChip,
  VenueEngagementChip,
  CompactVenueCard,
  VenuesCarouselSection,
  WideVenueCard
} from './ui';
