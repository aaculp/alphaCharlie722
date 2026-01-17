# Firebase Admin SDK Initialization

## Overview

This document describes the Firebase Admin SDK initialization implementation for the Flash Offer Push Notification backend.

## Implementation

### Files Created/Modified

1. **firebase.ts** - New module for Firebase initialization
   - `initializeFirebase()` - Initializes Firebase Admin SDK with service account credentials
   - `getFirebaseMessaging()` - Returns Firebase Messaging instance for sending notifications
   - `resetFirebaseInstances()` - Testing utility to reset Firebase state

2. **index.ts** - Updated main Edge Function handler
   - Added Firebase initialization call in main handler
   - Added error handling for Firebase initialization failures
   - Returns `FIREBASE_INIT_FAILED` error code when initialization fails

3. **firebase.test.ts** - New test file for Firebase initialization
   - Tests for missing environment variables
   - Tests for invalid JSON in service account
   - Tests for missing required fields in service account
   - Tests for error message format and security

## Requirements Satisfied

- **Requirement 2.1**: Initialize Firebase_Admin_SDK with service account credentials ✓
- **Requirement 3.1**: Store Firebase service account JSON in Supabase secrets ✓
- **Requirement 3.3**: Load credentials from environment variables ✓

## How It Works

### 1. Loading Credentials

The `parseServiceAccountCredentials()` function:
- Reads `FIREBASE_SERVICE_ACCOUNT` environment variable
- Parses the JSON string into a ServiceAccount object
- Validates that required fields are present (project_id, private_key, client_email)
- Throws descriptive errors if validation fails

### 2. Initialization

The `initializeFirebase()` function:
- Checks if Firebase is already initialized (singleton pattern)
- Loads and validates service account credentials
- Initializes Firebase Admin SDK with the credentials
- Handles errors gracefully with descriptive messages
- Returns the initialized Firebase App instance

### 3. Getting Messaging Instance

The `getFirebaseMessaging()` function:
- Returns cached messaging instance if available
- Initializes Firebase if not already initialized
- Returns Firebase Messaging instance for sending push notifications

### 4. Error Handling

The implementation handles several error scenarios:

- **Missing environment variable**: "Firebase initialization failed: Missing or invalid service account credentials"
- **Invalid JSON**: "FIREBASE_SERVICE_ACCOUNT is not valid JSON"
- **Missing required fields**: "Service account missing required fields: [field names]"
- **Generic errors**: "Firebase initialization failed: [error message]"

All errors are logged to the console for debugging while returning generic error messages to clients.

### 5. Integration with Edge Function

In `index.ts`, Firebase initialization happens early in the request handler:

```typescript
// Initialize Firebase Admin SDK
try {
  initializeFirebase();
} catch (error) {
  console.error('Firebase initialization error:', error);
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Failed to initialize push notification service',
      code: 'FIREBASE_INIT_FAILED',
    }),
    {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
```

This ensures:
- Firebase is initialized before any notification sending
- Initialization errors are caught and returned with appropriate status codes
- Clients receive a generic error message (no credential exposure)
- Detailed errors are logged server-side for debugging

## Testing

### Unit Tests

The `firebase.test.ts` file contains comprehensive unit tests:

- Missing FIREBASE_SERVICE_ACCOUNT environment variable
- Invalid JSON in FIREBASE_SERVICE_ACCOUNT
- Missing required fields (project_id, private_key, client_email)
- Missing multiple required fields
- Empty string for FIREBASE_SERVICE_ACCOUNT
- Error message format validation
- Error message security (no credential exposure)
- getFirebaseMessaging without initialization
- Singleton pattern consistency
- resetFirebaseInstances functionality

### Running Tests

```bash
# Run all tests
deno test --allow-env --allow-net firebase.test.ts

# Run specific test
deno test --allow-env --allow-net firebase.test.ts --filter "Missing FIREBASE_SERVICE_ACCOUNT"
```

## Configuration

### Setting Up Firebase Service Account

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Store the entire JSON as a Supabase secret:

```bash
# Set Firebase service account (entire JSON as string)
supabase secrets set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project",...}'
```

### Required Fields in Service Account

The service account JSON must contain:
- `project_id` - Firebase project ID
- `private_key` - Private key for authentication
- `client_email` - Service account email

Example:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk@your-project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

## Security Considerations

1. **Credential Storage**: Service account credentials are stored in Supabase secrets, not in code
2. **Error Messages**: Error messages returned to clients are generic and don't expose credential details
3. **Logging**: Detailed errors are logged server-side for debugging but not exposed to clients
4. **Validation**: All required fields are validated before attempting initialization

## Next Steps

The Firebase initialization is now complete. Subsequent tasks will:
- Implement database query functions (Task 5)
- Implement FCM notification payload builder (Task 8)
- Implement FCM batch sending logic (Task 9)
- Use `getFirebaseMessaging()` to send actual push notifications

## Troubleshooting

### "FIREBASE_SERVICE_ACCOUNT environment variable is not set"
- Ensure the secret is set in Supabase: `supabase secrets set FIREBASE_SERVICE_ACCOUNT='...'`
- Verify the secret is deployed to the correct environment (local/staging/production)

### "FIREBASE_SERVICE_ACCOUNT is not valid JSON"
- Check that the JSON is properly escaped when setting the secret
- Ensure no extra quotes or characters were added

### "Service account missing required fields"
- Verify the downloaded service account JSON contains all required fields
- Re-download the service account JSON from Firebase Console if needed

### "Failed to initialize push notification service"
- Check Edge Function logs: `supabase functions logs send-flash-offer-push --tail`
- Look for detailed error messages in the logs
- Verify Firebase project is active and service account has necessary permissions
