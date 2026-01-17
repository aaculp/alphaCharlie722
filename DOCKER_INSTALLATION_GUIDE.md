# Docker Desktop Installation Guide for Windows

## Why Docker is Needed

Docker is required to run Supabase locally, which includes:
- PostgreSQL database with RLS policies
- PostgREST API server
- GoTrue authentication
- Edge Functions runtime
- Storage and Realtime servers

## Installation Steps

### Step 1: Check System Requirements

**Windows Requirements**:
- Windows 10 64-bit: Pro, Enterprise, or Education (Build 19041 or higher)
- OR Windows 11 64-bit: Home or Pro version 21H2 or higher
- WSL 2 feature enabled
- 4GB RAM minimum (8GB recommended)
- Virtualization enabled in BIOS

### Step 2: Enable WSL 2 (Windows Subsystem for Linux)

Open PowerShell as Administrator and run:

```powershell
# Enable WSL
wsl --install

# Set WSL 2 as default
wsl --set-default-version 2
```

**Note**: You may need to restart your computer after this step.

### Step 3: Download Docker Desktop

1. Go to: https://www.docker.com/products/docker-desktop/
2. Click "Download for Windows"
3. Save the installer: `Docker Desktop Installer.exe`

### Step 4: Install Docker Desktop

1. **Run the installer** (double-click `Docker Desktop Installer.exe`)
2. **Follow the installation wizard**:
   - Accept the license agreement
   - Choose "Use WSL 2 instead of Hyper-V" (recommended)
   - Click "Install"
3. **Wait for installation** (may take 5-10 minutes)
4. **Restart your computer** when prompted

### Step 5: Start Docker Desktop

1. Launch Docker Desktop from Start Menu
2. Wait for Docker to start (whale icon in system tray)
3. Accept the Docker Subscription Service Agreement
4. You may be prompted to sign in (optional for local development)

### Step 6: Verify Installation

Open PowerShell and run:

```powershell
docker --version
docker ps
```

**Expected output**:
```
Docker version 24.x.x, build xxxxxxx
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
```

## Alternative: Manual Installation Without Admin Rights

If you cannot install Docker Desktop (requires admin), you have these options:

### Option A: Use Supabase Cloud Instead

Skip local development and deploy directly to Supabase cloud:

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy Edge Function
supabase functions deploy send-flash-offer-push

# Test in cloud
curl -X POST https://your-project.supabase.co/functions/v1/send-flash-offer-push \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"offerId": "test-id", "dryRun": true}'
```

### Option B: Run Tests Against Cloud Database

Set environment variables to point to your Supabase cloud project:

```bash
# Set environment variables
$env:SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_ANON_KEY="your-anon-key"

# Run RLS tests
npm test -- deviceTokens.rls.pbt.test.ts
```

### Option C: Request Admin Access

Ask your system administrator to:
1. Install Docker Desktop with admin privileges
2. Add your user to the "docker-users" group

## After Docker Installation

Once Docker is installed and running:

### 1. Start Local Supabase

```bash
# Navigate to project root
cd C:\Users\ac851\repos\alphaCharlie722

# Start Supabase (first run takes 5-10 minutes)
supabase start
```

**Expected output**:
```
Started supabase local development setup.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGc...
service_role key: eyJhbGc...
```

### 2. Run RLS Tests

```bash
# Set environment variables
$env:SUPABASE_URL="http://localhost:54321"
$env:SUPABASE_ANON_KEY="<anon-key-from-supabase-start>"

# Run RLS property-based tests
npm test -- deviceTokens.rls.pbt.test.ts
```

### 3. Deploy Edge Function Locally

```bash
# Deploy function
supabase functions deploy send-flash-offer-push --no-verify-jwt

# Test with dry-run
curl -X POST http://localhost:54321/functions/v1/send-flash-offer-push \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"offerId": "test-offer-id", "dryRun": true}'
```

### 4. View Logs

```bash
# Real-time logs
supabase functions logs send-flash-offer-push --tail

# Recent logs
supabase functions logs send-flash-offer-push --limit 100
```

### 5. Access Supabase Studio

Open browser to: http://localhost:54323

This gives you a GUI to:
- View database tables
- Run SQL queries
- Manage RLS policies
- View logs
- Test API endpoints

## Troubleshooting

### Docker Desktop Won't Start

**Issue**: Docker Desktop stuck on "Starting..."

**Solutions**:
1. Restart Docker Desktop
2. Restart your computer
3. Check WSL 2 is installed: `wsl --list --verbose`
4. Update WSL: `wsl --update`

### WSL 2 Not Installed

**Issue**: Error about WSL 2 not being available

**Solution**:
```powershell
# Run as Administrator
wsl --install
wsl --set-default-version 2
# Restart computer
```

### Virtualization Not Enabled

**Issue**: Error about virtualization

**Solution**:
1. Restart computer
2. Enter BIOS/UEFI (usually F2, F10, or Del during boot)
3. Find "Virtualization Technology" or "Intel VT-x" or "AMD-V"
4. Enable it
5. Save and exit

### Permission Denied

**Issue**: "permission denied while trying to connect to Docker daemon"

**Solution**:
1. Open Docker Desktop
2. Go to Settings → General
3. Check "Expose daemon on tcp://localhost:2375 without TLS"
4. Restart Docker Desktop

### Supabase Start Fails

**Issue**: `supabase start` fails with Docker errors

**Solutions**:
1. Ensure Docker Desktop is running (whale icon in system tray)
2. Run: `docker ps` to verify Docker is working
3. Check Docker has enough resources:
   - Docker Desktop → Settings → Resources
   - Increase Memory to at least 4GB
   - Increase CPUs to at least 2

## Next Steps After Installation

1. ✅ Verify Docker is running: `docker --version`
2. ✅ Start Supabase: `supabase start`
3. ✅ Run RLS tests: `npm test -- deviceTokens.rls.pbt.test.ts`
4. ✅ Deploy Edge Function: `supabase functions deploy send-flash-offer-push`
5. ✅ Test locally: Follow CHECKPOINT_TESTING.md

## Resources

- **Docker Desktop Download**: https://www.docker.com/products/docker-desktop/
- **Docker Documentation**: https://docs.docker.com/desktop/windows/install/
- **WSL 2 Installation**: https://docs.microsoft.com/en-us/windows/wsl/install
- **Supabase CLI Docs**: https://supabase.com/docs/guides/cli
- **Supabase Local Development**: https://supabase.com/docs/guides/cli/local-development

## Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Supabase CLI | ✅ Installed | v2.72.7 |
| Deno | ✅ Installed | v2.6.5 |
| Docker Desktop | ⏳ Pending | Requires manual installation |
| Local Supabase | ⏳ Pending | Requires Docker |

## Estimated Time

- **Docker Desktop Download**: 2-5 minutes (depends on internet speed)
- **Docker Desktop Installation**: 5-10 minutes
- **Computer Restart**: 2-3 minutes
- **First Supabase Start**: 5-10 minutes (downloads containers)
- **Total**: ~20-30 minutes

## Decision Point

**Choose your path**:

### Path A: Install Docker (Full Local Development)
- ✅ Complete local testing environment
- ✅ Run RLS tests
- ✅ Test Edge Functions locally
- ⏱️ Time: 20-30 minutes
- 💾 Disk: ~2GB for Docker + containers

### Path B: Use Supabase Cloud (Skip Local)
- ✅ Faster to get started
- ✅ Test in real environment
- ⏱️ Time: 5-10 minutes
- ❌ No local testing
- 💰 Uses cloud resources

### Path C: Continue Without Docker
- ✅ Immediate progress
- ✅ Unit tests work
- ❌ Can't run RLS tests
- ❌ Can't test Edge Functions locally

**Recommendation**: Install Docker for complete testing capability, especially for RLS policy validation.
