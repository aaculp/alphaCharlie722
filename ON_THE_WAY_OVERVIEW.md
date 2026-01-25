# On The Way (OTW) - Application Overview

## Purpose

On The Way (OTW) is a location-based social venue discovery platform that connects users with local venues through real-time check-ins, reviews, flash offers, and social features. The app helps users discover venues, track their activity, and engage with their community while providing venue owners with powerful analytics and promotional tools.

---

## Tech Stack

### Frontend
- **Framework:** React Native 0.83.1 (React 19.2.0)
- **Language:** TypeScript 5.8.3
- **Navigation:** React Navigation v7 (Bottom Tabs + Native Stack)
- **State Management:** React Query (@tanstack/react-query 5.90.19)
- **Animations:** React Native Reanimated 4.2.1
- **Gestures:** React Native Gesture Handler 2.30.0
- **Icons:** React Native Vector Icons (Ionicons)
- **Image Handling:** React Native Image Picker 8.2.1

### Backend
- **Database:** Supabase (PostgreSQL with PostGIS)
- **Authentication:** Supabase Auth (JWT-based)
- **Real-time:** Supabase Realtime subscriptions
- **Edge Functions:** Deno-based Supabase Edge Functions
- **Push Notifications:** Firebase Cloud Messaging (FCM)
- **Storage:** Supabase Storage (for images)

### Development Tools
- **Testing:** Jest 29.6.3, React Testing Library, fast-check (PBT)
- **Linting:** ESLint 8.19.0
- **Code Quality:** Prettier 2.8.8
- **Build:** Metro bundler, Gradle (Android)

---

## Architecture

### Frontend Architecture

**Domain-Driven Structure:**
```
src/
├── components/     # UI components by domain (venue, checkin, social, etc.)
├── screens/        # Screen components by user type (customer, venue, auth)
├── hooks/          # Custom React hooks for business logic
├── services/       # API layer and business services
├── contexts/       # React contexts (Auth, Theme, Location, etc.)
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── lib/            # External library configurations
```

**Key Patterns:**
- Custom hooks separate business logic from UI
- React Query for data fetching, caching, and synchronization
- Context API for global state (auth, theme, location)
- Domain-driven folder organization for scalability
- Named exports for better tree-shaking

### Backend Architecture

**Database Schema:**
- `venues` - Venue information with spatial data
- `check_ins` - User check-in records
- `reviews` - User reviews with ratings
- `helpful_votes` - Review helpfulness tracking
- `favorites` - User favorite venues
- `flash_offers` - Time-limited promotional offers
- `flash_offer_claims` - Offer claim tracking
- `friendships` - Social connections
- `collections` - User-curated venue lists
- `device_tokens` - Push notification tokens
- `notification_preferences` - User notification settings

**Security:**
- Row Level Security (RLS) policies on all tables
- JWT-based authentication
- Service role for admin operations
- Content moderation for user-generated content

---

## Core Features

### 1. Venue Discovery
- **Featured Venues:** Curated list of popular venues
- **New Venues:** Recently added venues (last 30 days)
- **Search & Filter:** Real-time search with category/location filters
- **Location-Based:** Nearby venues using GPS coordinates
- **Venue Details:** Comprehensive information (hours, contact, amenities)

### 2. Check-In System
- **Real-Time Check-Ins:** Users check in/out of venues
- **Activity Tracking:** Live customer count per venue
- **Engagement Levels:** Visual indicators (Low-key, Chill, Buzzing, Packed)
- **Check-In History:** Personal check-in timeline
- **Swipe Gestures:** Quick check-in/out via swipe actions

### 3. Reviews & Ratings
- **Star Ratings:** 1-5 star rating system
- **Written Reviews:** Text reviews with profanity filtering
- **Aggregate Ratings:** Automatic calculation via database triggers
- **Helpful Votes:** Community-driven review quality
- **Venue Responses:** Owners can respond to reviews
- **Real-Time Updates:** Live rating updates via Supabase subscriptions

### 4. Flash Offers
- **Time-Limited Deals:** Promotional offers with expiration
- **Location-Based:** Nearby offers within configurable radius
- **Claim System:** Atomic claim operations to prevent double-claiming
- **Push Notifications:** FCM-based offer alerts
- **Analytics:** Track views, claims, and redemptions

### 5. Social Features
- **Friend System:** Add/remove friends, friend requests
- **Activity Feed:** See friends' check-ins and activity
- **Collections:** Curated venue lists (public/private)
- **Venue Sharing:** Share venues with friends
- **Mutual Favorites:** See shared favorite venues

### 6. User Profile
- **Profile Management:** Avatar, bio, preferences
- **Statistics:** Check-in counts, venues visited
- **Check-In History:** Personal activity timeline
- **Favorites:** Saved venues
- **Settings:** Notification preferences, privacy controls

### 7. Venue Owner Dashboard
- **Analytics:** Customer insights, peak hours, demographics
- **Flash Offer Creation:** Create and manage promotional offers
- **Business Account:** Subscription tiers (Free, Core, Pro, Revenue+)
- **Push Notification Credits:** Tiered notification system
- **Venue Management:** Update venue information

### 8. Push Notifications
- **FCM Integration:** Firebase Cloud Messaging
- **Device Token Management:** Automatic token registration/cleanup
- **Notification Preferences:** Granular user controls
- **Rate Limiting:** Prevent notification spam
- **Social Notifications:** Friend activity alerts
- **Offer Notifications:** Flash offer alerts

---

## Navigation Structure

```
AppNavigator
├── SplashScreen (initializing)
├── AuthScreen (no session)
└── MainTabNavigator (authenticated)
    ├── HomeStack
    │   ├── HomeScreen
    │   ├── VenueDetailScreen
    │   ├── VenueReviewsScreen
    │   └── FlashOfferDetailScreen
    ├── SearchStack
    │   ├── SearchScreen
    │   └── VenueDetailScreen
    ├── FavoritesStack
    │   ├── FavoritesScreen
    │   └── VenueDetailScreen
    ├── HistoryStack
    │   ├── HistoryScreen
    │   └── VenueDetailScreen
    └── ProfileStack
        ├── ProfileScreen
        ├── SettingsScreen
        └── NotificationSettingsScreen
```

---

## Key Custom Hooks

### Data Fetching
- `useVenues()` - Fetch and manage venue data
- `useVenueQuery()` - Single venue with React Query
- `useNewVenues()` - Recently added venues
- `useCheckInStats()` - Venue check-in statistics
- `useCheckInHistory()` - User check-in timeline
- `useFlashOffers()` - Nearby flash offers
- `useCollections()` - User collections
- `useFriends()` - Friend list and management
- `useNotificationPreferences()` - Notification settings

### Mutations
- `useCheckInMutation()` - Check-in/out operations
- `useClaimFlashOfferMutation()` - Claim flash offers
- `useAddFriendMutation()` - Send friend requests
- `useCollectionMutations()` - Manage collections
- `useUpdateProfileMutation()` - Update user profile

### UI/Interaction
- `useSwipeGesture()` - Swipe gesture handling
- `useHapticFeedback()` - Haptic feedback triggers
- `useDebounce()` - Debounce rapidly changing values
- `useEngagementColor()` - Activity level colors

---

## API Services

### Core Services
- `VenueService` - Venue CRUD operations
- `ReviewService` - Review submission, voting, moderation
- `CheckInService` - Check-in/out, statistics
- `FlashOfferService` - Offer management, claiming
- `AuthService` - Authentication operations
- `ProfileService` - User profile management

### Social Services
- `FriendService` - Friend relationships
- `CollectionService` - Venue collections
- `ActivityFeedService` - Social activity feed
- `VenueShareService` - Venue sharing

### Notification Services
- `PushNotificationService` - FCM integration
- `NotificationPreferencesService` - User preferences
- `DeviceTokenManager` - Token lifecycle management
- `NotificationHandler` - Notification processing

---

## Database Features

### Performance Optimizations
- Spatial indexes for location queries (PostGIS)
- Composite indexes on frequently queried columns
- Connection pooling for scalability
- Query optimization with proper joins

### Real-Time Features
- Supabase Realtime subscriptions for live updates
- Venue rating updates via database triggers
- Check-in count updates
- Review notifications

### Data Integrity
- Foreign key constraints
- Check constraints for data validation
- Unique constraints to prevent duplicates
- Atomic operations for critical actions (offer claiming)

---

## Testing Strategy

### Unit Tests
- Custom hooks testing with React Testing Library
- Service layer testing with mocked Supabase client
- Utility function testing
- Component testing

### Property-Based Tests (PBT)
- Gesture state transitions (`useSwipeGesture`)
- Notification preferences (`useNotificationPreferences`)
- Cache persistence logic
- Real-time sync behavior
- Query key generation

### Integration Tests
- Check-in flow (UI → API → Database → UI)
- Review submission with trigger validation
- Real-time subscription updates
- Authentication flows

---

## Development Workflow

### Local Development
```bash
# Start Metro bundler
npm start

# Run Android emulator
npm run emulator

# Build and install app
npm run android

# Full development (all-in-one)
npm run dev:full
```

### Database Setup
1. Run SQL scripts in `database/setup/` directory
2. Apply migrations in `database/migrations/`
3. Optionally add mock data from `database/mockdata/`

### Edge Functions
```bash
# Start local Supabase
supabase start

# Deploy function locally
cd supabase/functions
./deploy.sh local

# Test function
./test-function.sh local
```

---

## Deployment

### Frontend
- Android: Build APK/AAB via Gradle
- iOS: Build via Xcode (requires Mac)
- Environment-specific configurations

### Backend
- Supabase migrations via CLI
- Edge function deployment to production
- Environment secrets management
- Database backups and monitoring

---

## Documentation

### Key Documents
- `README.md` - Getting started guide
- `docs/APP_ARCHITECTURE.md` - Detailed architecture
- `docs/feature-roadmap.md` - Future features
- `database/README.md` - Database setup
- `supabase/functions/README.md` - Edge functions guide
- `.kiro/specs/` - Feature specifications

### Spec-Driven Development
The project uses spec-driven development with structured specifications in `.kiro/specs/`:
- Requirements documents
- Design documents with correctness properties
- Task lists with property-based testing
- Examples: `flash-offers-mvp`, `venue-reviews-ratings`, `social-friend-system`

---

## Current Status

### Production-Ready Features
✅ User authentication
✅ Venue discovery and search
✅ Check-in/check-out system
✅ Reviews and ratings
✅ Flash offers (MVP)
✅ Social features (friends, collections)
✅ Push notifications (infrastructure)
✅ Venue owner dashboard

### In Development
🔄 Advanced analytics
🔄 Enhanced social features
🔄 Gamification elements

### Planned Features
📋 Loyalty programs
📋 Event calendar
📋 Advanced recommendations
📋 In-app messaging

---

## Key Considerations for Agents

### Code Style
- Use TypeScript for type safety
- Follow domain-driven folder structure
- Prefer named exports over default exports
- Use custom hooks for business logic
- Implement proper error handling

### Database Operations
- Always use RLS policies
- Validate data before insertion
- Use transactions for multi-step operations
- Consider performance implications of queries

### Testing
- Write unit tests for new hooks
- Add property-based tests for complex logic
- Test error scenarios
- Validate real-time subscriptions

### Performance
- Use React Query for caching
- Implement pagination for large lists
- Debounce user input
- Optimize images and assets
- Monitor bundle size

---

## Contact & Resources

- **Supabase Dashboard:** Project-specific URL
- **Firebase Console:** FCM configuration
- **GitHub Repository:** (if applicable)
- **Documentation:** `/docs` directory
- **Specs:** `.kiro/specs` directory

---

*Last Updated: January 25, 2026*
