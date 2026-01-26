# Timezone Change Detection Hook - Usage Guide

## Overview

The `useTimezoneChangeDetection` hook detects when a user's device timezone changes and prompts them to update their notification preferences. This ensures quiet hours continue to work correctly when users travel or change their timezone settings.

## Features

- ✅ Detects timezone changes on app foreground
- ✅ Respects 7-day cooldown to prevent prompt fatigue
- ✅ Provides modal state and accept/decline handlers
- ✅ Non-blocking operation
- ✅ Graceful error handling

## Basic Usage

### 1. Import the Hook

```typescript
import { useTimezoneChangeDetection } from './src/hooks/useTimezoneChangeDetection';
```

### 2. Use in Your App Component

```typescript
function App() {
  const { state, handlers } = useTimezoneChangeDetection();

  return (
    <>
      <AppContent />
      
      {/* Render modal when timezone change is detected */}
      <TimezoneChangeModal
        visible={state.showPrompt}
        oldTimezone={state.oldTimezone}
        newTimezone={state.newTimezone}
        onAccept={handlers.handleAccept}
        onDecline={handlers.handleDecline}
      />
    </>
  );
}
```

### 3. Integration in App.tsx

Add the hook to your main App component alongside the existing `useTimezoneMigration` hook:

```typescript
function AppContent() {
  const { isLoading, theme, isDark } = useTheme();
  
  // Existing timezone migration hook
  useTimezoneMigration();
  
  // NEW: Timezone change detection hook
  const { state, handlers } = useTimezoneChangeDetection();

  return (
    <NavigationContainer>
      <AppNavigator />
      
      {/* Add timezone change modal */}
      <TimezoneChangeModal
        visible={state.showPrompt}
        oldTimezone={state.oldTimezone}
        newTimezone={state.newTimezone}
        onAccept={handlers.handleAccept}
        onDecline={handlers.handleDecline}
      />
    </NavigationContainer>
  );
}
```

## Hook API

### Return Value

The hook returns an object with two properties:

#### `state: TimezoneChangeState`

```typescript
interface TimezoneChangeState {
  showPrompt: boolean;      // Whether to show the timezone change prompt
  oldTimezone: string;       // The old timezone stored in preferences
  newTimezone: string;       // The new timezone detected on device
  isChecking: boolean;       // Whether currently checking for changes
}
```

#### `handlers: TimezoneChangeHandlers`

```typescript
interface TimezoneChangeHandlers {
  handleAccept: () => Promise<void>;   // Accept timezone change
  handleDecline: () => Promise<void>;  // Decline timezone change
}
```

## Behavior

### When Does It Check?

The hook checks for timezone changes:
1. When the app first loads (if user is authenticated)
2. When the app comes to foreground (AppState becomes 'active')

### When Does It Show the Prompt?

The prompt is shown when ALL of these conditions are met:
1. User is authenticated
2. Device timezone differs from stored timezone
3. Either:
   - No previous check has been made (`last_timezone_check` is null), OR
   - Last check was more than 7 days ago

### Cooldown Period

After a user declines the timezone change, the hook:
- Updates `last_timezone_check` timestamp
- Won't prompt again for 7 days
- This prevents prompt fatigue for users who intentionally keep different timezones

### Session-Based Checking

The hook only checks once per app session to avoid:
- Duplicate prompts
- Unnecessary API calls
- Performance impact

## Example Modal Component

Here's a basic example of a timezone change modal:

```typescript
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface TimezoneChangeModalProps {
  visible: boolean;
  oldTimezone: string;
  newTimezone: string;
  onAccept: () => void;
  onDecline: () => void;
}

export function TimezoneChangeModal({
  visible,
  oldTimezone,
  newTimezone,
  onAccept,
  onDecline,
}: TimezoneChangeModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDecline}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Timezone Changed</Text>
          
          <Text style={styles.message}>
            We detected your timezone has changed:
          </Text>
          
          <View style={styles.timezones}>
            <Text style={styles.timezone}>
              From: {oldTimezone}
            </Text>
            <Text style={styles.timezone}>
              To: {newTimezone}
            </Text>
          </View>
          
          <Text style={styles.question}>
            Would you like to update your notification preferences?
          </Text>
          
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.declineButton]}
              onPress={onDecline}
            >
              <Text style={styles.declineText}>Keep Current</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={onAccept}
            >
              <Text style={styles.acceptText}>Update</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  timezones: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  timezone: {
    fontSize: 14,
    marginVertical: 4,
  },
  question: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: '#f0f0f0',
  },
  acceptButton: {
    backgroundColor: '#007AFF',
  },
  declineText: {
    color: '#333',
    fontWeight: '600',
  },
  acceptText: {
    color: 'white',
    fontWeight: '600',
  },
});
```

## Error Handling

The hook handles errors gracefully:

- **Network errors**: Logged but don't crash the app
- **Database errors**: Logged but don't crash the app
- **Detection errors**: Falls back to not showing prompt
- **Update errors**: Prompt is hidden, user can try again from settings

All errors are logged with context for debugging:

```typescript
console.error('❌ Error checking timezone change:', {
  userId: user.id,
  error: error.message,
  stack: error.stack,
});
```

## Testing

The hook includes comprehensive unit tests covering:

- ✅ Timezone change detection on foreground
- ✅ Cooldown period enforcement
- ✅ Accept/decline handlers
- ✅ Session-based checking
- ✅ Error handling
- ✅ AppState listener cleanup
- ✅ Unauthenticated user handling

Run tests with:

```bash
npm test -- src/hooks/__tests__/useTimezoneChangeDetection.test.tsx
```

## Requirements Validation

This hook validates the following requirements:

- **5.1**: Detects timezone on app foreground
- **5.2**: Compares with stored timezone
- **5.3**: Shows old and new timezone
- **5.4**: Provides accept/decline handlers
- **5.5**: Updates preferences on accept
- **5.6**: Respects 7-day cooldown
- **5.7**: Updates last_timezone_check timestamp

## Related Files

- Hook: `src/hooks/useTimezoneChangeDetection.ts`
- Tests: `src/hooks/__tests__/useTimezoneChangeDetection.test.tsx`
- Service: `src/services/api/notificationPreferences.ts`
- Utility: `src/utils/timezone.ts`
- Migration Hook: `src/hooks/useTimezoneMigration.ts`

## Next Steps

After implementing this hook, you'll need to:

1. Create the `TimezoneChangeModal` component (Task 11)
2. Integrate both the hook and modal in `App.tsx` (Task 12)
3. Test the complete flow with timezone changes
4. Update settings screen to show device timezone (Tasks 13-15)
