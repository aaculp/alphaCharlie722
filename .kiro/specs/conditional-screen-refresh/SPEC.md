# Conditional Screen Refresh System

**Status:** Draft  
**Priority:** High  
**Effort:** Small (4-6 hours)  
**Dependencies:** None  
**Related:** Navigation, Data Fetching, Performance

---

## Problem Statement

### Current Behavior (Issue)

When users navigate between screens, data doesn't refresh appropriately:

**Scenario:**
1. User views HomeScreen (shows venue with 4.5 rating)
2. User navigates to VenueDetailScreen
3. User adds a 5-star review (venue rating becomes 4.6)
4. User navigates back to HomeScreen
5. ❌ **HomeScreen still shows 4.5 rating** (stale data)

**Root Cause:**
- React Navigation keeps screens mounted in the stack
- `useEffect` hooks don't re-run when screen comes back into focus
- No mechanism to signal when data has changed

**Impact:**
- Confusing UX (users see stale data)
- Users must manually pull-to-refresh
- Appears broken/buggy

---

## Solution Overview

Implement a **conditional refresh system** that:
- ✅ Only refetches when data actually changed
- ✅ Zero unnecessary API calls
- ✅ Works with existing hooks
- ✅ Simple to implement and maintain
- ✅ No new dependencies

### Core Principle

Use navigation params as a "dirty flag" to signal when data needs refresh:

```typescript
// Screen A: User makes a change
navigation.setParams({ needsRefresh: true });

// Screen B: Checks flag on focus
if (route.params?.needsRefresh) {
  refetch(); // Only refetch when needed
  navigation.setParams({ needsRefresh: undefined }); // Clear flag
}
```

---

## Requirements

### Functional Requirements

**FR-1: Conditional Refresh on Focus**
- When a screen comes into focus, check if data needs refresh
- Only refetch if explicitly signaled via navigation params
- Clear the refresh flag after refetching

**FR-2: Signal Data Changes**
- Screens that modify data must signal parent screens
- Use navigation params to pass refresh signals
- Support multiple refresh targets (e.g., home, favorites, profile)

**FR-3: Zero Unnecessary Fetches**
- No refetch when user views screen without making changes
- No refetch when data is already fresh
- Preserve existing pull-to-refresh functionality

**FR-4: Backward Compatible**
- Works with existing custom hooks
- No breaking changes to current API
- Existing screens continue to work

### Non-Functional Requirements

**NFR-1: Performance**
- No performance degradation
- Minimal overhead (< 1ms per focus event)
- No memory leaks

**NFR-2: Maintainability**
- Simple, easy-to-understand pattern
- Consistent across all screens
- Well-documented

**NFR-3: Testability**
- Easy to test refresh behavior
- Can mock navigation params
- Clear success/failure criteria

---

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Navigation Stack                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  HomeScreen (mounted, in background)                         │
│    ├─ useFocusEffect: Listening for focus events            │
│    └─ Checks route.params.needsRefresh on focus             │
│                                                               │
│  VenueDetailScreen (mounted, in foreground)                  │
│    ├─ User adds review                                       │
│    ├─ Review submitted successfully                          │
│    └─ navigation.setParams({ needsRefresh: true })          │
│                                                               │
│  [User navigates back]                                       │
│                                                               │
│  HomeScreen (comes into focus)                               │
│    ├─ useFocusEffect triggered                              │
│    ├─ Checks route.params.needsRefresh → true              │
│    ├─ Calls refetch()                                       │
│    ├─ Clears flag: setParams({ needsRefresh: undefined })  │
│    └─ Shows updated data                                    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Pattern

#### Pattern 1: Screen That Displays Data (Consumer)

```typescript
import { useFocusEffect, useRoute } from '@react-navigation/native';

function HomeScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { venues, refetch } = useVenues();

  // Conditional refresh on focus
  useFocusEffect(
    React.useCallback(() => {
      const needsRefresh = route.params?.needsRefresh;
      
      if (needsRefresh) {
        console.log('🔄 Data changed, refreshing HomeScreen...');
        refetch();
        navigation.setParams({ needsRefresh: undefined });
      } else {
        console.log('✅ No changes, skipping refresh');
      }
    }, [route.params?.needsRefresh, refetch, navigation])
  );

  return (
    // ... UI
  );
}
```

#### Pattern 2: Screen That Modifies Data (Producer)

```typescript
function VenueDetailScreen() {
  const navigation = useNavigation();

  const handleReviewSubmit = async () => {
    await submitReview();
    
    // Signal parent screens to refresh
    navigation.setParams({ needsRefresh: true });
    
    // If navigating back immediately
    navigation.goBack();
  };

  return (
    // ... UI
  );
}
```

---

## Implementation Plan

### Phase 1: Core Implementation (2 hours)

**Step 1.1: Update HomeScreen**
- Add `useFocusEffect` hook
- Check `route.params.needsRefresh`
- Call `refetch()` when flag is set
- Clear flag after refetch

**Step 1.2: Update VenueDetailScreen**
- Set `needsRefresh` flag after review submission
- Set flag after any data mutation
- Test navigation back to HomeScreen

**Step 1.3: Test Basic Flow**
- Navigate HomeScreen → VenueDetail
- Add review
- Navigate back
- Verify HomeScreen refreshes

### Phase 2: Extend to Other Screens (2 hours)

**Step 2.1: Identify All Data Mutation Points**
- Review submission
- Review editing
- Review deletion
- Favorite toggle
- Check-in/check-out
- Collection updates
- Friend actions

**Step 2.2: Add Refresh Signals**
- Update each mutation handler
- Set appropriate refresh flags
- Document which screens need refresh

**Step 2.3: Update Consumer Screens**
- FavoritesScreen
- ProfileScreen
- SearchScreen (if needed)
- Any other screens displaying mutable data

### Phase 3: Testing & Documentation (1-2 hours)

**Step 3.1: Manual Testing**
- Test all user flows
- Verify no unnecessary refetches
- Check performance impact

**Step 3.2: Documentation**
- Update component documentation
- Add usage examples
- Document refresh patterns

**Step 3.3: Code Review**
- Review implementation
- Check for edge cases
- Verify consistency

---

## Detailed Implementation

### File: `src/screens/customer/HomeScreen.tsx`

```typescript
import React, { useCallback } from 'react';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';

const HomeScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { venues, loading, refetch } = useVenues({ featured: true });
  const { refetch: refetchCheckInStats } = useCheckInStats({ venueIds });

  // Conditional refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      const needsRefresh = route.params?.needsRefresh;
      
      if (needsRefresh) {
        console.log('🔄 HomeScreen: Data changed, refreshing...');
        
        // Refetch venues to get updated ratings/reviews
        refetch();
        
        // Optionally refetch check-in stats
        refetchCheckInStats();
        
        // Clear the flag
        navigation.setParams({ needsRefresh: undefined });
      } else {
        console.log('✅ HomeScreen: No changes detected, skipping refresh');
      }
    }, [route.params?.needsRefresh, refetch, refetchCheckInStats, navigation])
  );

  // ... rest of component
};
```

### File: `src/screens/customer/VenueDetailScreen.tsx`

```typescript
import { useNavigation } from '@react-navigation/native';

const VenueDetailScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleReviewSubmitSuccess = async () => {
    console.log('📝 Review submitted, signaling refresh...');

    // Refresh local data
    if (user?.id) {
      const review = await ReviewService.getUserReviewForVenue(user.id, venueId);
      setUserReview(review);
    }

    // Refresh venue details
    const supabaseVenue = await VenueService.getVenueById(venueId);
    if (supabaseVenue) {
      setVenue(supabaseVenue);
    }

    // Refresh recent reviews
    const response = await ReviewService.getVenueReviews({
      venueId,
      limit: 3,
      offset: 0,
      sortBy: 'recent',
    });
    setRecentReviews(response.reviews);

    // Signal HomeScreen to refresh when user navigates back
    navigation.setParams({ needsRefresh: true });
  };

  // ... rest of component
};
```

---

## Edge Cases & Considerations

### Edge Case 1: Multiple Navigation Levels

**Scenario:** HomeScreen → VenueDetail → ReviewList → HomeScreen

**Solution:** Use navigation.navigate() with params instead of goBack()

```typescript
// In ReviewList after review submission
navigation.navigate('Home', { 
  screen: 'HomeList',
  params: { needsRefresh: true }
});
```

### Edge Case 2: Multiple Tabs

**Scenario:** User on Search tab, adds review, switches to Home tab

**Solution:** Each tab stack manages its own refresh state independently

```typescript
// Each stack navigator has its own params
// Home stack and Search stack are separate
```

### Edge Case 3: Rapid Navigation

**Scenario:** User navigates back and forth quickly

**Solution:** Flag is cleared after refetch, prevents duplicate fetches

```typescript
if (needsRefresh) {
  refetch();
  navigation.setParams({ needsRefresh: undefined }); // Cleared immediately
}
```

### Edge Case 4: Background App Return

**Scenario:** User backgrounds app, returns later

**Solution:** Existing real-time subscriptions handle this, no change needed

```typescript
// Real-time subscription continues to work
// useFocusEffect only handles explicit user actions
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('Conditional Refresh', () => {
  it('should refetch when needsRefresh is true', () => {
    const mockRefetch = jest.fn();
    const mockRoute = { params: { needsRefresh: true } };
    
    renderHook(() => useConditionalRefresh(mockRoute, mockRefetch));
    
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('should not refetch when needsRefresh is false', () => {
    const mockRefetch = jest.fn();
    const mockRoute = { params: { needsRefresh: false } };
    
    renderHook(() => useConditionalRefresh(mockRoute, mockRefetch));
    
    expect(mockRefetch).not.toHaveBeenCalled();
  });

  it('should clear flag after refetch', () => {
    const mockSetParams = jest.fn();
    const mockRoute = { params: { needsRefresh: true } };
    
    renderHook(() => useConditionalRefresh(mockRoute, jest.fn(), mockSetParams));
    
    expect(mockSetParams).toHaveBeenCalledWith({ needsRefresh: undefined });
  });
});
```

### Integration Tests

```typescript
describe('HomeScreen Refresh Flow', () => {
  it('should refresh after review submission', async () => {
    // 1. Render HomeScreen
    const { getByText } = render(<HomeScreen />);
    
    // 2. Navigate to VenueDetail
    fireEvent.press(getByText('Test Venue'));
    
    // 3. Submit review
    fireEvent.press(getByText('Add Review'));
    fireEvent.press(getByText('Submit'));
    
    // 4. Navigate back
    fireEvent.press(getByText('Back'));
    
    // 5. Verify HomeScreen refreshed
    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});
```

### Manual Test Cases

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| **TC-1: Review Submission** | 1. View venue on HomeScreen<br>2. Navigate to VenueDetail<br>3. Add review<br>4. Navigate back | HomeScreen shows updated rating |
| **TC-2: No Action** | 1. View venue on HomeScreen<br>2. Navigate to VenueDetail<br>3. Navigate back (no action) | HomeScreen does NOT refetch |
| **TC-3: Multiple Reviews** | 1. Add review on Venue A<br>2. Navigate back<br>3. Add review on Venue B<br>4. Navigate back | Both venues show updated ratings |
| **TC-4: Favorite Toggle** | 1. Toggle favorite on VenueDetail<br>2. Navigate back | HomeScreen shows updated favorite state |
| **TC-5: Pull to Refresh** | 1. Navigate to HomeScreen<br>2. Pull to refresh | Manual refresh still works |

---

## Performance Metrics

### Success Criteria

- ✅ Zero unnecessary API calls (no refetch when no changes)
- ✅ < 1ms overhead per focus event
- ✅ No memory leaks
- ✅ No impact on app startup time
- ✅ Works with existing real-time subscriptions

### Monitoring

```typescript
// Add performance logging
useFocusEffect(
  useCallback(() => {
    const startTime = performance.now();
    
    if (needsRefresh) {
      console.log('🔄 Refresh triggered');
      refetch();
    }
    
    const duration = performance.now() - startTime;
    console.log(`⏱️ Focus handler took ${duration.toFixed(2)}ms`);
  }, [needsRefresh])
);
```

---

## Migration Path

### Phase 1: Pilot (Week 1)
- Implement on HomeScreen ↔ VenueDetailScreen only
- Monitor for issues
- Gather feedback

### Phase 2: Expand (Week 2)
- Add to FavoritesScreen
- Add to ProfileScreen
- Add to SearchScreen

### Phase 3: Complete (Week 3)
- Add to all remaining screens
- Remove any workarounds
- Update documentation

---

## Rollback Plan

If issues arise:

1. **Quick Rollback:** Remove `useFocusEffect` hooks
2. **Fallback:** Use pull-to-refresh only
3. **Alternative:** Implement timestamp-based refresh

```typescript
// Rollback: Remove useFocusEffect
// App continues to work with pull-to-refresh
```

---

## Future Enhancements

### Enhancement 1: Smart Refresh Targeting

Instead of generic `needsRefresh`, specify what needs refresh:

```typescript
navigation.setParams({ 
  refreshTargets: ['venues', 'reviews', 'favorites']
});
```

### Enhancement 2: Timestamp-Based Staleness

Combine flag with timestamp for hybrid approach:

```typescript
const STALE_TIME = 5 * 60 * 1000; // 5 minutes

if (needsRefresh || (Date.now() - lastRefresh > STALE_TIME)) {
  refetch();
}
```

### Enhancement 3: Global Refresh Context

Create a context for managing refresh state:

```typescript
const { markStale, isStale } = useRefreshContext();

// In VenueDetail
markStale('home');

// In HomeScreen
if (isStale('home')) refetch();
```

---

## Documentation

### Developer Guide

**When to use conditional refresh:**
- ✅ User modifies data (add/edit/delete)
- ✅ User performs action that affects parent screen
- ✅ Data mutation that should be reflected immediately

**When NOT to use:**
- ❌ User just views data (no changes)
- ❌ Real-time subscription already handles it
- ❌ Data doesn't affect parent screen

### Code Examples

See implementation files for complete examples:
- `src/screens/customer/HomeScreen.tsx`
- `src/screens/customer/VenueDetailScreen.tsx`

---

## Success Metrics

### Quantitative
- 📊 API call reduction: Target 50% fewer unnecessary calls
- 📊 User satisfaction: No complaints about stale data
- 📊 Performance: < 1ms overhead per focus event

### Qualitative
- ✅ Users see updated data immediately
- ✅ No manual refresh needed
- ✅ Feels responsive and fast
- ✅ No confusion about stale data

---

## Approval & Sign-off

- [ ] Technical Lead Review
- [ ] Code Review Complete
- [ ] Testing Complete
- [ ] Documentation Updated
- [ ] Ready for Production

---

**Last Updated:** January 21, 2025  
**Author:** Development Team  
**Reviewers:** TBD
