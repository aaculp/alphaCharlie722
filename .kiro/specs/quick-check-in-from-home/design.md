# Design Document

## Overview

This feature adds quick check-in functionality directly to venue cards on the HomeScreen by integrating the existing CheckInButton component. The design leverages existing components and services to minimize new code while maximizing user experience improvements. The implementation focuses on state management, real-time updates, and seamless integration with the current check-in flow.

## Architecture

### Component Hierarchy

```
HomeScreen
├── ScrollView
│   └── VenueList
│       └── TestVenueCard (modified)
│           ├── VenueImage
│           ├── VenueInfo
│           ├── VenueEngagementChip
│           ├── VenueCustomerCount
│           └── CheckInButton (NEW)
```

### Data Flow

```
User Tap → CheckInButton → CheckInModal → CheckInService → Supabase
                ↓                                              ↓
         Loading State                                  Database Update
                ↓                                              ↓
         Modal Confirm                                   Success/Error
                ↓                                              ↓
    Update Local State ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← Response
                ↓
    Update UI (Button + Count)
```

## Components and Interfaces

### Modified Components

#### 1. TestVenueCard Component

**Location:** `src/components/venue/TestVenueCard.tsx`

**New Props:**
```typescript
interface TestVenueCardProps {
  // ... existing props
  onCheckInChange?: (isCheckedIn: boolean, newCount: number) => void;
  userCheckInId?: string;
  userCheckInTime?: string;
  isUserCheckedIn?: boolean;
}
```

**Changes:**
- Add CheckInButton component to card layout
- Pass check-in state and handlers to CheckInButton
- Handle check-in state updates from button callbacks
- Position button in bottom-right corner of card (non-overlapping)

**Layout Structure:**
```
┌─────────────────────────────────────┐
│  Venue Image                        │
│                                     │
├─────────────────────────────────────┤
│  Venue Name                         │
│  Category • Price Range             │
│  ⭐ Rating (Reviews)                │
│                                     │
│  [Activity Chip]  [Customer Count]  │
│                                     │
│  Distance (if available)            │
│                          [Check In] │ ← NEW
└─────────────────────────────────────┘
```

#### 2. HomeScreen Component

**Location:** `src/screens/customer/HomeScreen.tsx`

**New State:**
```typescript
const [userCheckIns, setUserCheckIns] = useState<Map<string, CheckInInfo>>(new Map());
```

**New Hooks:**
```typescript
// Fetch user's current check-in status
const { data: currentCheckIn, refetch: refetchCheckIn } = useQuery({
  queryKey: ['currentCheckIn', user?.id],
  queryFn: () => CheckInService.getUserCurrentCheckInWithVenue(user?.id),
  enabled: !!user
});
```

**Changes:**
- Fetch user's current check-in on mount
- Pass check-in state to each TestVenueCard
- Handle check-in state updates from cards
- Refetch check-in stats after check-in/out actions

### Reused Components

#### CheckInButton Component

**Location:** `src/components/checkin/CheckInButton.tsx`

**Usage:**
```typescript
<CheckInButton
  venueId={venue.id}
  venueName={venue.name}
  venueImage={venue.image_url}
  isCheckedIn={isUserCheckedIn}
  checkInId={userCheckInId}
  checkInTime={userCheckInTime}
  activeCheckIns={checkInCount}
  maxCapacity={venue.max_capacity}
  onCheckInChange={handleCheckInChange}
  size="medium"
  showModalForCheckout={true}
/>
```

**No modifications needed** - component already supports all required functionality.

#### CheckInModal Component

**Location:** `src/components/checkin/CheckInModal.tsx`

**No modifications needed** - modal is already integrated into CheckInButton.

## Data Models

### CheckInInfo Interface

```typescript
interface CheckInInfo {
  checkInId: string;
  venueId: string;
  checkInTime: string; // ISO 8601 timestamp
  venueName: string;
}
```

### VenueCheckInState Interface

```typescript
interface VenueCheckInState {
  isCheckedIn: boolean;
  checkInId?: string;
  checkInTime?: string;
  activeCheckIns: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Check-in state consistency
*For any* venue card displayed on the HomeScreen, if the user is checked in to that venue, then the CheckInButton SHALL display "Checked In" state and no other venue card SHALL display "Checked In" state.
**Validates: Requirements 1.2, 1.3, 6.2**

### Property 2: Count increment on check-in
*For any* successful check-in action, the venue's active check-in count SHALL increase by exactly 1 from its previous value.
**Validates: Requirements 3.1**

### Property 3: Count decrement on checkout
*For any* successful checkout action, the venue's active check-in count SHALL decrease by exactly 1 from its previous value, with a minimum value of 0.
**Validates: Requirements 3.2, 3.4**

### Property 4: Button state reflects check-in status
*For any* venue card, the CheckInButton visual state SHALL match the user's actual check-in status within 100ms of any state change.
**Validates: Requirements 3.3**

### Property 5: Single active check-in constraint
*For any* authenticated user, at most one venue SHALL have an active check-in for that user at any given time.
**Validates: Requirements 2.3, 6.3**

### Property 6: Authentication requirement
*For any* non-authenticated user, attempting to check in SHALL result in a login prompt and SHALL NOT create a check-in record.
**Validates: Requirements 5.1, 5.2**

### Property 7: Loading state prevents duplicate actions
*For any* check-in button in loading state, subsequent tap events SHALL be ignored until the current operation completes.
**Validates: Requirements 4.2, 5.5**

### Property 8: Error state rollback
*For any* failed check-in attempt, the button state and check-in count SHALL revert to their pre-attempt values.
**Validates: Requirements 8.1, 8.2**

## Error Handling

### Network Errors

**Scenario:** Check-in request fails due to network connectivity issues.

**Handling:**
1. Catch network error in CheckInButton component
2. Revert optimistic UI updates (button state, count)
3. Display user-friendly error alert: "Unable to check in. Please check your connection and try again."
4. Log error for debugging: `console.error('Check-in network error:', error)`

### Authentication Errors

**Scenario:** User's session expires during check-in attempt.

**Handling:**
1. Detect 401/403 response from Supabase
2. Display alert: "Your session has expired. Please log in again."
3. Clear local auth state
4. Redirect to login screen (handled by AuthContext)

### Validation Errors

**Scenario:** Venue data is missing required fields (id, name).

**Handling:**
1. Check for required fields before rendering CheckInButton
2. If missing, disable button or hide it entirely
3. Log warning: `console.warn('Venue missing required fields:', venue)`

### Concurrent Check-In Errors

**Scenario:** User attempts to check in while already checked in elsewhere.

**Handling:**
1. CheckInModal displays warning with current venue name
2. User can confirm to check out from previous venue and check in to new one
3. Backend handles atomic checkout + check-in transaction
4. If transaction fails, display error and maintain previous state

### Timeout Errors

**Scenario:** Check-in request takes longer than expected.

**Handling:**
1. Set timeout of 10 seconds for check-in requests
2. If timeout occurs, display alert: "Request timed out. Please try again."
3. Revert UI state
4. Allow user to retry

## Testing Strategy

### Unit Tests

**Test Suite:** `TestVenueCard.test.tsx`

1. **Renders CheckInButton when user is authenticated**
   - Given: User is logged in
   - When: TestVenueCard renders
   - Then: CheckInButton is visible

2. **Does not render CheckInButton when user is not authenticated**
   - Given: User is not logged in
   - When: TestVenueCard renders
   - Then: CheckInButton is not visible

3. **Passes correct props to CheckInButton**
   - Given: Venue with check-in data
   - When: TestVenueCard renders
   - Then: CheckInButton receives correct venueId, name, isCheckedIn, etc.

4. **Calls onCheckInChange when check-in state changes**
   - Given: CheckInButton is rendered
   - When: User checks in successfully
   - Then: onCheckInChange callback is called with correct parameters

**Test Suite:** `HomeScreen.test.tsx`

1. **Fetches user's current check-in on mount**
   - Given: User is authenticated
   - When: HomeScreen mounts
   - Then: CheckInService.getUserCurrentCheckInWithVenue is called

2. **Updates venue card states when check-in data loads**
   - Given: User has active check-in
   - When: Check-in data loads
   - Then: Corresponding venue card shows "Checked In" state

3. **Handles check-in state updates from cards**
   - Given: User checks in from a card
   - When: onCheckInChange is called
   - Then: Local state updates and UI reflects new state

4. **Refetches check-in stats after check-in action**
   - Given: User successfully checks in
   - When: Check-in completes
   - Then: useCheckInStats refetch is called

### Property-Based Tests

**Test Suite:** `CheckInButton.property.test.tsx`

Each property test should run a minimum of 100 iterations with randomized inputs.

**Property Test 1: Single active check-in**
- **Property 5: Single active check-in constraint**
- **Validates: Requirements 2.3, 6.3**
- Generate: Random user ID, random list of venues
- Action: Check in to multiple venues sequentially
- Assert: At any point, user has at most 1 active check-in

**Property Test 2: Count consistency**
- **Property 2: Count increment on check-in**
- **Property 3: Count decrement on checkout**
- **Validates: Requirements 3.1, 3.2**
- Generate: Random venue, random initial count
- Action: Perform check-in then checkout
- Assert: Final count equals initial count

**Property Test 3: State synchronization**
- **Property 4: Button state reflects check-in status**
- **Validates: Requirements 3.3**
- Generate: Random check-in state changes
- Action: Trigger state changes
- Assert: Button visual state matches actual state within 100ms

**Property Test 4: Authentication enforcement**
- **Property 6: Authentication requirement**
- **Validates: Requirements 5.1, 5.2**
- Generate: Random venues, mix of authenticated/non-authenticated users
- Action: Attempt check-in
- Assert: Non-authenticated attempts show login prompt, no check-in created

**Property Test 5: Loading state protection**
- **Property 7: Loading state prevents duplicate actions**
- **Validates: Requirements 4.2**
- Generate: Random rapid tap sequences
- Action: Simulate multiple taps during loading
- Assert: Only one check-in request is made

**Property Test 6: Error rollback**
- **Property 8: Error state rollback**
- **Validates: Requirements 8.1, 8.2**
- Generate: Random initial states, random error types
- Action: Trigger check-in with forced error
- Assert: State reverts to pre-attempt values

### Integration Tests

1. **End-to-end check-in flow from HomeScreen**
   - Navigate to HomeScreen
   - Tap check-in button on a venue card
   - Confirm in modal
   - Verify button state updates
   - Verify count increments
   - Verify database record created

2. **Check-in with existing check-in at different venue**
   - Check in to Venue A
   - Navigate to HomeScreen
   - Check in to Venue B
   - Verify modal shows warning
   - Confirm check-in
   - Verify Venue A shows "Check In" state
   - Verify Venue B shows "Checked In" state

3. **Network error handling**
   - Disable network
   - Attempt check-in
   - Verify error message displays
   - Verify state reverts
   - Enable network
   - Retry check-in
   - Verify success

### Manual Testing Checklist

- [ ] Check-in button appears on all venue cards
- [ ] Button shows correct state for user's current check-in
- [ ] Tapping button opens modal
- [ ] Modal shows warning when checking in elsewhere
- [ ] Successful check-in updates button and count
- [ ] Checkout updates button and count
- [ ] Non-authenticated users see login prompt
- [ ] Loading state prevents duplicate taps
- [ ] Error messages display correctly
- [ ] Button styling matches design system
- [ ] Touch target is adequate (44x44 points minimum)
- [ ] Works in both light and dark themes
- [ ] Animations are smooth
- [ ] No layout shifts when button state changes
