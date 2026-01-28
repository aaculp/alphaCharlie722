# Stats Grid Refactor

## Overview

Refactored the ProfileScreen stats section to use a reusable `StatsGrid` component with a new, optimized stat card order.

## Changes Made

### 1. New Component: StatsGrid

**File:** `src/components/profile/StatsGrid.tsx`

Created a reusable grid component that:
- Accepts an array of `StatConfig` objects
- Automatically filters stats based on `condition` property
- Renders stats in a responsive grid layout
- Eliminates repetitive conditional rendering code

**Interface:**
```typescript
interface StatConfig {
  icon: string;
  label: string;
  value: string | number;
  iconColor: string;
  subtitle?: string;
  condition?: boolean; // Only shows when true
}
```

### 2. Updated ProfileScreen

**File:** `src/screens/customer/ProfileScreen.tsx`

**Changes:**
- Replaced individual `StatCard` components with single `StatsGrid` component
- Used `useMemo` to configure stats array (optimized re-renders)
- Reorganized stat order per requirements
- Reduced code from ~130 lines to ~100 lines

### 3. New Stat Order

The stats now appear in this order (7 rows, 2 columns):

```
Row 1:  Avg per Offer      | Total Savings
Row 2:  Offers Redeemed    | Check-ins
Row 3:  Current Streak     | Longest Streak
Row 4:  Top Venue          | Avg Rating
Row 5:  Most Active        | Favorite Time
Row 6:  Venues             | Favorites
Row 7:  This Month         | (empty)
```

### 4. Conditional Display Logic

Stats with conditions only show when:
- `averageSavings > 0`
- `totalSavings > 0`
- `redeemedOffersCount > 0`
- `currentStreak > 0`
- `longestStreak > 0`
- `topVenue` exists
- `averageRatingGiven > 0`
- `mostActiveDay` exists
- `mostActiveTime` exists

Always visible stats:
- Check-ins
- Venues
- Favorites
- This Month

## Benefits

### Code Quality
- **DRY Principle**: Eliminated repetitive conditional rendering
- **Maintainability**: Single source of truth for stats configuration
- **Reusability**: StatsGrid can be used in other screens
- **Type Safety**: StatConfig interface ensures consistency

### Performance
- **Optimized Re-renders**: useMemo prevents unnecessary recalculations
- **Cleaner JSX**: Reduced component tree complexity

### User Experience
- **Logical Grouping**: Related stats appear together
- **Priority Order**: Most valuable stats (savings) appear first
- **Consistent Layout**: Grid maintains visual balance

## Usage Example

```typescript
const stats: StatConfig[] = useMemo(() => [
  {
    icon: 'trending-up',
    label: 'Avg per Offer',
    value: formatCurrency(profileData?.averageSavings),
    iconColor: '#059669',
    subtitle: 'Money saved',
    condition: (profileData?.averageSavings ?? 0) > 0,
  },
  // ... more stats
], [profileData, theme]);

return <StatsGrid stats={stats} />;
```

## Migration Notes

### Before
```tsx
<View style={styles.statsContainer}>
  <StatCard icon="location" label="Check-ins" value={...} />
  {condition && <StatCard icon="flash" label="..." value={...} />}
  {condition && <StatCard icon="cash" label="..." value={...} />}
  // ... 13 more StatCards with various conditions
</View>
```

### After
```tsx
<StatsGrid stats={stats} />
```

## Testing

To test the new layout:
1. View profile with no redeemed offers (should show 4 base stats)
2. Redeem offers with claim values (should show savings stats)
3. Build up streaks (should show streak stats)
4. Check various screen sizes (grid should remain responsive)

## Related Files

- Component: `src/components/profile/StatsGrid.tsx`
- Screen: `src/screens/customer/ProfileScreen.tsx`
- Index: `src/components/profile/index.ts`
- Types: Inline `StatConfig` interface
