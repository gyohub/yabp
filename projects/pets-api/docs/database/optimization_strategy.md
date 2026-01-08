# Database Optimization Strategy: Pets API

## Executive Summary

This document outlines the optimization strategy for the Pets API database schema, focusing on query performance, scalability, and maintainability for PostgreSQL.

## Query Analysis and Optimization

### High-Frequency Queries

#### 1. User Authentication Query
**Query Pattern:**
```sql
SELECT id, username, email, password, role 
FROM users 
WHERE username = ? OR email = ?
```

**Optimization:**
- Unique indexes on `username` and `email` ensure O(log n) lookup
- Consider composite index if both fields are frequently queried together
- Index selectivity: High (unique values)

**Expected Performance:** < 1ms for index scan

#### 2. List User's Active Pets
**Query Pattern:**
```sql
SELECT * FROM pets 
WHERE user_id = ? AND deleted = FALSE 
ORDER BY created_at DESC
LIMIT ? OFFSET ?
```

**Optimization:**
- Composite index `idx_pets_user_deleted` covers WHERE clause
- Consider adding `created_at` to index for ORDER BY optimization: `(user_id, deleted, created_at DESC)`
- Pagination via LIMIT/OFFSET (consider cursor-based pagination for large datasets)

**Expected Performance:** < 5ms for typical page size (20-50 records)

#### 3. Get Pet with History
**Query Pattern:**
```sql
SELECT p.* FROM pets p WHERE p.id = ? AND p.deleted = FALSE;

SELECT * FROM pet_history 
WHERE pet_id = ? 
ORDER BY date DESC;
```

**Optimization:**
- Primary key lookup for pet: O(1) performance
- Composite index `idx_pet_history_pet_date` optimizes history query
- Consider fetching history in single query with JOIN if needed frequently

**Expected Performance:** < 2ms for pet, < 3ms for history

#### 4. Admin: List All Pets (with filters)
**Query Pattern:**
```sql
SELECT * FROM pets 
WHERE deleted = ? OR deleted IS NULL
ORDER BY created_at DESC
LIMIT ? OFFSET ?
```

**Optimization:**
- Index on `deleted` supports filtering
- Consider partial index: `CREATE INDEX idx_pets_active ON pets(created_at DESC) WHERE deleted = FALSE`
- For admin queries including deleted: Full table scan may be acceptable if rare

**Expected Performance:** < 10ms for typical page size

### Query Optimization Recommendations

1. **Use EXPLAIN ANALYZE** for all query patterns during development
2. **Monitor slow query log** in production (queries > 100ms)
3. **Consider materialized views** for complex aggregations if needed
4. **Implement query result caching** at application level for read-heavy endpoints

## Indexing Strategy

### Current Indexes

| Table | Index Name | Columns | Type | Purpose |
|-------|-----------|---------|------|---------|
| users | idx_users_username | username | UNIQUE | Authentication lookup |
| users | idx_users_email | email | UNIQUE | Authentication lookup |
| users | idx_users_role | role | B-TREE | Role-based queries |
| pets | idx_pets_user_id | user_id | B-TREE | Foreign key, joins |
| pets | idx_pets_deleted | deleted | B-TREE | Soft delete filtering |
| pets | idx_pets_user_deleted | user_id, deleted | B-TREE | User's active pets |
| pets | idx_pets_name | name | B-TREE | Search functionality |
| pet_history | idx_pet_history_pet_id | pet_id | B-TREE | Foreign key, joins |
| pet_history | idx_pet_history_pet_date | pet_id, date DESC | B-TREE | Chronological queries |

### Index Maintenance

1. **Monitor Index Usage:**
   ```sql
   SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
   FROM pg_stat_user_indexes
   ORDER BY idx_scan;
   ```

2. **Remove Unused Indexes:** Indexes with `idx_scan = 0` over extended period should be reviewed

3. **Rebuild Indexes:** Periodically run `REINDEX` during maintenance windows

4. **Index Bloat:** Monitor with `pg_stat_user_tables` and `pg_class` for bloat

### Additional Index Considerations

**Partial Indexes (Future Optimization):**
```sql
-- Optimize active pets queries
CREATE INDEX idx_pets_active_user ON pets(user_id, created_at DESC) 
WHERE deleted = FALSE;

-- Optimize recent history
CREATE INDEX idx_pet_history_recent ON pet_history(pet_id, date DESC) 
WHERE date >= CURRENT_DATE - INTERVAL '1 year';
```

**GIN Indexes (If Full-Text Search Added):**
```sql
-- For pet name/description search
CREATE INDEX idx_pets_name_gin ON pets USING gin(to_tsvector('english', name));
```

## Connection Pooling Strategy

### Recommended Configuration

**HikariCP (Spring Boot Default):**
```properties
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000
```

**PostgreSQL Configuration:**
```sql
-- Adjust based on server resources
max_connections = 100
shared_buffers = 256MB  -- 25% of RAM for dedicated server
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1  -- For SSD storage
effective_io_concurrency = 200  -- For SSD storage
```

## Scalability Considerations

### Vertical Scaling
- Current schema supports single PostgreSQL instance
- Monitor CPU, memory, and disk I/O
- Scale up when resource utilization > 70%

### Horizontal Scaling (Read Replicas)
- Implement read replicas for read-heavy workloads
- Use connection routing: writes to primary, reads to replicas
- Consider lag monitoring: `SELECT pg_last_xlog_replay_location()`

### Partitioning Strategy (Future)
If `pets` table grows beyond 10M rows:
- **Range Partitioning** by `created_at` (monthly/yearly partitions)
- **List Partitioning** by `user_id` (if user distribution is known)
- Benefits: Faster queries, easier maintenance, better archival

### Archival Strategy
- Archive soft-deleted pets older than X years to separate table
- Archive old pet history records (> 5 years) to archive table
- Reduces main table size, improves query performance

## Data Integrity Strategies

### Constraints
1. **Foreign Key Constraints:** Ensure referential integrity
2. **Check Constraints:** Validate business rules at database level
3. **Unique Constraints:** Prevent duplicate usernames/emails

### Transaction Management
- Use appropriate isolation levels (READ COMMITTED default)
- Keep transactions short to reduce lock contention
- Use `SELECT FOR UPDATE` sparingly (only when necessary)

### Backup and Recovery
- **Full Backups:** Daily via `pg_dump` or continuous archiving
- **Point-in-Time Recovery:** Enable WAL archiving
- **Test Restores:** Monthly restore tests to verify backup integrity

## Monitoring and Maintenance

### Key Metrics to Monitor

1. **Query Performance:**
   - Average query execution time
   - Slow query count (> 100ms)
   - Index usage statistics

2. **Connection Metrics:**
   - Active connections
   - Connection pool utilization
   - Connection wait time

3. **Table Statistics:**
   - Table sizes and growth rate
   - Index sizes
   - Bloat percentage

4. **Lock Contention:**
   - Long-running transactions
   - Deadlock frequency
   - Lock wait time

### Maintenance Tasks

**Daily:**
- Monitor slow query log
- Check connection pool metrics
- Review error logs

**Weekly:**
- Analyze table statistics: `ANALYZE`
- Review index usage
- Check disk space usage

**Monthly:**
- Update table statistics: `VACUUM ANALYZE`
- Review and optimize unused indexes
- Test backup restore procedures
- Review query performance trends

**Quarterly:**
- Full database `VACUUM` (if needed)
- Review and adjust PostgreSQL configuration
- Capacity planning review

## Performance Testing Recommendations

### Load Testing Scenarios

1. **Authentication Load:**
   - 100 concurrent login requests
   - Measure response time and error rate

2. **Pet CRUD Operations:**
   - 50 concurrent users creating/updating pets
   - Measure transaction throughput

3. **List Pets Query:**
   - 200 concurrent users listing pets
   - Measure query performance under load

4. **History Queries:**
   - 100 concurrent users fetching pet history
   - Measure join performance

### Benchmark Targets

- Authentication: < 50ms (p95)
- Pet CRUD: < 100ms (p95)
- List Pets: < 200ms (p95)
- Get Pet Details: < 50ms (p95)
- History Queries: < 100ms (p95)

## Security Optimization

1. **Row-Level Security (Future):**
   - Implement RLS policies for multi-tenant scenarios
   - Ensure users can only access their own data

2. **Encryption:**
   - Encrypt sensitive data at rest (TDE or application-level)
   - Use SSL/TLS for connections

3. **Audit Logging:**
   - Consider audit trigger for sensitive operations
   - Log all admin actions

## Recommendations Summary

### Immediate Actions
1. ✅ Implement all defined indexes
2. ✅ Configure connection pooling appropriately
3. ✅ Set up query performance monitoring
4. ✅ Implement proper transaction boundaries

### Short-Term (1-3 months)
1. Monitor and optimize slow queries
2. Review index usage and remove unused indexes
3. Implement query result caching for read-heavy endpoints
4. Set up automated backups and test restore procedures

### Long-Term (3-6 months)
1. Consider read replicas if read load increases
2. Implement partitioning if table sizes grow significantly
3. Add full-text search capabilities if needed
4. Consider archival strategy for old data
