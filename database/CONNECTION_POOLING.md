# Database Connection Pooling

## Overview

Connection pooling is automatically handled by Supabase for optimal performance. This document describes the configuration and best practices.

## Supabase Connection Pooling

Supabase provides built-in connection pooling through PgBouncer, which manages database connections efficiently.

### Default Configuration

- **Pool Mode**: Transaction pooling (recommended for serverless)
- **Max Connections**: Automatically managed by Supabase
- **Connection Timeout**: 30 seconds
- **Idle Timeout**: 10 minutes

### Connection String

Supabase provides two connection strings:

1. **Direct Connection**: For long-running connections
   - Use for migrations and admin tasks
   - Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

2. **Pooled Connection**: For application queries (default)
   - Use for all application queries
   - Format: `postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres`
   - Port 6543 uses PgBouncer for connection pooling

### Best Practices

1. **Use Pooled Connections**: Always use the pooled connection string (port 6543) for application queries
2. **Short-Lived Queries**: Keep queries short to maximize connection reuse
3. **Avoid Long Transactions**: Long transactions hold connections and reduce pool efficiency
4. **Batch Operations**: Use batch operations when possible to reduce connection overhead

### Performance Optimizations

The following optimizations are implemented:

1. **Token Caching**: In-memory cache with 5-minute TTL reduces database queries
2. **Composite Indexes**: Optimized indexes for common query patterns
3. **Batch FCM Requests**: Up to 500 tokens per batch reduces overhead
4. **Query Optimization**: Efficient queries with proper WHERE clauses and indexes

### Monitoring

Monitor connection pool usage in Supabase Dashboard:

1. Navigate to Database → Connection Pooling
2. Check active connections and pool utilization
3. Monitor query performance in Database → Query Performance

### Troubleshooting

**Connection Pool Exhausted**:
- Increase pool size in Supabase settings
- Optimize queries to reduce execution time
- Check for connection leaks in application code

**Slow Queries**:
- Review query execution plans
- Add missing indexes
- Optimize WHERE clauses and JOINs

## Requirements

- Requirements: 14.2, 14.4, 14.8
