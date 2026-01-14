# Design Document: New Venues Spotlight

## Overview

The New Venues Spotlight feature introduces a horizontal scrolling carousel component that showcases venues that have recently joined the platform. This feature will be integrated into the HomeScreen, positioned prominently to drive discovery of new establishments and provide initial visibility for venue owners.

The implementation follows the established pattern used for social features (FriendVenueCarousel, SharedCollectionCarousel, FriendActivityFeed) to maintain consistency in the user experience. The feature will leverage the existing venue_business_accounts table to determine venue "newness" based on account creation timestamps.

## Architecture

### Component Structure

```
HomeScreen
├── QuickPicksSection
├── RecentCheckInsSection
├── NewVenuesSpotlightCarousel (NEW)
│   ├── Header (with icon and title)
│   ├── FlatList (horizontal)
│   │   └── VenueCard[] (spotlight cards)
│   └── SkeletonLoader (loading state)
├── Social Sections (Friends, Collections, Activity)
└── Main Venue List
```

### Data Flow

```
HomeScreen
    ↓ (fetch on mount/refresh)
VenueService.getNewVenues()
    ↓ (query Supabase)
venues JOIN venue_business_accounts
    ↓ (filter by created_at)
WHERE created_at >= NOW() - INTERVAL '30 days'
    ↓ (return data)
NewVenuesSpotlightCarousel
    ↓ (render cards)
User taps card
    ↓ (navigate)
VenueDetailScreen
```

### Integration Points

1. **VenueService**: New method `getNewVenues()` to fetch spotlight venues
2. **HomeScreen**: Integration of NewVenuesSpotlightCarousel component
3. **Navigation**: Reuse existing venue detail navigation
4. **Theme System**: Apply existing theme colors and styles
5. **Cache System**: Optional integration with CacheManager for performance

## Components and Interfaces

### NewVenuesSpotlightCarousel Component

**Purpose**: Display a horizontal scrolling carousel of newly signed up venues with visual indicators of their "new" status.

**Props Interface**:
```typescript
interface NewVenuesSpotlightCarouselProps {
  venues: Venue[];
  onVenuePress: (venueId: string) => void;
  loading?: boolean;
  userLocation?: { latitude: number; longitude: number } | null;
}
```

**Component Structure**:
- Header section with icon and title
- Horizontal FlatList with snap-to-interval scrolling
- Individual venue cards with "NEW" badge
- Skeleton loader for loading state
- Conditional rendering (hide if no venues)

**Styling Considerations**:
- Card width: 70% of screen width (SCREEN_WIDTH * 0.7)
- Card margin: 12px between cards
- Snap interval: CARD_WIDTH + CARD_MARGIN
- Border radius: 12px for cards
- Theme-aware colors for backgrounds, borders, and text

### VenueCard (Spotlight Variant)

**Visual Elements**:
1. Venue image (150px height)
2. "NEW" badge (top-left corner, primary color)
3. Days since signup text (e.g., "Joined 5 days ago")
4. Venue name (bold, 16px)
5. Category badge
6. Rating (or "New - No ratings yet")
7. Location with icon
8. Distance (if location available)

**Badge Design**:
```typescript
<View style={newBadge}>
  <Icon name="sparkles" size={12} color="white" />
  <Text>NEW</Text>
</View>
```

### VenueService Extension

**New Method**:
```typescript
class VenueService {
  static async getNewVenues(limit: number = 10): Promise<Venue[]> {
    // Query venues joined with business accounts
    // Filter by created_at within last 30 days
    // Order by created_at DESC
    // Limit results
  }
}
```

**Query Structure**:
```sql
SELECT v.*, vba.created_at as signup_date
FROM venues v
INNER JOIN venue_business_accounts vba ON v.id = vba.venue_id
WHERE vba.created_at >= NOW() - INTERVAL '30 days'
  AND vba.account_status = 'active'
  AND vba.verification_status = 'verified'
ORDER BY vba.created_at DESC
LIMIT 10;
```

### Custom Hook: useNewVenues

**Purpose**: Encapsulate data fetching logic for new venues with loading and error states.

**Interface**:
```typescript
interface UseNewVenuesResult {
  venues: Venue[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

function useNewVenues(options?: { limit?: number }): UseNewVenuesResult {
  // Fetch new venues on mount
  // Handle loading and error states
  // Provide refetch function
  // Return venues, loading, error, refetch
}
```

**Implementation Pattern**:
- Use useState for venues, loading, error
- Use useEffect for initial fetch
- Use useCallback for refetch function
- Follow pattern from existing hooks (useVenues, useFriends)

## Data Models

### Extended Venue Type

The existing Venue type will be extended with spotlight-specific metadata:

```typescript
interface VenueWithSpotlightInfo extends Venue {
  signup_date: string; // ISO timestamp from venue_business_accounts.created_at
  days_since_signup: number; // Calculated client-side
}
```

### Venue Business Account (Existing)

```typescript
interface VenueBusinessAccount {
  id: string;
  venue_id: string;
  owner_user_id: string;
  application_id: string;
  subscription_tier: 'free' | 'core' | 'pro' | 'revenue';
  subscription_status: 'active' | 'inactive' | 'suspended' | 'cancelled';
  account_status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at: string; // Key field for spotlight eligibility
  updated_at: string;
}
```

### Query Result Type

```typescript
interface NewVenueQueryResult {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  address: string;
  phone: string;
  website: string;
  image_url: string;
  rating: number;
  review_count: number;
  latitude: number;
  longitude: number;
  signup_date: string; // From JOIN with venue_business_accounts
}
```

### Helper Functions

```typescript
// Calculate days since signup
function calculateDaysSinceSignup(signupDate: string): number {
  const now = new Date();
  const signup = new Date(signupDate);
  const diffMs = now.getTime() - signup.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Format signup text
function formatSignupText(days: number): string {
  if (days === 0) return 'Joined today';
  if (days === 1) return 'Joined yesterday';
  return `Joined ${days} days ago`;
}

// Check if venue is eligible for spotlight
function isEligibleForSpotlight(signupDate: string, maxDays: number = 30): boolean {
  const days = calculateDaysSinceSignup(signupDate);
  return days <= maxDays;
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, the following redundancies were identified:
- Properties 1.5 and 7.1 both test empty state rendering (consolidated into Property 1)
- Properties 5.2 and 5.5 both test spotlight period filtering (consolidated into Property 2)
- Properties 8.4 and 8.5 both test filter independence (consolidated into Property 8)

### Core Properties

**Property 1: Spotlight Period Filtering**
*For any* set of venues with various business account creation dates, only venues with created_at timestamps within the last 30 days should be included in the spotlight results.
**Validates: Requirements 1.2, 5.2, 5.5**

**Property 2: Descending Date Order**
*For any* list of spotlight venues returned by the query, each venue's signup_date should be greater than or equal to the next venue's signup_date (newest first ordering).
**Validates: Requirements 1.3**

**Property 3: Result Set Size Limit**
*For any* query to fetch new venues, the returned array length should never exceed 10 venues.
**Validates: Requirements 1.4**

**Property 4: Required Card Information Display**
*For any* venue card rendered in the spotlight, the rendered output should contain the venue's name, category, rating (or "New - No ratings yet"), and location text.
**Validates: Requirements 2.1**

**Property 5: Image Display Guarantee**
*For any* venue card, either the venue's image_url or a placeholder image URL should be present in the Image component's source prop.
**Validates: Requirements 2.2**

**Property 6: NEW Badge Presence**
*For any* venue card rendered in the spotlight carousel, the rendered output should include a "NEW" badge component.
**Validates: Requirements 2.3**

**Property 7: Days Since Signup Display**
*For any* venue with a signup_date, the calculated days_since_signup value should match the difference between the current date and the signup_date, and this value should be displayed on the card.
**Validates: Requirements 2.4**

**Property 8: Navigation with Correct Venue ID**
*For any* venue card in the spotlight, when the onPress handler is triggered, it should call onVenuePress with the correct venue ID matching that card's venue.
**Validates: Requirements 3.1**

**Property 9: Cache Behavior Within Time Window**
*For any* sequence of calls to getNewVenues within a 5-minute window, only the first call should execute a database query, and subsequent calls should return cached data.
**Validates: Requirements 4.2**

**Property 10: Theme Color Application**
*For any* theme object (light or dark mode), the spotlight component should apply theme.colors values to all styled elements (backgrounds, borders, text).
**Validates: Requirements 6.1**

**Property 11: Distance Display When Location Available**
*For any* venue with latitude/longitude coordinates, when userLocation is provided, the venue card should display a calculated distance value.
**Validates: Requirements 8.3**

**Property 12: Defensive Rendering with Missing Data**
*For any* venue object with missing optional fields (description, phone, website, rating), the component should render successfully using default values without throwing errors.
**Validates: Requirements 10.4**

### Edge Case Properties

**Edge Case 1: Zero Ratings Display**
When a venue has a rating of 0 or null, the card should display "New - No ratings yet" instead of a numeric rating.
**Validates: Requirements 2.5**

**Edge Case 2: Empty Venue List Handling**
When the venues array is empty (length === 0), the component should return null and not render any UI elements.
**Validates: Requirements 1.5, 7.1, 7.2**

### Example-Based Tests

**Example 1: Component Renders in Correct Position**
When HomeScreen renders with new venues available, the NewVenuesSpotlightCarousel should appear above the main venue list and below the RecentCheckInsSection.
**Validates: Requirements 1.1**

**Example 2: FlatList Scroll Configuration**
The FlatList component should have horizontal={true}, showsHorizontalScrollIndicator={false}, snapToInterval={CARD_WIDTH + CARD_MARGIN}, and decelerationRate="fast".
**Validates: Requirements 3.2, 3.3, 3.4**

**Example 3: Query Structure Verification**
The getNewVenues query should include an INNER JOIN with venue_business_accounts and a WHERE clause filtering by created_at >= NOW() - INTERVAL '30 days'.
**Validates: Requirements 4.1**

**Example 4: Refresh Triggers Refetch**
When the HomeScreen's onRefresh function is called, it should invoke the spotlight venues refetch function.
**Validates: Requirements 4.3**

**Example 5: Error Handling Behavior**
When the getNewVenues query throws an error, the error should be logged via console.error and the component should return null.
**Validates: Requirements 4.5, 10.1, 10.2**

**Example 6: Spotlight Period Constant**
The SPOTLIGHT_PERIOD_DAYS constant should be defined as 30.
**Validates: Requirements 5.1**

**Example 7: Creation Date Field Usage**
The calculateDaysSinceSignup function should use venue_business_accounts.created_at as the signup date.
**Validates: Requirements 5.3**

**Example 8: Current Time in Calculation**
The calculateDaysSinceSignup function should use new Date() or Date.now() to get the current timestamp.
**Validates: Requirements 5.4**

**Example 9: Spotlight Icon Display**
The section header should contain an Icon component with name="sparkles" or name="star".
**Validates: Requirements 6.2**

**Example 10: Card Width Calculation**
The CARD_WIDTH constant should equal Dimensions.get('window').width * 0.7.
**Validates: Requirements 6.3**

**Example 11: Card Margin Value**
The CARD_MARGIN constant should equal 12.
**Validates: Requirements 6.4**

**Example 12: Dark Mode Styling**
When theme.dark is true, card backgrounds should use theme.colors.surface and text should use theme.colors.text (which are theme-aware).
**Validates: Requirements 6.5**

**Example 13: Empty State Logging**
When venues.length === 0, console.log should be called with a message indicating the spotlight section is hidden.
**Validates: Requirements 7.5**

**Example 14: Filter Independence**
The NewVenuesSpotlightCarousel should render regardless of the selectedCategory state value in HomeScreen.
**Validates: Requirements 8.4, 8.5**

**Example 15: Accessibility Labels**
The section header should have accessibilityLabel="New Venues Spotlight" and each venue card should have an accessibilityLabel including the venue name and "new venue".
**Validates: Requirements 9.1, 9.2, 9.3**

**Example 16: Minimum Touch Target Size**
Venue cards should have a minimum height of 44 points to meet accessibility guidelines.
**Validates: Requirements 9.4**

**Example 17: Image Placeholder Fallback**
The Image component should use a placeholder URL (e.g., 'https://via.placeholder.com/300x150') when venue.image_url is null or undefined.
**Validates: Requirements 10.3**

## Error Handling

### Data Fetching Errors

**Strategy**: Graceful degradation with logging
- Catch all errors from VenueService.getNewVenues()
- Log errors with context (error message, timestamp, user ID if available)
- Set error state to true
- Component returns null when error state is true
- Do not display error messages to users (fail silently)

**Implementation**:
```typescript
try {
  const newVenues = await VenueService.getNewVenues(10);
  setVenues(newVenues);
  setError(null);
} catch (err) {
  console.error('Failed to fetch new venues:', err, {
    timestamp: new Date().toISOString(),
    userId: user?.id
  });
  setError(err as Error);
  setVenues([]);
}
```

### Image Loading Errors

**Strategy**: Fallback to placeholder
- Use placeholder image URL as fallback in Image source
- React Native Image component handles this automatically with source array
- No additional error handling needed

**Implementation**:
```typescript
<Image
  source={{
    uri: venue.image_url || 'https://via.placeholder.com/300x150'
  }}
  style={styles.venueImage}
/>
```

### Missing or Incomplete Data

**Strategy**: Defensive rendering with defaults
- Use optional chaining and nullish coalescing for all venue fields
- Provide sensible defaults for missing data
- Never crash due to missing fields

**Defaults**:
- name: 'Unnamed Venue'
- category: 'General'
- location: 'Location not specified'
- rating: null → display "New - No ratings yet"
- image_url: null → use placeholder
- description: null → omit from display

### Navigation Errors

**Strategy**: Validate venue ID before navigation
- Check that venue.id exists and is a valid UUID
- Log warning if invalid
- Prevent navigation if invalid

**Implementation**:
```typescript
const handleVenuePress = (venue: Venue) => {
  if (!venue.id) {
    console.warn('Cannot navigate: venue ID is missing', venue);
    return;
  }
  onVenuePress(venue.id);
};
```

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples, edge cases, and component configuration:

1. **Component Rendering Tests**
   - Renders correctly with valid venue data
   - Returns null when venues array is empty
   - Displays loading skeleton when loading prop is true
   - Applies correct theme colors in light and dark modes

2. **Data Transformation Tests**
   - calculateDaysSinceSignup returns correct day count
   - formatSignupText returns correct text for 0, 1, and N days
   - isEligibleForSpotlight correctly filters by 30-day window

3. **Configuration Tests**
   - CARD_WIDTH equals 70% of screen width
   - CARD_MARGIN equals 12
   - SPOTLIGHT_PERIOD_DAYS equals 30
   - FlatList has correct scroll props

4. **Edge Case Tests**
   - Venue with rating = 0 displays "New - No ratings yet"
   - Venue with rating = null displays "New - No ratings yet"
   - Venue with missing image_url uses placeholder
   - Venue with missing optional fields renders with defaults

5. **Error Handling Tests**
   - Component returns null when error state is true
   - Error is logged when fetch fails
   - Image fallback works when image_url is null

6. **Accessibility Tests**
   - Section header has correct accessibilityLabel
   - Venue cards have descriptive accessibilityLabels
   - Touch targets meet minimum size requirements

### Property-Based Tests

Property-based tests will verify universal properties across randomized inputs. Each test will run a minimum of 100 iterations.

1. **Property Test: Spotlight Period Filtering**
   - **Feature: new-venues-spotlight, Property 1: Spotlight Period Filtering**
   - Generate random arrays of venues with various created_at dates
   - Filter using isEligibleForSpotlight
   - Verify all results have created_at within last 30 days
   - Verify no results have created_at older than 30 days

2. **Property Test: Descending Date Order**
   - **Feature: new-venues-spotlight, Property 2: Descending Date Order**
   - Generate random arrays of venues with various signup dates
   - Sort using the query's ORDER BY logic
   - Verify each venue's signup_date >= next venue's signup_date

3. **Property Test: Result Set Size Limit**
   - **Feature: new-venues-spotlight, Property 3: Result Set Size Limit**
   - Generate random arrays of venues (0 to 100 venues)
   - Apply limit of 10
   - Verify result length <= 10

4. **Property Test: Required Card Information Display**
   - **Feature: new-venues-spotlight, Property 4: Required Card Information Display**
   - Generate random venue objects
   - Render venue card component
   - Verify rendered output contains name, category, rating/text, location

5. **Property Test: Image Display Guarantee**
   - **Feature: new-venues-spotlight, Property 5: Image Display Guarantee**
   - Generate random venues with and without image_url
   - Render venue card
   - Verify Image source contains either venue.image_url or placeholder

6. **Property Test: NEW Badge Presence**
   - **Feature: new-venues-spotlight, Property 6: NEW Badge Presence**
   - Generate random venue objects
   - Render venue card
   - Verify "NEW" badge is present in rendered output

7. **Property Test: Days Since Signup Display**
   - **Feature: new-venues-spotlight, Property 7: Days Since Signup Display**
   - Generate random signup dates within last 30 days
   - Calculate days using calculateDaysSinceSignup
   - Verify calculation matches manual calculation
   - Verify formatted text is displayed

8. **Property Test: Navigation with Correct Venue ID**
   - **Feature: new-venues-spotlight, Property 8: Navigation with Correct Venue ID**
   - Generate random venue objects
   - Simulate press on venue card
   - Verify onVenuePress is called with correct venue.id

9. **Property Test: Theme Color Application**
   - **Feature: new-venues-spotlight, Property 10: Theme Color Application**
   - Generate random theme objects (light and dark)
   - Render component with theme
   - Verify all styled elements use theme.colors values

10. **Property Test: Distance Display When Location Available**
    - **Feature: new-venues-spotlight, Property 11: Distance Display When Location Available**
    - Generate random venues with coordinates
    - Generate random user locations
    - Render venue card with location
    - Verify distance is calculated and displayed

11. **Property Test: Defensive Rendering with Missing Data**
    - **Feature: new-venues-spotlight, Property 12: Defensive Rendering with Missing Data**
    - Generate random venues with randomly missing optional fields
    - Render venue card
    - Verify component renders without errors
    - Verify defaults are used for missing fields

### Integration Tests

Integration tests will verify the feature works correctly within the HomeScreen context:

1. **HomeScreen Integration**
   - Spotlight section appears in correct position
   - Spotlight data loads in parallel with other sections
   - Pull-to-refresh updates spotlight data
   - Navigation to venue detail works correctly

2. **Cache Integration**
   - First call fetches from database
   - Subsequent calls within 5 minutes use cache
   - Cache expires after 5 minutes
   - Refresh bypasses cache

3. **Location Integration**
   - Distance displays when location is available
   - Distance updates when location changes
   - No distance shown when location unavailable

### Test File Organization

```
src/components/venue/
  NewVenuesSpotlightCarousel.tsx
  __tests__/
    NewVenuesSpotlightCarousel.test.tsx (unit tests)
    NewVenuesSpotlightCarousel.pbt.test.tsx (property tests)

src/hooks/
  useNewVenues.ts
  __tests__/
    useNewVenues.test.tsx (unit tests)
    useNewVenues.pbt.test.tsx (property tests)

src/services/api/
  venues.ts (extend with getNewVenues)
  __tests__/
    venues.newVenues.test.ts (unit tests)
    venues.newVenues.pbt.test.ts (property tests)

src/utils/formatting/
  venue.ts (helper functions)
  __tests__/
    venue.test.ts (unit tests)
    venue.pbt.test.ts (property tests)
```

### Property-Based Testing Library

**Library**: fast-check (for TypeScript/JavaScript)
- Mature property-based testing library for JavaScript
- Integrates well with Jest
- Provides arbitraries for common types
- Supports custom generators

**Installation**:
```bash
npm install --save-dev fast-check
```

**Example Property Test**:
```typescript
import fc from 'fast-check';

describe('Property: Spotlight Period Filtering', () => {
  it('should only include venues within 30-day window', () => {
    fc.assert(
      fc.property(
        fc.array(venueWithDateArbitrary()),
        (venues) => {
          const filtered = venues.filter(v => 
            isEligibleForSpotlight(v.signup_date, 30)
          );
          
          return filtered.every(v => {
            const days = calculateDaysSinceSignup(v.signup_date);
            return days >= 0 && days <= 30;
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
```
