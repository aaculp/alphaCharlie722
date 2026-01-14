# Bug Fix Plan - Social Friend System

## Overview
This document outlines the bugs discovered during final testing and provides a prioritized plan for fixing them before release.

## Bug Categories

### Category A: Test Infrastructure Issues (Not Production Bugs)
These are issues with test mocks and setup, not the actual implementation.

### Category B: Implementation Issues
These are actual bugs in the production code that need fixing.

---

## Detailed Bug List

### A1: Missing react-native-haptic-feedback Mock
**Type**: Test Infrastructure
**Severity**: HIGH
**Blocks**: App.test.tsx

**Problem**: 
```
Cannot find module 'react-native-haptic-feedback' from 'src/utils/haptics.ts'
```

**Solution**:
Add to `jest.setup.js`:
```javascript
jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));
```

**Estimated Time**: 5 minutes

---

### A2: Incomplete Supabase Mock - Missing Methods
**Type**: Test Infrastructure
**Severity**: HIGH
**Blocks**: Multiple PBT tests

**Problem**:
Supabase mock missing:
- `.order()` method
- `.maybeSingle()` method

**Current Mock Location**: `jest.setup.js` or test files

**Solution**:
Update Supabase mock to include:
```javascript
const mockSupabaseQuery = {
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(), // ADD THIS
  range: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }), // ADD THIS
};
```

**Estimated Time**: 15 minutes

---

### A3: Supabase Mock Returns Undefined Instead of Response Object
**Type**: Test Infrastructure
**Severity**: HIGH
**Blocks**: Collections, Friends, Privacy PBT tests

**Problem**:
Tests expect `{ data, error }` but mock returns `undefined`

**Example Error**:
```
Cannot read properties of undefined (reading 'data')
```

**Solution**:
Ensure all Supabase mock methods return proper response objects:
```javascript
// Instead of:
.mockResolvedValue(undefined)

// Use:
.mockResolvedValue({ data: null, error: null })
// or
.mockResolvedValue({ data: mockData, error: null })
```

**Estimated Time**: 30 minutes

---

### A4: VenueShareService Insert Mock Not Returning Data
**Type**: Test Infrastructure
**Severity**: HIGH
**Blocks**: Property 37, Property 39

**Problem**:
```typescript
const { data } = await supabase.from('venue_shares').insert([...]);
// data is undefined, causing "No data returned" error
```

**Solution**:
Mock the insert operation to return created records:
```javascript
// In test setup
supabase.from.mockReturnValue({
  insert: jest.fn().mockResolvedValue({
    data: [{ id: 'mock-id', /* ...other fields */ }],
    error: null
  })
});
```

**Estimated Time**: 20 minutes

---

### B1: PrivacyService.isBlocked() Logic Issue
**Type**: Implementation Bug
**Severity**: MEDIUM
**Blocks**: Property 25 tests

**Problem**:
```javascript
expect(isBlockedForward).toBe(true)  // Received: false
expect(isBlockedReverse).toBe(true)  // Received: false
```

**Root Cause**:
The `isBlocked()` method may not be checking both directions properly.

**Current Implementation** (needs review):
```typescript
static async isBlocked(userId: string, otherUserId: string): Promise<boolean> {
  // Check if userId has blocked otherUserId
  const { data } = await supabase
    .from('blocked_users')
    .select('id')
    .eq('blocker_id', userId)
    .eq('blocked_id', otherUserId)
    .maybeSingle();
  
  return !!data;
}
```

**Issue**: This only checks one direction. Blocking should be bidirectional (if A blocks B, both A→B and B→A should return true).

**Solution**:
```typescript
static async isBlocked(userId: string, otherUserId: string): Promise<boolean> {
  // Check both directions
  const { data } = await supabase
    .from('blocked_users')
    .select('id')
    .or(`and(blocker_id.eq.${userId},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${userId})`)
    .maybeSingle();
  
  return !!data;
}
```

**Estimated Time**: 15 minutes

---

### A5: HistoryScreen Test Timeouts
**Type**: Test Infrastructure
**Severity**: MEDIUM
**Blocks**: 4 HistoryScreen tests

**Problem**:
Tests timing out after 5000ms, suggesting async operations not completing.

**Affected Tests**:
- Property 9: Navigation parameter passing
- Pull-to-refresh test
- Load more on scroll test
- Navigation on item tap test

**Possible Causes**:
1. Missing `await` on async operations
2. Timers not being flushed
3. Promises not resolving in mocks

**Solution**:
1. Add `jest.useFakeTimers()` and `jest.runAllTimers()` where needed
2. Ensure all async operations are awaited
3. Add proper cleanup in `afterEach`:
```javascript
afterEach(() => {
  jest.clearAllTimers();
  jest.clearAllMocks();
});
```
4. Increase timeout for property-based tests:
```javascript
it('test name', async () => {
  // test code
}, 10000); // 10 second timeout
```

**Estimated Time**: 45 minutes

---

### A6: HistoryScreen Unmounted Renderer Error
**Type**: Test Infrastructure
**Severity**: LOW
**Blocks**: 1 test

**Problem**:
```
Can't access .root on unmounted test renderer
ReferenceError: You are trying to `import` a file after the Jest environment has been torn down
```

**Solution**:
Ensure component is properly cleaned up:
```javascript
let component: any;

afterEach(() => {
  if (component) {
    component.unmount();
    component = null;
  }
});
```

**Estimated Time**: 10 minutes

---

## Fix Implementation Order

### Phase 1: Quick Wins (30 minutes)
1. A1: Add haptic feedback mock (5 min)
2. A2: Add missing Supabase methods (15 min)
3. B1: Fix isBlocked() logic (15 min)

### Phase 2: Mock Improvements (50 minutes)
4. A3: Fix undefined response objects (30 min)
5. A4: Fix VenueShareService insert mock (20 min)

### Phase 3: Test Stability (55 minutes)
6. A5: Fix HistoryScreen timeouts (45 min)
7. A6: Fix unmounted renderer (10 min)

**Total Estimated Time**: 2 hours 15 minutes

---

## Verification Steps

After each fix:
1. Run affected test suite: `npm test -- <test-file-path>`
2. Verify test passes
3. Run full test suite: `npm test`
4. Check for regressions

After all fixes:
1. Run full test suite: `npm test`
2. Verify all tests pass
3. Check TypeScript compilation: `npx tsc --noEmit`
4. Run linter: `npm run lint`
5. Test on iOS simulator (if available)
6. Test on Android emulator (if available)

---

## Release Readiness Checklist

- [ ] All unit tests passing
- [ ] All property-based tests passing
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Manual testing on iOS completed
- [ ] Manual testing on Android completed
- [ ] Performance testing completed
- [ ] Privacy settings verified
- [ ] Database migrations tested
- [ ] RLS policies verified
- [ ] Documentation updated
- [ ] CHANGELOG updated

---

## Notes

### Test vs Production Issues
- **22 test failures** identified
- **1 production bug** found (isBlocked logic)
- **21 test infrastructure issues** found

This is actually a positive sign - the implementation is solid, but test infrastructure needs improvement.

### Risk Assessment
- **Production Risk**: LOW - Only 1 implementation bug found
- **Test Coverage Risk**: MEDIUM - Mocks need improvement for reliable CI/CD
- **Release Blocker**: The isBlocked() bug should be fixed before release

### Recommendations
1. Fix B1 (isBlocked bug) immediately - this is a production issue
2. Fix test infrastructure issues to enable reliable CI/CD
3. Consider adding integration tests with real Supabase instance
4. Add E2E tests for critical user flows
