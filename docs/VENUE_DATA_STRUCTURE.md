# Venue Data Structure - Unified Approach

## Overview

This document explains the unified venue data structure used across all venue display components in the OTW app. The goal is to ensure consistency and prevent bugs caused by different data structures in different sections.

## The Problem We Solved

Previously, different sections of the app were passing venue data in different formats:
- **HomeScreen featured venues**: Had check-in stats
- **New Venues section**: Had hardcoded `0` for check-in count
- **Recently Visited section**: Had check-in stats but different structure
- **Search results**: Different structure again

This caused:
- ❌ Inconsistent customer counts (same venue showing different numbers)
- ❌ Duplicate code for fetching stats
- ❌ Bugs when adding new venue sections
- ❌ Confusion about what data is available where

## The Solution: VenueWithStats

We created a unified `VenueWithStats` type that all venue cards expect:

```typescript
interface VenueWithStats extends Venue {
  // Check-in statistics (always included)
  stats?: {
    active_checkins: number;
    recent_checkins: number;
    user_is_checked_in: boolean;
    user_checkin_id?: string;
    user_checkin_time?: string;
  };
  
  // Optional metadata (section-specific)
  metadata?: {
    // For "Recently Visited"
    last_visit_time?: string;
    visit_count?: number;
    
    // For "New Venues"
    signup_date?: string;
    days_since_signup?: number;
    
    // For distance sorting
    distance_km?: number;
    distance_formatted?: string;
  };
}
```

## Usage Pattern

### 1. Fetch Base Venue Data

```typescript
// From any source
const venues: Venue[] = await VenueService.getFeaturedVenues();
```

### 2. Fetch Check-in Stats

```typescript
const venueIds = venues.map(v => v.id);
const statsMap = await CheckInService.getMultipleVenueStats(venueIds, userId);
```

### 3. Transform to Unified Structure

```typescript
import { transformVenuesWithStats } from '../utils/venue/venueDataTransform';

const venuesWithStats = transformVenuesWithStats(venues, statsMap);
```

### 4. Add Section-Specific Metadata (Optional)

```typescript
// For New Venues section
import { addNewVenueMetadata } from '../utils/venue/venueDataTransform';
const newVenues = addNewVenueMetadata(venuesWithStats);

// For Recently Visited section
import { addRecentlyVisitedMetadata } from '../utils/venue/venueDataTransform';
const recentVenues = addRecentlyVisitedMetadata(
  venuesWithStats,
  lastVisitTimesMap,
  visitCountsMap
);

// For distance-based sorting
import { addDistanceMetadata, sortVenuesByDistance } from '../utils/venue/venueDataTransform';
const nearbyVenues = sortVenuesByDistance(
  addDistanceMetadata(venuesWithStats, userLocation)
);
```

### 5. Pass to Venue Cards

```typescript
// All venue cards accept VenueWithStats
<CompactVenueCard
  venue={venueWithStats}
  checkInCount={venueWithStats.stats?.active_checkins || 0}
  maxCapacity={venueWithStats.max_capacity || 100}
  // ... other props
/>

<WideVenueCard
  venue={venueWithStats}
  checkInCount={venueWithStats.stats?.active_checkins || 0}
  // ... other props
/>
```

## Transformation Utilities

Located in `src/utils/venue/venueDataTransform.ts`:

### Core Functions

- **`transformVenueWithStats(venue, stats)`** - Transform single venue
- **`transformVenuesWithStats(venues, statsMap)`** - Transform multiple venues

### Metadata Functions

- **`addNewVenueMetadata(venues)`** - Add signup date and days since signup
- **`addRecentlyVisitedMetadata(venues, lastVisitTimes, visitCounts)`** - Add visit history
- **`addDistanceMetadata(venues, userLocation)`** - Add distance calculations
- **`sortVenuesByDistance(venues)`** - Sort by distance (closest first)

## Implementation Checklist

When adding a new venue section:

- [ ] Fetch base venue data from appropriate source
- [ ] Fetch check-in stats using `CheckInService.getMultipleVenueStats()`
- [ ] Transform using `transformVenuesWithStats()`
- [ ] Add section-specific metadata if needed
- [ ] Pass `VenueWithStats` to venue cards
- [ ] Use `venue.stats?.active_checkins || 0` for customer count
- [ ] Use `venue.metadata?.{field}` for section-specific data

## Examples

### HomeScreen Featured Venues

```typescript
// 1. Fetch venues
const { venues, loading } = useVenues({ featured: true, limit: 10 });

// 2. Fetch stats
const venueIds = useMemo(() => venues.map(v => v.id), [venues]);
const { stats: checkInStats } = useCheckInStats({ venueIds });

// 3. Transform (done in render)
const venueWithStats = transformVenueWithStats(venue, checkInStats.get(venue.id));

// 4. Render
<WideVenueCard
  venue={venueWithStats}
  checkInCount={venueWithStats.stats?.active_checkins || 0}
/>
```

### New Venues Section

```typescript
// 1. Fetch new venues
const { venues: newVenues } = useNewVenues();

// 2. Fetch stats (in VenuesCarouselSection)
const venueIds = useMemo(() => venues.map(v => v.id), [venues]);
const statsMap = await CheckInService.getMultipleVenueStats(venueIds, user?.id);

// 3. Transform with metadata
const venuesWithStats = addNewVenueMetadata(
  transformVenuesWithStats(newVenues, statsMap)
);

// 4. Render
<CompactVenueCard
  venue={venueWithStats}
  checkInCount={venueWithStats.stats?.active_checkins || 0}
  subtitle={`${venueWithStats.metadata?.days_since_signup} days ago`}
/>
```

### Recently Visited Section

```typescript
// 1. Fetch check-in history
const { checkIns } = useCheckInHistory();

// 2. Extract venues and visit times
const venues = checkIns.map(ci => ci.venue);
const lastVisitTimes = new Map(checkIns.map(ci => [ci.venue_id, ci.checked_in_at]));

// 3. Fetch stats
const statsMap = await CheckInService.getMultipleVenueStats(venueIds, user?.id);

// 4. Transform with metadata
const venuesWithStats = addRecentlyVisitedMetadata(
  transformVenuesWithStats(venues, statsMap),
  lastVisitTimes
);

// 5. Render
<CompactVenueCard
  venue={venueWithStats}
  checkInCount={venueWithStats.stats?.active_checkins || 0}
  subtitle={formatCheckInTime(venueWithStats.metadata?.last_visit_time)}
/>
```

## Benefits

✅ **Consistency**: Same venue shows same data everywhere
✅ **Type Safety**: TypeScript ensures correct structure
✅ **Maintainability**: One place to update venue structure
✅ **Flexibility**: Easy to add new sections with metadata
✅ **Performance**: Batch fetch stats for all venues at once
✅ **Debugging**: Clear data flow and transformations

## Migration Guide

To migrate existing code:

1. **Import the utilities**:
   ```typescript
   import { transformVenuesWithStats } from '../utils/venue/venueDataTransform';
   import type { VenueWithStats } from '../types';
   ```

2. **Update state types**:
   ```typescript
   // Before
   const [venues, setVenues] = useState<Venue[]>([]);
   
   // After
   const [venues, setVenues] = useState<VenueWithStats[]>([]);
   ```

3. **Transform after fetching**:
   ```typescript
   const statsMap = await CheckInService.getMultipleVenueStats(venueIds, userId);
   const venuesWithStats = transformVenuesWithStats(venues, statsMap);
   setVenues(venuesWithStats);
   ```

4. **Update venue card props**:
   ```typescript
   // Before
   <CompactVenueCard
     venue={venue}
     checkInCount={0} // ❌ Hardcoded
   />
   
   // After
   <CompactVenueCard
     venue={venue}
     checkInCount={venue.stats?.active_checkins || 0} // ✅ Dynamic
   />
   ```

## Testing

When testing venue sections:

1. Verify all venues have `stats` property
2. Check `active_checkins` matches database
3. Ensure same venue shows same count in all sections
4. Test with 0 check-ins, 1 check-in, and many check-ins
5. Verify metadata is section-specific and optional

## Future Enhancements

Potential additions to `VenueWithStats`:

- `favorites_count` - Number of users who favorited
- `trending_score` - Calculated trending metric
- `user_has_favorited` - Boolean for favorite status
- `user_has_reviewed` - Boolean for review status
- `user_rating` - User's rating if they reviewed
- `promotional_badge` - Special badges (e.g., "Featured", "Hot Deal")

## Questions?

See also:
- `src/types/venue.types.ts` - Type definitions
- `src/utils/venue/venueDataTransform.ts` - Transformation utilities
- `src/services/api/checkins.ts` - Check-in stats API
