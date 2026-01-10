# Demo Mode Instructions

## Current State: Venue Dashboard Demo Mode

The app is currently set to **always show the venue dashboard** for testing purposes, bypassing the normal authentication and user type detection.

## What's Changed

### 1. AppNavigator.tsx
- **Temporarily bypassed** all authentication logic
- **Always returns** `<VenueNavigator />` regardless of login state
- **Original logic is commented out** and ready to restore

### 2. VenueDashboardScreen.tsx
- **Updated** to show "Demo Venue" when no venue data is available
- **Modified** sign out button to show demo message instead of actually signing out
- **Shows** "Demo Mode - Active" status

## How to Test

1. **Start the app** - You'll see the venue dashboard immediately
2. **Navigate between tabs** - Dashboard, Profile, Analytics, Settings
3. **Try interactions** - Sign out button, quick action buttons
4. **Test theming** - Dark/light mode should work
5. **Test navigation styles** - Floating vs regular tab bar

## How to Restore Normal Behavior

### Step 1: Restore AppNavigator.tsx
In `src/navigation/AppNavigator.tsx`, replace the temporary code:

```typescript
// REMOVE THIS:
console.log('🏢 TEMPORARY: Always showing Venue Dashboard for testing');
return <VenueNavigator />;

// UNCOMMENT THIS:
const shouldShowMainApp = !!session;
// ... rest of the original logic
```

### Step 2: Restore VenueDashboardScreen.tsx
In `src/screens/VenueDashboardScreen.tsx`:

1. **Change venue name back:**
   ```typescript
   {venueBusinessAccount?.venues?.name || 'Your Venue'}
   ```

2. **Restore status text:**
   ```typescript
   {venueBusinessAccount?.account_status === 'active' 
     ? '✅ Active and visible to customers'
     : '⏳ Pending verification'
   }
   ```

3. **Restore sign out function:**
   ```typescript
   // Uncomment the original Alert.alert logic
   // Remove the demo mode alert
   ```

## What You Should See

### Current Demo Mode:
- ✅ Venue dashboard loads immediately
- ✅ All 4 tabs work (Dashboard, Profile, Analytics, Settings)
- ✅ Professional business interface
- ✅ Demo data and placeholder content
- ✅ Themed properly (dark/light mode)
- ✅ Floating/regular navigation works

### After Restoring:
- 🔄 Normal login flow
- 🔄 User type detection
- 🔄 Automatic routing based on account type
- 🔄 Real venue data for venue owners
- 🔄 Customer app for regular users

## Testing Checklist

- [ ] Dashboard screen loads and displays properly
- [ ] All 4 tabs are accessible and functional
- [ ] Theme switching works (Settings → Experimental Features)
- [ ] Navigation style switching works (floating vs regular)
- [ ] Quick action buttons are tappable (even if they don't do anything yet)
- [ ] Stats cards display properly
- [ ] Sign out button shows demo message
- [ ] Interface looks professional and polished

The venue dashboard is now ready for development and testing!