# alphaCharlie722

A React Native app with bottom tab navigation featuring venue discovery and user settings.

## Navigation Structure

### Bottom Tab Navigator
- **Home (Feed)**: Displays a feed of featured venues with images, ratings, and descriptions
- **Search**: Search and browse all venues with detailed filtering
- **Settings**: User settings and experimental features

### Search Stack
- **Search List**: Main search interface with search bar and venue list
- **Venue Detail**: Detailed venue information including contact info, hours, and amenities

## Features

### Home Screen
- Feed of featured venues
- Venue cards with images, ratings, and descriptions
- Smooth scrolling interface

### Search Screen
- Real-time search functionality
- Filter by venue name, category, or location
- Venue list with ratings and distance
- Navigation to detailed venue pages

### Venue Detail Screen
- Comprehensive venue information
- Contact details with direct calling and website links
- Operating hours
- Amenities and features
- Google Maps integration for directions

### Settings Screen
- User profile management
- Notification preferences
- Location services toggle
- Dark mode support
- Experimental features section
- Support and legal information
- Account management

## Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

### Step 1: Database Setup

Set up your Supabase database by running the SQL scripts in the `database/` directory. See `database/README.md` for detailed instructions.

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Install iOS Dependencies (iOS only)

For iOS, install CocoaPods dependencies:

```bash
bundle install
bundle exec pod install
```

### Step 4: Start Metro

```bash
npm start
```

### Step 5: Run the App

#### Quick Start (Recommended)
```bash
npm run dev:full
```
This command starts the emulator, Metro bundler, and builds/installs the app all at once.

#### Individual Commands
```bash
# Start emulator only
npm run emulator

# Start Metro bundler only  
npm start

# Build and install app (after emulator and Metro are running)
npm run android

# For iOS
npm run ios
```

#### Development Scripts
```bash
# Start emulator + Metro (you'll need to run android separately)
npm run dev

# Clean build and fresh start (if you have build issues)
npm run fresh-start

# Clean build cache only
npm run clean
```

## Dependencies

- React Navigation v6 (Bottom Tabs & Native Stack)
- React Native Vector Icons (Ionicons)
- React Native Safe Area Context
- React Native Screens

## Project Structure

The OTW application follows a domain-driven folder structure for improved code organization and maintainability.

```
src/
├── assets/
│   └── images/              # Logo assets and images
├── components/              # UI Components organized by domain
│   ├── checkin/            # Check-in related components
│   │   ├── CheckInButton.tsx
│   │   ├── CheckInModal.tsx
│   │   ├── PulseLikeButton.tsx
│   │   ├── UserFeedback.tsx
│   │   └── index.ts
│   ├── navigation/         # Navigation components
│   │   ├── AnimatedTabBar.tsx
│   │   ├── NewFloatingTabBar.tsx
│   │   └── index.ts
│   ├── shared/             # Shared components across features
│   │   ├── OTWLogo.tsx
│   │   └── index.ts
│   ├── ui/                 # Reusable UI primitives (future)
│   ├── venue/              # Venue-specific components
│   │   ├── TestVenueCard.tsx
│   │   ├── VenueCardDialog.tsx
│   │   ├── VenueCustomerCount.tsx
│   │   ├── VenueEngagementChip.tsx
│   │   ├── VenueInfoComponents.tsx
│   │   ├── VenueSignUpForm.tsx
│   │   └── index.ts
│   └── index.ts            # Main component exports
├── contexts/               # React contexts
│   ├── AuthContext.tsx
│   ├── GridLayoutContext.tsx
│   ├── NavigationStyleContext.tsx
│   └── ThemeContext.tsx
├── hooks/                  # Custom React hooks
│   ├── useEngagementColor.ts
│   └── index.ts
├── lib/                    # External library configurations
│   └── supabase.ts
├── navigation/
│   └── AppNavigator.tsx    # Main navigation configuration
├── screens/                # Screen components organized by user type
│   ├── auth/              # Authentication screens
│   │   ├── AuthScreen.tsx
│   │   ├── SplashScreen.tsx
│   │   └── index.ts
│   ├── customer/          # Customer-facing screens
│   │   ├── FavoritesScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── QuickPicksScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── VenueDetailScreen.tsx
│   │   └── index.ts
│   ├── venue/             # Venue owner screens
│   │   ├── VenueDashboardScreen.tsx
│   │   └── index.ts
│   └── index.ts           # Main screen exports
├── services/               # Business logic and API layer
│   ├── api/               # API services organized by domain
│   │   ├── auth.ts
│   │   ├── checkins.ts
│   │   ├── favorites.ts
│   │   ├── feedback.ts
│   │   ├── venues.ts
│   │   └── index.ts
│   ├── venueAnalyticsService.ts
│   ├── venueApplicationService.ts
│   ├── venueBusinessService.ts
│   ├── venueContributionService.ts
│   └── index.ts
├── types/                  # Centralized TypeScript type definitions
│   ├── checkin.types.ts   # Check-in related types
│   ├── navigation.types.ts # Navigation types
│   ├── user.types.ts      # User related types
│   ├── venue.types.ts     # Venue related types
│   └── index.ts
└── utils/                  # Utility functions organized by purpose
    ├── constants/         # Application constants
    │   ├── colors.ts
    │   ├── spacing.ts
    │   └── index.ts
    ├── formatting/        # Formatting utilities
    │   ├── activity.ts
    │   └── index.ts
    ├── validation/        # Validation utilities (future)
    └── populateVenues.ts

database/                   # SQL setup scripts
├── mockdata/              # Mock data for testing
├── setup/                 # Database setup scripts
└── README.md

docs/                       # Documentation
├── supabase-setup.md
└── user-feedback-system.md
```

### Folder Structure Principles

1. **Domain-Driven Organization**: Code is grouped by feature/domain rather than by technical type
2. **Discoverability**: Related code lives together, making it easier to find and understand
3. **Scalability**: Easy to add new features without cluttering existing directories
4. **Separation of Concerns**: Clear boundaries between UI, business logic, and data layers

### Key Directories

- **components/**: UI components organized by domain (venue, checkin, navigation, shared)
- **screens/**: Screen components organized by user type (customer, venue owner, auth)
- **types/**: Centralized TypeScript type definitions for better type reusability
- **services/api/**: API layer services organized by domain
- **utils/**: Utility functions organized by purpose (formatting, validation, constants)

## Import Patterns and Conventions

### Import Patterns

The project uses a combination of relative and absolute imports for optimal code organization:

#### Relative Imports (within same feature/domain)
Use relative imports when importing files within the same feature directory:

```typescript
// Within src/components/venue/
import { VenueCard } from './VenueCard';
import { VenueCustomerCount } from './VenueCustomerCount';
```

#### Absolute Imports (across features)
Use absolute imports when importing from different features or shared code:

```typescript
// From any file
import { VenueCard } from '@/components/venue';
import { useVenues } from '@/hooks';
import { Venue } from '@/types';
import { VenueService } from '@/services/api';
```

#### Index File Imports
Each domain folder has an `index.ts` file for clean imports:

```typescript
// Instead of:
import { VenueCard } from '@/components/venue/VenueCard';
import { VenueCustomerCount } from '@/components/venue/VenueCustomerCount';

// Use:
import { VenueCard, VenueCustomerCount } from '@/components/venue';
```

### Naming Conventions

#### Files
- **Components**: PascalCase (e.g., `VenueCard.tsx`, `CheckInButton.tsx`)
- **Screens**: PascalCase with "Screen" suffix (e.g., `HomeScreen.tsx`, `VenueDetailScreen.tsx`)
- **Services**: camelCase with "Service" suffix (e.g., `venueService.ts`, `authService.ts`)
- **Types**: camelCase with ".types" suffix (e.g., `venue.types.ts`, `user.types.ts`)
- **Utilities**: camelCase (e.g., `activity.ts`, `colors.ts`)
- **Index files**: Always `index.ts`

#### Code
- **Components**: PascalCase (e.g., `VenueCard`, `CheckInModal`)
- **Functions**: camelCase (e.g., `getActivityLevel`, `formatDate`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `ACTIVITY_COLORS`, `SPACING`)
- **Types/Interfaces**: PascalCase (e.g., `Venue`, `CheckIn`, `VenueQueryOptions`)
- **Hooks**: camelCase with "use" prefix (e.g., `useVenues`, `useEngagementColor`)

#### Exports
- **Prefer named exports** over default exports for better tree-shaking and refactoring
- **Use index files** to create clean public APIs for each domain

```typescript
// Good: Named exports
export const VenueCard = () => { /* ... */ };
export const VenueCustomerCount = () => { /* ... */ };

// Avoid: Default exports
export default VenueCard;
```

## Adding New Features

### Component Placement Guidelines

When adding new components, follow these guidelines:

1. **Venue-specific components** → `src/components/venue/`
2. **Check-in related components** → `src/components/checkin/`
3. **Navigation components** → `src/components/navigation/`
4. **Reusable UI primitives** → `src/components/ui/`
5. **Shared across features** → `src/components/shared/`

### Screen Placement Guidelines

When adding new screens:

1. **Customer-facing screens** → `src/screens/customer/`
2. **Venue owner screens** → `src/screens/venue/`
3. **Authentication screens** → `src/screens/auth/`

### Service Placement Guidelines

When adding new services:

1. **API services** → `src/services/api/`
2. **Business logic services** → `src/services/`

### Type Placement Guidelines

When adding new types:

1. **Domain-specific types** → `src/types/{domain}.types.ts`
2. **Shared types** → `src/types/index.ts`

### Example: Adding a New Feature

Let's say you're adding a "Rewards" feature:

```
1. Create component directory:
   src/components/rewards/
   ├── RewardCard.tsx
   ├── RewardsList.tsx
   └── index.ts

2. Create screen:
   src/screens/customer/RewardsScreen.tsx
   (Add export to src/screens/customer/index.ts)

3. Create types:
   src/types/rewards.types.ts
   (Add export to src/types/index.ts)

4. Create service:
   src/services/api/rewards.ts
   (Add export to src/services/api/index.ts)

5. Update navigation:
   Add route to AppNavigator.tsx
```

### Migration Guide for Existing Code

If you're updating existing code that hasn't been refactored yet:

1. **Identify the domain**: Determine which domain the code belongs to (venue, checkin, etc.)
2. **Move the file**: Move it to the appropriate domain folder
3. **Update imports**: Update all import statements in the moved file
4. **Update exports**: Add the export to the domain's `index.ts` file
5. **Update consumers**: Update all files that import the moved code
6. **Test**: Verify the application still works correctly

## Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.