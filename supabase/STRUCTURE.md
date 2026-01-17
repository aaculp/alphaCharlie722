# Supabase Edge Function Project Structure

This document describes the structure of the Supabase Edge Function project for flash offer push notifications.

## Directory Structure

```
supabase/
├── config.toml                                 # Supabase project configuration
├── QUICKSTART.md                               # Quick start guide for developers
├── STRUCTURE.md                                # This file - project structure documentation
└── functions/
    ├── .gitignore                              # Git ignore for sensitive files
    ├── deno.json                               # Deno TypeScript configuration
    ├── import_map.json                         # Deno dependency imports
    ├── README.md                               # Comprehensive documentation
    ├── deploy.sh                               # Deployment script (local/production)
    ├── test-function.sh                        # Testing script
    └── send-flash-offer-push/
        ├── index.ts                            # Main Edge Function handler
        ├── types.ts                            # TypeScript type definitions
        └── package.json                        # Dependency documentation
```

## File Descriptions

### Root Level

#### `config.toml`
Supabase project configuration file used by the Supabase CLI for local development. Configures:
- API server settings
- Database settings
- Studio UI settings
- Edge Functions settings
- Authentication settings

#### `QUICKSTART.md`
Step-by-step guide for developers to:
- Install prerequisites
- Set up local development environment
- Deploy Edge Functions
- Test the implementation
- Troubleshoot common issues

#### `STRUCTURE.md`
This file - documents the project structure and purpose of each file.

### Functions Directory

#### `.gitignore`
Prevents committing sensitive files:
- Environment files (`.env`, `.env.local`)
- Deno cache
- IDE configuration
- OS-specific files

#### `deno.json`
Deno runtime configuration:
- TypeScript compiler options
- Import map reference
- Strict type checking enabled

#### `import_map.json`
Maps package names to URLs for Deno imports:
- `firebase-admin` → npm package
- `@supabase/supabase-js` → ESM package

#### `README.md`
Comprehensive documentation covering:
- Prerequisites and setup
- Local development workflow
- Production deployment process
- API reference
- Error codes
- Monitoring and troubleshooting

#### `deploy.sh`
Bash script for deploying Edge Functions:
- Supports local and production environments
- Validates required secrets before production deployment
- Provides clear success/error messages

#### `test-function.sh`
Bash script for testing the Edge Function:
- Tests with dry-run mode
- Tests with actual execution
- Supports local and production environments
- Validates responses

### send-flash-offer-push Directory

#### `index.ts`
Main Edge Function handler implementing:
- Environment variable validation
- CORS handling
- JWT authentication
- Request parsing and validation
- Supabase client initialization
- Error handling with proper status codes
- Placeholder for push notification logic (to be implemented in subsequent tasks)

**Current Features:**
- ✅ Environment variable validation
- ✅ JWT token extraction and validation
- ✅ Request body parsing
- ✅ Supabase service role client initialization
- ✅ User authentication via JWT
- ✅ Comprehensive error handling
- ✅ CORS support
- ⏳ Push notification logic (pending - Tasks 3-14)

#### `types.ts`
TypeScript type definitions for:
- Request/Response interfaces
- Database models (FlashOffer, Venue, DeviceToken, etc.)
- FCM payload structures
- Error codes
- Environment variables

**Benefits:**
- Type safety across the Edge Function
- Clear API contracts
- Better IDE autocomplete
- Easier refactoring

#### `package.json`
Documents dependencies and provides npm scripts:
- Dependency versions (for reference)
- Deployment scripts
- Log viewing scripts

**Note:** Deno doesn't use npm, but this file serves as documentation.

## Environment Variables

The Edge Function requires three environment variables:

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service account JSON | Firebase Console → Project Settings → Service Accounts |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key | Supabase Dashboard → Project Settings → API |
| `SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Project Settings → API |

### Setting Environment Variables

**Local Development:**
Create `.env.local` in `supabase/functions/send-flash-offer-push/`

**Production:**
```bash
supabase secrets set VARIABLE_NAME='value'
```

## API Endpoints

### POST /functions/v1/send-flash-offer-push

**Purpose:** Send push notifications for a flash offer

**Authentication:** Required (Supabase JWT)

**Request:**
```json
{
  "offerId": "uuid",
  "dryRun": false
}
```

**Response (Success):**
```json
{
  "success": true,
  "targetedUserCount": 100,
  "sentCount": 95,
  "failedCount": 5,
  "errors": [...]
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Implementation Status

### ✅ Completed (Task 2)

- [x] Edge Function project structure
- [x] TypeScript configuration
- [x] Environment variable loading
- [x] Main handler skeleton
- [x] JWT authentication framework
- [x] Error handling framework
- [x] Documentation
- [x] Deployment scripts
- [x] Testing scripts

### ⏳ Pending (Tasks 3-27)

- [ ] JWT authentication middleware (Task 3)
- [ ] Firebase Admin SDK initialization (Task 4)
- [ ] Database query functions (Task 5)
- [ ] User preference filtering (Task 6)
- [ ] Rate limiting logic (Task 7)
- [ ] FCM notification payload builder (Task 8)
- [ ] FCM batch sending logic (Task 9)
- [ ] Main handler implementation (Task 10)
- [ ] Analytics tracking (Task 11)
- [ ] Dry-run mode (Task 12)
- [ ] Comprehensive error handling (Task 13)
- [ ] Security measures (Task 14)
- [ ] Client integration (Tasks 16-17)
- [ ] User preferences (Tasks 18-20)
- [ ] UI updates (Tasks 21-22)
- [ ] Deployment (Tasks 23-27)

## Next Steps

1. Review the created structure
2. Test local deployment:
   ```bash
   supabase start
   cd supabase/functions
   ./deploy.sh local
   ```
3. Proceed to Task 3: Implement JWT authentication middleware
4. Continue with remaining tasks in the implementation plan

## Resources

- **Task List:** `.kiro/specs/flash-offer-push-backend/tasks.md`
- **Design Document:** `.kiro/specs/flash-offer-push-backend/design.md`
- **Requirements:** `.kiro/specs/flash-offer-push-backend/requirements.md`
- **Supabase Docs:** https://supabase.com/docs/guides/functions
- **Deno Docs:** https://deno.land/manual
- **Firebase Admin SDK:** https://firebase.google.com/docs/admin/setup
