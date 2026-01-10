# User Type Routing System

## Overview
Implemented a comprehensive user type detection and routing system that automatically directs users to different UIs based on whether they are regular customers or venue owners.

## Architecture

### 1. Enhanced AuthContext
**File**: `src/contexts/AuthContext.tsx`

**New Features:**
- `userType`: 'customer' | 'venue_owner' | null
- `venueBusinessAccount`: Venue business account data for venue owners
- `refreshUserType()`: Function to manually refresh user type detection
- Automatic user type detection on login/session initialization

**User Type Detection Logic:**
```typescript
const determineUserType = async (userId: string) => {
  const businessAccount = await VenueBusinessService.getBusinessAccount(userId);
  
  if (businessAccount) {
    setUserType('venue_owner');
    setVenueBusinessAccount(businessAccount);
  } else {
    setUserType('customer');
    setVenueBusinessAccount(null);
  }
};
```

### 2. Dual Navigation System
**Files**: 
- `src/navigation/AppNavigator.tsx` (Updated)
- `src/navigation/VenueNavigator.tsx` (New)

**Customer Navigation** (Existing):
- Home (Feed)
- Quick Picks  
- Search
- Settings

**Venue Owner Navigation** (New):
- Dashboard
- Profile
- Analytics
- Settings

### 3. Venue Owner Screens
**Created 4 new screens:**

#### VenueDashboardScreen
- Welcome message with venue name
- Venue status (Active/Pending)
- Subscription tier display
- Quick stats (Check-ins, Favorites, Views, Rating)
- Quick actions (Edit Profile, Update Hours, Manage Photos, Send Notification)
- Recent activity section
- Sign out functionality

#### VenueProfileScreen (Placeholder)
- Coming soon message
- Will handle venue information management

#### VenueAnalyticsScreen (Placeholder)
- Coming soon message  
- Will show performance metrics and insights

#### VenueSettingsScreen (Placeholder)
- Coming soon message
- Will handle account and subscription management

## Routing Logic

### AppNavigator Decision Tree
```typescript
if (!session) {
  return <AuthScreen />; // Not logged in
}

if (userType === 'venue_owner') {
  return <VenueNavigator />; // Venue dashboard
} else {
  return <MainTabNavigator />; // Customer app
}
```

### User Type Detection Flow
1. **Login/Session Init** → Check for venue business account
2. **Business Account Found** → Route to VenueNavigator
3. **No Business Account** → Route to MainTabNavigator (customer app)
4. **Manual Refresh** → `refreshUserType()` can be called to re-check

## Database Integration

### VenueBusinessService Integration
- Uses existing `VenueBusinessService.getBusinessAccount(userId)`
- Checks if user has an approved venue business account
- Loads venue information and subscription details

### Venue Business Account Structure
```typescript
{
  id: string;
  venue_id: string;
  owner_user_id: string;
  subscription_tier: 'free' | 'core' | 'pro' | 'revenue';
  account_status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
  venues: {
    name: string;
    // ... other venue details
  }
}
```

## User Experience

### For Regular Customers
- **No Change**: Existing app experience remains identical
- Same navigation, screens, and functionality

### For Venue Owners
- **Automatic Detection**: Seamlessly routed to venue dashboard on login
- **Professional Interface**: Business-focused UI with relevant metrics
- **Quick Actions**: Easy access to common venue management tasks
- **Status Visibility**: Clear indication of venue and subscription status

## Benefits

1. **Seamless Experience**: Users automatically see the appropriate interface
2. **No Manual Selection**: System intelligently detects user type
3. **Scalable Architecture**: Easy to add more user types in the future
4. **Consistent Navigation**: Both UIs use the same navigation patterns
5. **Professional Appearance**: Venue owners get a business-focused dashboard

## Future Enhancements

1. **Role-Based Permissions**: Different access levels for venue staff
2. **Multi-Venue Support**: Venue owners with multiple locations
3. **Admin Interface**: Super admin panel for managing all venues
4. **Hybrid Users**: Users who are both customers and venue owners

## Testing Scenarios

1. **Regular Customer Login**: Should see normal app interface
2. **Venue Owner Login**: Should see venue dashboard
3. **New Venue Application**: User type should update after approval
4. **Account Switching**: Support for users with multiple roles
5. **Session Persistence**: User type should persist across app restarts

The system is now ready to differentiate between customer and venue owner experiences, providing each user type with an appropriate and tailored interface.