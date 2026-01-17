# Supabase Edge Function Quick Start Guide

This guide will help you get the flash offer push notification Edge Function up and running.

## Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v20 or higher) - Already installed based on your project
2. **Supabase CLI** - Install globally:
   ```bash
   npm install -g supabase
   ```
3. **Firebase Project** - With Cloud Messaging enabled
4. **Supabase Project** - With database set up

## Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

Verify installation:
```bash
supabase --version
```

## Step 2: Initialize Supabase (if not already done)

If this is your first time setting up Supabase locally:

```bash
supabase init
```

This will create a `supabase` directory with configuration files.

## Step 3: Start Local Supabase

```bash
supabase start
```

This will start:
- PostgreSQL database (port 54322)
- API server (port 54321)
- Studio UI (port 54323)
- Edge Functions runtime

**Note:** First start may take a few minutes to download Docker images.

## Step 4: Configure Environment Variables

### For Local Development

Create a `.env.local` file in `supabase/functions/send-flash-offer-push/`:

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project",...}
SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key
SUPABASE_URL=http://localhost:54321
```

Get your local service role key from:
```bash
supabase status
```

Look for the `service_role key` in the output.

### For Production

Set secrets using Supabase CLI:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Set secrets
supabase secrets set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
supabase secrets set SUPABASE_SERVICE_ROLE_KEY='your_service_role_key'
supabase secrets set SUPABASE_URL='https://your-project.supabase.co'
```

## Step 5: Deploy the Edge Function

### Local Deployment

```bash
cd supabase/functions
./deploy.sh local
```

Or manually:
```bash
supabase functions deploy send-flash-offer-push --no-verify-jwt
```

### Production Deployment

```bash
cd supabase/functions
./deploy.sh production
```

Or manually:
```bash
supabase functions deploy send-flash-offer-push
```

## Step 6: Test the Edge Function

### Get a Test JWT Token

You'll need a valid Supabase JWT token from your app. You can get one by:

1. Login to your app
2. Extract the JWT from the Supabase client session
3. Or use Supabase Studio to generate a test token

### Run the Test Script

```bash
cd supabase/functions
./test-function.sh local YOUR_JWT_TOKEN test-offer-id
```

### Manual Test with curl

```bash
curl -X POST http://localhost:54321/functions/v1/send-flash-offer-push \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"offerId": "test-offer-id", "dryRun": true}'
```

Expected response:
```json
{
  "success": true,
  "targetedUserCount": 0,
  "sentCount": 0,
  "failedCount": 0,
  "errors": [],
  "message": "Edge Function skeleton - implementation pending"
}
```

## Step 7: View Logs

### Real-time Logs

```bash
supabase functions logs send-flash-offer-push --tail
```

### Recent Logs

```bash
supabase functions logs send-flash-offer-push --limit 100
```

## Common Issues

### Issue: "Command not found: supabase"

**Solution:** Install Supabase CLI globally:
```bash
npm install -g supabase
```

### Issue: "Docker is not running"

**Solution:** Start Docker Desktop or Docker daemon before running `supabase start`.

### Issue: "Port already in use"

**Solution:** Stop other services using ports 54321-54326, or stop Supabase and restart:
```bash
supabase stop
supabase start
```

### Issue: "Missing environment variables"

**Solution:** Ensure all required secrets are set:
```bash
supabase secrets list
```

### Issue: "JWT authentication fails"

**Solution:** 
- Verify you're using a valid JWT token from your Supabase client
- Check that the token hasn't expired
- Ensure the token is from the correct Supabase project

## Next Steps

After setting up the Edge Function structure:

1. ✅ **Task 2 Complete** - Edge Function project structure created
2. ⏭️ **Task 3** - Implement JWT authentication middleware
3. ⏭️ **Task 4** - Implement Firebase Admin SDK initialization
4. ⏭️ **Task 5** - Implement database query functions
5. Continue with remaining tasks in `.kiro/specs/flash-offer-push-backend/tasks.md`

## Useful Commands

```bash
# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# Check status
supabase status

# Deploy function locally
supabase functions deploy send-flash-offer-push --no-verify-jwt

# Deploy function to production
supabase functions deploy send-flash-offer-push

# View logs
supabase functions logs send-flash-offer-push --tail

# List secrets
supabase secrets list

# Set a secret
supabase secrets set SECRET_NAME='value'

# Unset a secret
supabase secrets unset SECRET_NAME
```

## Resources

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Deno Documentation](https://deno.land/manual)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Project Tasks](.kiro/specs/flash-offer-push-backend/tasks.md)
- [Design Document](.kiro/specs/flash-offer-push-backend/design.md)
- [Requirements Document](.kiro/specs/flash-offer-push-backend/requirements.md)
