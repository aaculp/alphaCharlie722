# Migration Troubleshooting Guide

## Common Issues and Solutions

### Issue: "relation already exists" Error

**Error Message:**
```
ERROR: 42P07: relation "idx_notification_prefs_user" already exists
```

**Cause:** The migration was partially applied in a previous run.

**Solution:** The migration script has been updated to be idempotent (safe to run multiple times). Simply re-run the migration:

```powershell
# Re-run the migration
cd supabase/functions/scripts
.\run-migrations.ps1 -ProjectRef <your-project-ref>
```

The script now uses:
- `CREATE TABLE IF NOT EXISTS` - Won't fail if table exists
- `CREATE INDEX IF NOT EXISTS` - Won't fail if index exists
- `DROP POLICY IF EXISTS` before `CREATE POLICY` - Safe to re-run
- `DROP TRIGGER IF EXISTS` before `CREATE TRIGGER` - Safe to re-run
- `CREATE OR REPLACE FUNCTION` - Safe to re-run

### Issue: Policy Already Exists

**Error Message:**
```
ERROR: 42710: policy "Users can manage own device tokens" already exists
```

**Solution:** The migration now drops existing policies before creating them. Re-run the migration.

### Issue: Constraint Violation

**Error Message:**
```
ERROR: 23505: duplicate key value violates unique constraint
```

**Cause:** Data already exists that conflicts with the new schema.

**Solution:**
1. Check existing data:
   ```sql
   SELECT * FROM notification_preferences LIMIT 10;
   ```
2. If safe, clear conflicting data or adjust the migration

### Verifying Migration Status

Check if tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('notification_preferences', 'flash_offer_rate_limits');
```

Check if indexes exist:
```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('notification_preferences', 'flash_offer_rate_limits');
```

Check if policies exist:
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('device_tokens', 'notification_preferences', 'flash_offer_rate_limits');
```

## Safe Re-run

The migration is now fully idempotent and can be safely re-run multiple times without errors or data loss.
