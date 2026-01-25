# On The Way (OTW) - Codebase Overview

## Purpose

On The Way (OTW) is a location-based social discovery app that helps users find and check into venues (bars, restaurants, cafes, etc.), discover flash offers, connect with friends, and share experiences. The app serves both customers and venue owners, providing real-time engagement tracking and promotional tools.

---

## Tech Stack

### Frontend
- **Framework**: React Native 0.83.1 (React 19.2.0)
- **Language**: TypeScript 5.8.3
- **Navigation**: React Navigation v7 (Bottom Tabs + Native Stack)
- **State Management**: React Query (TanStack Query) v5.90
- **Animations**: React Native Reanimated v4.2
- **Gestures**: React Native Gesture Handler v2.30
- **Icons**: React Native Vector Icons (Ionicons)
- **Testing**: Jest + React Testing Library + fast-check (property-based testing)

### Backend
- **Platform**: Supabase (PostgreSQL 15+ with PostGIS)
- **Authentication**: Supabase Auth (JWT tokens)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Edge Functions**: Deno runtime (serverless)
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Storage**: Supabase Storage (avatars, venue images)

### Development Tools
- **Package Manager**: npm
- **Build Tools**: Metro bundler, Gradle (Android), Xcode (iOS)
- **Code Quality**: ESLint, Prettier
- **Version Control**: Git

---

## Architecture

### Frontend Architecture

**Domain-Driven Folder Structure**:
```
src/
├── components/          # UI components by domain
│   ├── checkin/        # Check-in related components
│   ├── flashOffer/     # Flash offer components
│   ├── navigation/     # Navigation components
│   ├── profile/        # Profile components
│   ├── shared/         # Shared/reusable components
│   ├── social/         # Social features
│   ├── ui/             # UI primitives (cards, chips)
│   └── venue/          # Venue-specific components
├── contexts/           # React contexts (Auth, Theme, Location)
├── hooks/              # Custom React hooks
│   ├── mutations/      # React Query mutations
│   └── queries/        # React Query queries
├── lib/                # External library configs (Supabase, React Query)
├── navigation/         # Navigation configuration
├── screens/            # Screen components by user type
│   ├── auth/          # Authentication screens
│   ├── customer/      # Customer-facing screens
│   └── venue/         # Venue owner screens
├── services/           # Business logic and API layer
│   ├── api/           # API services by domain
│   ├── compliance/    # Content moderation
│   └── monitoring/    # Analytics and monitoring
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

**Key Patterns**:
- Custom hooks for data fetching and business logic
- React Query for server state management
- Context API for global state (auth, theme, location)
- Domain-driven organization for scalability
- Named exports for better tree-shaking

### Backend Architecture

**Database Schema**:
- `profiles` - User profiles (with username/display_name for @ search)
- `venues` - Venue/business locations
- `check_ins` - User check-ins to venues
- `reviews` - Venue reviews and ratings
- `flash_offers` - Time-limited promotional offers
- `flash_offer_claims` - Claimed offers
- `friendships` - Social connections
- `collections` - User-created venue lists
- `device_tokens` - Push notification tokens
- `notification_preferences` - User notification settings

**Security**:
- Row Level Security (RLS) on all tables
- JWT-based authentication
- Database-level authorization
- Content moderation for user-generated content

**Performance**:
- B-Tree indexes for equality/range queries
- GIN indexes for full-text search
- GIST indexes for spatial queries (PostGIS)
- Partial indexes for filtered queries
- React Query caching on frontend

---

## Core Features

### 1. Venue Discovery
- Browse featured venues
- Search by name, category, location
- Filter by amenities, price range, ratings
- Location-based discovery (nearby venues)
- New venues spotlight
- Real-time engagement tracking (active check-ins)

### 2. Check-In System
- Check in/out of venues
- Swipe gestures for quick check-in
- Check-in history tracking
- Active check-in counts per venue
- Haptic feedback for interactions
- Automatic check-out when checking into new venue

### 3. Flash Offers
- Time-limited promotional offers from venues
- Location-based offer discovery (radius filtering)
- Claim tracking and redemption
- Push notifications for nearby offers
- Real-time offer updates via Supabase Realtime
- Offer expiration management

### 4. Reviews & Ratings
- 5-star rating system
- Written reviews (max 500 characters)
- Helpful vote system
- Venue owner responses
- Aggregate rating calculation (database trigger)
- Real-time rating updates
- Profanity filtering

### 5. Social Features
- User profiles with username/display_name
- @ search for finding users
- Friend system (requests, connections)
- Collections (save venues to lists)
- Share venues with friends
- Activity feed
- Mutual favorites indicator

### 6. Push Notifications
- Flash offer notifications
- Friend activity notifications
- Check-in reminders
- Notification preferences (per-type control)
- Quiet hours support
- Rate limiting (max per day)
- FCM integration

### 7. User Profiles
- Customizable profiles with avatars
- Username system (@ search enabled)
- Display name vs username
- Check-in statistics
- About me section
- Friends list
- Privacy controls

### 8. Venue Owner Dashboard
- Analytics and insights
- Customer engagement metrics
- Flash offer creation
- Venue information management
- Review management

---

## Navigation Structure

```
AppNavigator
├── SplashScreen (initializing)
├── AuthScreen (no session)
└── MainTabNavigator (authenticated)
    ├── HomeStack
    │   ├── HomeScreen (featured venues, flash offers, check-ins)
    │   ├── VenueDetailScreen
    │   ├── VenueReviewsScreen
    │   ├── FlashOfferDetailScreen
    │   └── ClaimConfirmationScreen
    ├── SearchStack
    │   ├── SearchScreen (venue search + @ user search)
    │   └── VenueDetailScreen
    ├── FavoritesStack
    │   ├── FavoritesScreen
    │   └── VenueDetailScreen
    ├── HistoryStack
    │   ├── HistoryScreen (check-in history)
    │   └── VenueDetailScreen
    └── ProfileStack
        ├── ProfileScreen
        ├── SettingsScreen
        └── NotificationSettingsScreen
```

---

## Key Custom Hooks

### Data Fetching Hooks
- `useVenues()` - Fetch venues with filtering
- `useVenueQuery()` - Single venue details
- `useUsersQuery()` - User search (@ search)
- `useCheckInStats()` - Check-in counts per venue
- `useCheckInHistory()` - User's check-in history
- `useFlashOffersQuery()` - Nearby flash offers
- `useCollectionsQuery()` - User's collections
- `useFriendsQuery()` - Friends list
- `useUserProfileQuery()` - User profile data

### Mutation Hooks
- `useCheckInMutation()` - Check in/out actions
- `useClaimFlashOfferMutation()` - Claim offers
- `useAddFriendMutation()` - Send friend requests
- `useCollectionMutations()` - Manage collections
- `useUpdateProfileMutation()` - Update profile

### UI/Interaction Hooks
- `useSwipeGesture()` - Swipe gesture handling
- `useHapticFeedback()` - Haptic feedback
- `useDebounce()` - Debounce values (search)
- `useSearchMode()` - Detect @ search mode
- `useEngagementColor()` - Engagement level colors

---

## API Services

Located in `src/services/api/`:

- `auth.ts` - Authentication (sign in/up/out)
- `venues.ts` - Venue CRUD operations
- `checkins.ts` - Check-in management
- `reviews.ts` - Review CRUD and voting
- `flashOffers.ts` - Flash offer operations
- `social.ts` - Friends, collections, sharing
- `notifications.ts` - Push notification management

All services follow consistent patterns:
- TypeScript types for requests/responses
- Error handling with try-catch
- RLS enforcement via database policies
- Batch operations where applicable

---

## Database Migrations

Located in `supabase/migrations/` and `database/migrations/`:

**Recent Migrations**:
- `20250125000000_add_username_display_name.sql` - Username/display_name fields for @ search
- `20250125000001_add_user_search_rls_policy.sql` - RLS policy for user search
- `20250118000000_create_reviews_ratings_tables.sql` - Reviews and ratings system
- `019_final_simple.sql` - Reviews, ratings, and social features

**Migration Strategy**:
- Version controlled with timestamps
- Test in development first
- Include rollback scripts
- Document breaking changes
- Test RLS policies thoroughly

---

## Testing Strategy

### Unit Tests
- Component tests with React Testing Library
- Hook tests with `renderHook`
- Service tests with mocked Supabase client
- Utility function tests

### Property-Based Tests (PBT)
- Uses `fast-check` library
- Tests universal properties across many inputs
- Located in `__tests__/*.pbt.test.tsx` files
- Examples:
  - `useSwipeGesture` - Gesture state transitions
  - `useNotificationPreferences` - Preference updates
  - `queryKeys` - Key uniqueness and structure
  - `realtimeSync` - Subscription lifecycle

### Integration Tests
- End-to-end flows (check-in, review submission)
- Real-time update testing
- Navigation flow testing

**Test Commands**:
```bash
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test -- --coverage     # Coverage report
```

---

## Development Workflow

### Setup
```bash
npm install                 # Install dependencies
bundle install              # Install Ruby dependencies (iOS)
bundle exec pod install     # Install iOS pods
```

### Running the App
```bash
npm run dev:full           # Start emulator + Metro + build (all-in-one)
npm run dev                # Start emulator + Metro only
npm run android            # Build and run Android
npm run ios                # Build and run iOS
npm start                  # Start Metro bundler only
```

### Database
```bash
supabase start             # Start local Supabase
supabase db push           # Apply migrations
supabase db reset          # Reset database
```

### Cleaning
```bash
npm run clean              # Clean build cache
npm run clean:metro        # Clean Metro cache
npm run fresh-start        # Clean + full restart
```

---

## Environment Variables

Required environment variables (`.env` or platform-specific):

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `FIREBASE_SERVER_KEY` - FCM server key (for push notifications)

---

## Key Files & Directories

### Configuration
- `app.json` - React Native app configuration
- `babel.config.js` - Babel configuration
- `metro.config.js` - Metro bundler configuration
- `tsconfig.json` - TypeScript configuration
- `jest.config.js` - Jest test configuration

### Documentation
- `docs/APP_ARCHITECTURE.md` - Frontend architecture details
- `docs/BACKEND_ARCHITECTURE.md` - Backend architecture details
- `docs/api-reference.md` - Complete API documentation
- `docs/feature-roadmap.md` - Future feature plans
- `database/README.md` - Database setup guide

### Database
- `database/setup/` - Initial database setup scripts
- `database/migrations/` - Database migration scripts
- `database/mockdata/` - Test data scripts
- `supabase/migrations/` - Supabase-managed migrations
- `supabase/functions/` - Edge functions (Deno)

### Specs
- `.kiro/specs/` - Feature specifications and implementation plans
- Each spec contains: `requirements.md`, `design.md`, `tasks.md`

---

## Code Conventions

### Naming
- **Components**: PascalCase (`VenueCard.tsx`)
- **Screens**: PascalCase with "Screen" suffix (`HomeScreen.tsx`)
- **Hooks**: camelCase with "use" prefix (`useVenues.ts`)
- **Services**: camelCase with "Service" suffix (`venueService.ts`)
- **Types**: PascalCase (`Venue`, `CheckIn`)
- **Constants**: UPPER_SNAKE_CASE (`ACTIVITY_COLORS`)

### Imports
- Use absolute imports across features: `@/components/venue`
- Use relative imports within same feature: `./VenueCard`
- Prefer named exports over default exports
- Use index files for clean public APIs

### Best Practices
- Always handle loading and error states
- Use TypeScript types for all props and returns
- Implement proper error boundaries
- Use React Query for server state
- Use Context API for global client state
- Follow domain-driven organization
- Write tests for critical paths
- Document complex logic with comments

---

## Common Tasks

### Adding a New Feature
1. Create spec in `.kiro/specs/{feature-name}/`
2. Define types in `src/types/{feature}.types.ts`
3. Create API service in `src/services/api/{feature}.ts`
4. Create React Query hooks in `src/hooks/queries/` or `src/hooks/mutations/`
5. Create components in `src/components/{domain}/`
6. Create screens in `src/screens/{user-type}/`
7. Update navigation in `src/navigation/AppNavigator.tsx`
8. Write tests in `__tests__/` directories
9. Update documentation

### Adding a Database Table
1. Create migration in `supabase/migrations/`
2. Define RLS policies
3. Add indexes for performance
4. Update TypeScript types in `src/lib/supabase.ts`
5. Create API service methods
6. Test RLS policies thoroughly

### Adding a New Screen
1. Create screen component in `src/screens/{user-type}/`
2. Add route to navigation types in `src/types/navigation.types.ts`
3. Update navigator in `src/navigation/AppNavigator.tsx`
4. Export from `src/screens/{user-type}/index.ts`
5. Add navigation logic in parent screens

---

## Performance Considerations

### Frontend
- Use `React.memo` for frequently re-rendered components
- Use `useMemo` for expensive calculations
- Use `useCallback` for event handlers passed to children
- Implement pagination for large lists
- Debounce search inputs (300ms)
- Lazy load images with placeholders
- Use React Query caching (5-10 minute TTL)

### Backend
- Use specific column selection (avoid `SELECT *`)
- Batch queries instead of N+1 queries
- Use pagination for large result sets
- Leverage database indexes
- Use partial indexes for filtered queries
- Cache computed values in denormalized columns
- Monitor slow queries with `pg_stat_statements`

---

## Security Best Practices

1. **Never expose sensitive data** in API responses (email, phone, etc.)
2. **Always use RLS policies** for authorization
3. **Validate and sanitize** all user input
4. **Use environment variables** for secrets
5. **Implement rate limiting** for expensive operations
6. **Log security-relevant events**
7. **Filter user-generated content** for profanity/spam
8. **Use HTTPS** for all API calls
9. **Implement proper error handling** (don't leak stack traces)
10. **Keep dependencies updated** for security patches

---

## Troubleshooting

### Common Issues
- **Metro bundler cache issues**: Run `npm run clean:metro`
- **Build failures**: Run `npm run clean` then rebuild
- **Supabase connection issues**: Check environment variables
- **Push notification issues**: Verify FCM configuration
- **RLS policy errors**: Check user authentication state
- **Type errors**: Run `npx tsc --noEmit` to check types

### Debug Tools
- React Query DevTools (enabled in development)
- React Native Debugger
- Flipper (for network inspection)
- Supabase Studio (database inspection)
- Firebase Console (push notification logs)

---

## Resources

### Documentation
- [React Native Docs](https://reactnative.dev/)
- [React Navigation Docs](https://reactnavigation.org/)
- [React Query Docs](https://tanstack.com/query/latest)
- [Supabase Docs](https://supabase.com/docs)
- [Firebase Docs](https://firebase.google.com/docs)

### Internal Docs
- `docs/APP_ARCHITECTURE.md` - Detailed frontend architecture
- `docs/BACKEND_ARCHITECTURE.md` - Detailed backend architecture
- `docs/api-reference.md` - Complete API reference
- `README.md` - Setup and getting started guide

---

**Last Updated**: January 25, 2026

**Current Version**: 0.0.1

**Platform**: React Native 0.83.1 | Supabase | Firebase

---

*This document serves as a quick reference for developers, agents, and hooks to understand the OTW codebase structure, architecture, and conventions.*
