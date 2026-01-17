# Docker Desktop WSL Integration Fix

## Error Explanation

The error `DockerDesktop/Wsl/ExecError` indicates that Docker Desktop is having trouble communicating with the Ubuntu WSL distribution. This is a common issue when:
- WSL 2 isn't properly configured
- Ubuntu distribution has issues
- Docker Desktop WSL integration needs to be reset

## Quick Fixes (Try in Order)

### Fix 1: Restart Docker Desktop

**Simplest solution - try this first:**

1. Right-click Docker Desktop icon in system tray (bottom-right)
2. Click "Quit Docker Desktop"
3. Wait 10 seconds
4. Start Docker Desktop again from Start menu
5. Wait for it to fully start (whale icon should be steady)

**Verify:**
```powershell
docker ps
```

---

### Fix 2: Reset WSL Integration in Docker Desktop

**If restart didn't work:**

1. Open Docker Desktop
2. Click Settings (gear icon)
3. Go to **Resources** → **WSL Integration**
4. **Uncheck** "Enable integration with my default WSL distro"
5. **Uncheck** any Ubuntu distributions listed
6. Click **Apply & Restart**
7. Wait for Docker to restart
8. Go back to **Resources** → **WSL Integration**
9. **Check** "Enable integration with my default WSL distro"
10. **Check** Ubuntu distribution
11. Click **Apply & Restart**

**Verify:**
```powershell
docker ps
```

---

### Fix 3: Update WSL and Ubuntu

**If integration reset didn't work:**

```powershell
# Update WSL to latest version
wsl --update

# Shutdown all WSL instances
wsl --shutdown

# Wait 10 seconds, then restart Docker Desktop
```

**Verify:**
```powershell
docker ps
```

---

### Fix 4: Set WSL 2 as Default and Reinstall Ubuntu

**If WSL update didn't work:**

```powershell
# Set WSL 2 as default
wsl --set-default-version 2

# List installed distributions
wsl --list --verbose

# If Ubuntu is version 1, upgrade it to version 2
wsl --set-version Ubuntu 2

# Shutdown WSL
wsl --shutdown

# Restart Docker Desktop
```

**Verify:**
```powershell
docker ps
```

---

### Fix 5: Unregister and Reinstall Ubuntu Distribution

**If version upgrade didn't work:**

⚠️ **Warning**: This will delete the Ubuntu distribution. Only do this if you don't have important data in it.

```powershell
# List distributions
wsl --list --verbose

# Unregister Ubuntu (this deletes it)
wsl --unregister Ubuntu

# Install fresh Ubuntu
wsl --install -d Ubuntu

# Set it to WSL 2
wsl --set-version Ubuntu 2

# Shutdown WSL
wsl --shutdown

# Restart Docker Desktop

# Re-enable integration in Docker Desktop settings
```

**Verify:**
```powershell
docker ps
```

---

### Fix 6: Use Docker Without WSL Integration

**If all else fails, use Docker directly:**

1. Open Docker Desktop
2. Go to Settings → General
3. **Uncheck** "Use the WSL 2 based engine"
4. Click **Apply & Restart**

⚠️ **Note**: This uses Hyper-V instead of WSL 2. It works but is less efficient.

**Verify:**
```powershell
docker ps
```

---

## Alternative: Skip WSL Integration

If you just want to get Supabase running quickly:

### Option A: Use Docker Desktop Without Ubuntu Integration

Docker Desktop works fine without WSL integration for running containers:

```powershell
# Just verify Docker daemon is running
docker ps

# If this works, you're good to go!
# The error about Ubuntu integration won't affect Supabase
```

### Option B: Use PowerShell Instead of WSL

Run all Docker commands from PowerShell instead of WSL:

```powershell
# Start Supabase from PowerShell
supabase start

# This should work even with the WSL integration error
```

---

## Testing Docker

After trying any fix, test Docker:

```powershell
# Test 1: Check Docker is running
docker --version

# Test 2: Check daemon is accessible
docker ps

# Test 3: Run a test container
docker run hello-world

# Test 4: Check Docker Compose
docker-compose --version
```

**Expected output for `docker ps`:**
```
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
```

---

## Start Supabase

Once Docker is working:

```powershell
# Navigate to project
cd C:\Users\ac851\repos\alphaCharlie722

# Start Supabase (first run takes 5-10 minutes)
supabase start
```

**Expected output:**
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

---

## Common Issues

### Issue: "Docker daemon is not running"

**Solution:**
1. Open Docker Desktop from Start menu
2. Wait for whale icon to appear in system tray
3. Wait until icon is steady (not animating)
4. Try command again

### Issue: "Cannot connect to Docker daemon"

**Solution:**
```powershell
# Restart Docker service
Restart-Service docker

# Or restart Docker Desktop
```

### Issue: "WSL 2 installation is incomplete"

**Solution:**
```powershell
# Run as Administrator
wsl --install
wsl --update

# Restart computer
```

### Issue: Supabase start hangs

**Solution:**
```powershell
# Stop any running containers
docker stop $(docker ps -aq)

# Remove containers
docker rm $(docker ps -aq)

# Try again
supabase start
```

---

## What to Do Now

### Step 1: Try Quick Fix
```powershell
# Restart Docker Desktop
# Right-click system tray icon → Quit Docker Desktop
# Start Docker Desktop from Start menu
# Wait 30 seconds

# Test
docker ps
```

### Step 2: If That Works, Start Supabase
```powershell
cd C:\Users\ac851\repos\alphaCharlie722
supabase start
```

### Step 3: If Docker Works But Supabase Fails
The WSL integration error might not matter. Try starting Supabase anyway:
```powershell
supabase start
```

Many times, Supabase works fine even with the WSL integration warning.

---

## Next Steps After Docker is Working

Once `docker ps` works:

1. **Start Supabase**
   ```bash
   supabase start
   ```

2. **Run RLS Tests**
   ```bash
   $env:SUPABASE_URL="http://localhost:54321"
   $env:SUPABASE_ANON_KEY="<anon-key-from-supabase-start>"
   npm test -- deviceTokens.rls.pbt.test.ts
   ```

3. **Deploy Edge Function**
   ```bash
   supabase functions deploy send-flash-offer-push --no-verify-jwt
   ```

4. **Follow Checkpoint Testing**
   See: `supabase/functions/send-flash-offer-push/CHECKPOINT_TESTING.md`

---

## Status Check

Run these commands and share the output:

```powershell
# 1. Docker version
docker --version

# 2. Docker daemon status
docker ps

# 3. WSL status
wsl --list --verbose

# 4. Docker Desktop status
# Check system tray - is whale icon present and steady?
```

This will help determine which fix to apply.
