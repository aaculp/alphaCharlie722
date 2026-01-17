# Installation Complete - Supabase CLI & Deno

## ✅ Successfully Installed

### Supabase CLI
- **Version**: 2.72.7
- **Installed via**: Scoop package manager
- **Location**: `~\scoop\apps\supabase\current`
- **Verification**: `supabase --version` ✅

### Deno Runtime
- **Version**: 2.6.5 (stable)
- **TypeScript**: 5.9.2
- **V8**: 14.2.231.17-rusty
- **Installed via**: Scoop package manager
- **Location**: `~\scoop\apps\deno\current`
- **Verification**: `deno --version` ✅

### Scoop Package Manager
- **Newly installed**: Yes
- **Location**: `~\scoop`
- **Purpose**: Windows package manager for developer tools

## ⚠️ Missing Requirement: Docker

### Why Docker is Needed

Supabase CLI uses Docker to run a local development environment that includes:
- PostgreSQL database
- PostgREST API server
- GoTrue authentication server
- Realtime server
- Storage server
- Edge Functions runtime (Deno)

### Docker Installation Options

#### Option 1: Docker Desktop (Recommended for Windows)

**Download**: https://www.docker.com/products/docker-desktop/

**Installation Steps**:
1. Download Docker Desktop for Windows
2. Run the installer
3. Enable WSL 2 backend (recommended)
4. Restart your computer
5. Start Docker Desktop
6. Verify: `docker --version`

**System Requirements**:
- Windows 10 64-bit: Pro, Enterprise, or Education (Build 19041 or higher)
- OR Windows 11 64-bit: Home or Pro version 21H2 or higher
- WSL 2 feature enabled
- 4GB RAM minimum (8GB recommended)

#### Option 2: Alternative Testing Without Docker

If Docker installation is not feasible, you can:

1. **Run Unit Tests Only** (No Docker Required)
   ```bash
   cd supabase/functions/send-flash-offer-push
   deno test --allow-env --allow-net index.test.ts
   deno test --allow-env --allow-net firebase.test.ts
   deno test --allow-env --allow-net fcm.test.ts
   deno test --allow-env --allow-net payload.test.ts
   deno test --allow-env --allow-net analytics.test.ts
   deno test --allow-env --allow-net security.test.ts
   ```

2. **Deploy Directly to Supabase Cloud** (Skip Local Testing)
   - Link to your Supabase project
   - Deploy Edge Function to staging/production
   - Test against real Supabase instance

3. **Use Supabase Hosted Platform** (No Local Setup)
   - Test directly in Supabase Dashboard
   - Use Supabase Studio for database operations
   - Monitor logs in Supabase Dashboard

## 🧪 What You Can Do Now (Without Docker)

### 1. Run Unit Tests

All unit tests can run without Docker:

```bash
# Navigate to Edge Function directory
cd supabase/functions/send-flash-offer-push

# Run all tests
deno test --allow-env --allow-net

# Run specific test file
deno test --allow-env --allow-net index.test.ts

# Run with verbose output
deno test --allow-env --allow-net --trace-ops
```

### 2. Validate Code Syntax

```bash
# Check TypeScript syntax
deno check index.ts

# Format code
deno fmt

# Lint code
deno lint
```

### 3. Test Individual Functions

You can create standalone test scripts to test individual functions:

```typescript
// test-payload.ts
import { buildNotificationPayload } from './payload.ts';

const testOffer = {
  id: 'test-123',
  title: 'Test Offer',
  description: 'Test Description',
  discount_percentage: 20,
};

const payload = buildNotificationPayload(testOffer, 'Test Venue');
console.log(JSON.stringify(payload, null, 2));
```

Run with: `deno run --allow-env test-payload.ts`

### 4. Prepare for Cloud Deployment

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy Edge Function (when ready)
supabase functions deploy send-flash-offer-push
```

## 📋 Next Steps

### If Installing Docker:

1. **Install Docker Desktop**
   - Download from https://www.docker.com/products/docker-desktop/
   - Follow installation wizard
   - Restart computer
   - Start Docker Desktop

2. **Initialize Supabase**
   ```bash
   # Start local Supabase
   supabase start
   
   # This will download and start all containers
   # First run takes 5-10 minutes
   ```

3. **Deploy Edge Function Locally**
   ```bash
   supabase functions deploy send-flash-offer-push --no-verify-jwt
   ```

4. **Run Integration Tests**
   ```bash
   cd supabase/functions
   ./test-function.sh local <jwt_token> <offer_id>
   ```

5. **Follow CHECKPOINT_TESTING.md**
   - Execute all 10 test scenarios
   - Verify logs and responses
   - Validate database state

### If Skipping Docker (Alternative Path):

1. **Run All Unit Tests**
   ```bash
   cd supabase/functions/send-flash-offer-push
   deno test --allow-env --allow-net
   ```

2. **Validate Code Quality**
   ```bash
   deno check index.ts
   deno fmt --check
   deno lint
   ```

3. **Deploy to Supabase Cloud**
   ```bash
   # Login
   supabase login
   
   # Link project
   supabase link --project-ref your-project-ref
   
   # Set secrets
   supabase secrets set FIREBASE_SERVICE_ACCOUNT='...'
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY='...'
   supabase secrets set SUPABASE_URL='https://your-project.supabase.co'
   
   # Deploy
   supabase functions deploy send-flash-offer-push
   ```

4. **Test in Production**
   ```bash
   # Test with dry-run
   curl -X POST https://your-project.supabase.co/functions/v1/send-flash-offer-push \
     -H "Authorization: Bearer YOUR_JWT" \
     -H "Content-Type: application/json" \
     -d '{"offerId": "test-id", "dryRun": true}'
   ```

## 🎯 Recommended Path

### For Development & Testing:
**Install Docker** → Full local testing capability

### For Quick Validation:
**Run Unit Tests** → Deploy to Cloud → Test in staging

### For Production Deployment:
**Skip Local Testing** → Deploy directly → Monitor closely

## 📚 Resources

- **Supabase CLI Docs**: https://supabase.com/docs/guides/cli
- **Deno Manual**: https://deno.land/manual
- **Docker Desktop**: https://docs.docker.com/desktop/
- **Edge Functions Guide**: https://supabase.com/docs/guides/functions

## ✅ Current Status Summary

| Tool | Status | Version | Notes |
|------|--------|---------|-------|
| Supabase CLI | ✅ Installed | 2.72.7 | Ready to use |
| Deno | ✅ Installed | 2.6.5 | Ready to use |
| Docker | ❌ Not Installed | - | Required for local Supabase |
| Scoop | ✅ Installed | Latest | Package manager |

## 🚀 Quick Start (Without Docker)

```bash
# 1. Run unit tests
cd supabase/functions/send-flash-offer-push
deno test --allow-env --allow-net

# 2. Validate code
deno check index.ts
deno fmt --check
deno lint

# 3. Run validation script
cd ../../..
node supabase/functions/send-flash-offer-push/validate-checkpoint.js

# 4. When ready, deploy to cloud
supabase login
supabase link --project-ref your-project-ref
supabase functions deploy send-flash-offer-push
```

## 💡 Decision Point

**Do you want to:**

A. **Install Docker** for full local testing?
   - Pros: Complete local development environment
   - Cons: Large download (~500MB), requires system resources
   - Time: 15-30 minutes

B. **Skip Docker** and use alternative testing?
   - Pros: Faster, lighter weight
   - Cons: No local integration testing
   - Time: 5 minutes (run unit tests)

C. **Deploy directly to cloud** for testing?
   - Pros: Test in real environment
   - Cons: Uses production/staging resources
   - Time: 10 minutes (setup + deploy)

Let me know which path you'd like to take!
