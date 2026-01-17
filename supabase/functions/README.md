# Supabase Edge Functions

This directory contains Supabase Edge Functions for the flash offer push notification system.

## Prerequisites

1. **Supabase CLI**: Install the Supabase CLI
   ```bash
   npm install -g supabase
   ```

2. **Deno**: Edge Functions run on Deno runtime (automatically handled by Supabase CLI)

3. **Firebase Service Account**: 
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Download the JSON file
   - Store the entire JSON content as a Supabase secret

4. **Supabase Service Role Key**:
   - Go to Supabase Dashboard → Project Settings → API
   - Copy the "service_role" key (not the anon key!)

## Local Development

### 1. Start Local Supabase

```bash
supabase start
```

### 2. Set Local Environment Variables

Create a `.env.local` file in the `supabase/functions/send-flash-offer-push/` directory:

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_URL=http://localhost:54321
```

### 3. Deploy Function Locally

```bash
supabase functions deploy send-flash-offer-push --no-verify-jwt
```

### 4. Test Locally

```bash
curl -X POST http://localhost:54321/functions/v1/send-flash-offer-push \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"offerId": "test-offer-id", "dryRun": true}'
```

## Production Deployment

### 1. Login to Supabase

```bash
supabase login
```

### 2. Link Your Project

```bash
supabase link --project-ref your-project-ref
```

### 3. Set Production Secrets

```bash
# Set Firebase service account (entire JSON as string)
supabase secrets set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'

# Set Supabase service role key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY='your_service_role_key'

# Set Supabase URL
supabase secrets set SUPABASE_URL='https://your-project.supabase.co'
```

### 4. Deploy to Production

```bash
supabase functions deploy send-flash-offer-push
```

### 5. Verify Deployment

```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-flash-offer-push \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"offerId": "test-offer-id", "dryRun": true}'
```

## Function Structure

```
supabase/functions/
├── deno.json                          # Deno configuration
├── import_map.json                    # Dependency imports
├── README.md                          # This file
└── send-flash-offer-push/
    └── index.ts                       # Main handler function
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service account JSON | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |

## API Reference

### POST /send-flash-offer-push

Send push notifications for a flash offer.

**Headers:**
- `Authorization: Bearer <jwt_token>` - Supabase JWT token

**Request Body:**
```json
{
  "offerId": "uuid",
  "dryRun": false  // Optional: validate without sending
}
```

**Success Response (200):**
```json
{
  "success": true,
  "targetedUserCount": 100,
  "sentCount": 95,
  "failedCount": 5,
  "errors": [
    {
      "token": "device_token",
      "error": "invalid_token"
    }
  ]
}
```

**Error Response (4xx/5xx):**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Error Codes

- `UNAUTHORIZED` - Missing or invalid JWT token
- `INVALID_REQUEST` - Malformed request body
- `OFFER_NOT_FOUND` - Offer ID doesn't exist
- `VENUE_NOT_FOUND` - Venue doesn't exist
- `RATE_LIMIT_EXCEEDED` - Daily limit reached
- `PUSH_ALREADY_SENT` - Offer already has push_sent = true
- `FIREBASE_INIT_FAILED` - Firebase Admin SDK initialization error
- `DATABASE_ERROR` - Database query failure
- `FCM_QUOTA_EXCEEDED` - Firebase quota limit reached
- `INTERNAL_ERROR` - Unexpected server error

## Monitoring

### View Logs

```bash
# Real-time logs
supabase functions logs send-flash-offer-push --tail

# Recent logs
supabase functions logs send-flash-offer-push --limit 100
```

### Metrics to Monitor

- Invocation count
- Error rate (should be < 5%)
- Execution time (should be < 25s)
- FCM send success rate (should be > 90%)

## Troubleshooting

### Function Returns 500 Error

Check that all environment variables are set:
```bash
supabase secrets list
```

### JWT Authentication Fails

Ensure you're using a valid Supabase JWT token from the client app, not the anon key.

### Firebase Initialization Fails

Verify the Firebase service account JSON is valid and properly formatted.

## Next Steps

After setting up the Edge Function structure:
1. Implement JWT authentication middleware (Task 3)
2. Implement Firebase Admin SDK initialization (Task 4)
3. Implement database query functions (Task 5)
4. Continue with remaining tasks in the implementation plan
