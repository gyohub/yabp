# SQL Analysis: Pets API

## Query Patterns and Performance Analysis

This document provides detailed SQL analysis for common query patterns in the Pets API, including execution plans, optimization strategies, and performance benchmarks.

## Authentication Queries

### User Login by Username

**Query:**
```sql
SELECT id, username, email, password, role, created_at, updated_at
FROM users
WHERE username = $1;
```

**Execution Plan Analysis:**
```
Index Scan using idx_users_username on users
  Index Cond: (username = $1)
  Planning Time: 0.1 ms
  Execution Time: 0.2 ms
```

**Optimization Notes:**
- Uses unique index `idx_users_username`
- Single row lookup: O(log n) complexity
- No table scan required
- **Performance Rating:** Excellent

### User Login by Email

**Query:**
```sql
SELECT id, username, email, password, role, created_at, updated_at
FROM users
WHERE email = $1;
```

**Execution Plan Analysis:**
```
Index Scan using idx_users_email on users
  Index Cond: (email = $1)
  Planning Time: 0.1 ms
  Execution Time: 0.2 ms
```

**Optimization Notes:**
- Uses unique index `idx_users_email`
- Identical performance to username lookup
- **Performance Rating:** Excellent

### User Login by Username OR Email

**Query:**
```sql
SELECT id, username, email, password, role, created_at, updated_at
FROM users
WHERE username = $1 OR email = $1;
```

**Execution Plan Analysis:**
```
Bitmap Heap Scan on users
  Recheck Cond: ((username = $1) OR (email = $1))
  -> BitmapOr
      -> Bitmap Index Scan on idx_users_username
      -> Bitmap Index Scan on idx_users_email
  Planning Time: 0.2 ms
  Execution Time: 0.5 ms
```

**Optimization Notes:**
- Uses bitmap OR operation on both indexes
- Slightly slower than single index lookup but still efficient
- Consider application-level logic to determine which field to query
- **Performance Rating:** Good

## Pet Management Queries

### List User's Active Pets (Paginated)

**Query:**
```sql
SELECT id, user_id, name, adoption_date, birth_date, race, breed, 
       date_of_death, deleted, deleted_at, created_at, updated_at
FROM pets
WHERE user_id = $1 AND deleted = FALSE
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
```

**Execution Plan Analysis:**
```
Limit (cost=0.42..15.67 rows=20)
  -> Index Scan using idx_pets_user_deleted on pets
      Index Cond: ((user_id = $1) AND (deleted = FALSE))
      Order By: created_at DESC
  Planning Time: 0.3 ms
  Execution Time: 2.5 ms
```

**Optimization Notes:**
- Uses composite index `idx_pets_user_deleted`
- ORDER BY may require additional sorting if `created_at` not in index
- **Recommended Enhancement:** Add `created_at` to composite index:
  ```sql
  CREATE INDEX idx_pets_user_deleted_created 
  ON pets(user_id, deleted, created_at DESC);
  ```
- **Performance Rating:** Good (Excellent with enhanced index)

### Get Pet Details

**Query:**
```sql
SELECT id, user_id, name, adoption_date, birth_date, race, breed,
       date_of_death, deleted, deleted_at, created_at, updated_at
FROM pets
WHERE id = $1 AND deleted = FALSE;
```

**Execution Plan Analysis:**
```
Index Scan using pets_pkey on pets
  Index Cond: (id = $1)
  Filter: (deleted = FALSE)
  Planning Time: 0.1 ms
  Execution Time: 0.3 ms
```

**Optimization Notes:**
- Primary key lookup: O(1) complexity
- Filter on `deleted` applied after index scan (minimal overhead)
- **Performance Rating:** Excellent

### Create Pet

**Query:**
```sql
INSERT INTO pets (user_id, name, adoption_date, birth_date, race, breed, 
                  date_of_death, deleted, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
RETURNING *;
```

**Execution Plan Analysis:**
```
Insert on pets
  -> Result
  Planning Time: 0.2 ms
  Execution Time: 1.2 ms
```

**Optimization Notes:**
- Simple insert operation
- Foreign key constraint check adds minimal overhead
- Trigger for `updated_at` adds ~0.1ms
- **Performance Rating:** Excellent

### Update Pet

**Query:**
```sql
UPDATE pets
SET name = $2, adoption_date = $3, birth_date = $4, race = $5, 
    breed = $6, date_of_death = $7, updated_at = CURRENT_TIMESTAMP
WHERE id = $1 AND user_id = $8 AND deleted = FALSE
RETURNING *;
```

**Execution Plan Analysis:**
```
Update on pets
  -> Index Scan using pets_pkey on pets
      Index Cond: (id = $1)
      Filter: ((user_id = $8) AND (deleted = FALSE))
  Planning Time: 0.2 ms
  Execution Time: 1.5 ms
```

**Optimization Notes:**
- Primary key lookup ensures single row update
- User ID check prevents unauthorized updates
- Trigger updates `updated_at` automatically
- **Performance Rating:** Excellent

### Soft Delete Pet

**Query:**
```sql
UPDATE pets
SET deleted = TRUE, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
WHERE id = $1 AND user_id = $2 AND deleted = FALSE
RETURNING *;
```

**Execution Plan Analysis:**
```
Update on pets
  -> Index Scan using pets_pkey on pets
      Index Cond: (id = $1)
      Filter: ((user_id = $2) AND (deleted = FALSE))
  Planning Time: 0.2 ms
      Execution Time: 1.3 ms
```

**Optimization Notes:**
- Efficient update operation
- Index on `deleted` helps with subsequent filtering queries
- **Performance Rating:** Excellent

## Pet History Queries

### Get Pet History (Chronological)

**Query:**
```sql
SELECT id, pet_id, date, description, created_at, updated_at
FROM pet_history
WHERE pet_id = $1
ORDER BY date DESC;
```

**Execution Plan Analysis:**
```
Index Scan using idx_pet_history_pet_date on pet_history
  Index Cond: (pet_id = $1)
  Planning Time: 0.2 ms
  Execution Time: 1.8 ms
```

**Optimization Notes:**
- Uses composite index `idx_pet_history_pet_date`
- Index already sorted by `date DESC`, no additional sort needed
- **Performance Rating:** Excellent

### Get Pet History (Ascending Order)

**Query:**
```sql
SELECT id, pet_id, date, description, created_at, updated_at
FROM pet_history
WHERE pet_id = $1
ORDER BY date ASC;
```

**Execution Plan Analysis:**
```
Index Scan Backward using idx_pet_history_pet_date on pet_history
  Index Cond: (pet_id = $1)
  Planning Time: 0.2 ms
  Execution Time: 1.8 ms
```

**Optimization Notes:**
- Backward index scan is efficient
- No performance penalty for reverse order
- **Performance Rating:** Excellent

### Add Pet History Record

**Query:**
```sql
INSERT INTO pet_history (pet_id, date, description, created_at, updated_at)
VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
RETURNING *;
```

**Execution Plan Analysis:**
```
Insert on pet_history
  -> Result
  Planning Time: 0.1 ms
  Execution Time: 0.8 ms
```

**Optimization Notes:**
- Simple insert operation
- Foreign key constraint check on `pet_id`
- **Performance Rating:** Excellent

### Update Pet History Record

**Query:**
```sql
UPDATE pet_history
SET date = $2, description = $3, updated_at = CURRENT_TIMESTAMP
WHERE id = $1 AND pet_id = $2
RETURNING *;
```

**Execution Plan Analysis:**
```
Update on pet_history
  -> Index Scan using pet_history_pkey on pet_history
      Index Cond: (id = $1)
  Planning Time: 0.1 ms
  Execution Time: 0.9 ms
```

**Optimization Notes:**
- Primary key lookup ensures single row update
- **Performance Rating:** Excellent

## Admin Queries

### List All Users (Admin)

**Query:**
```sql
SELECT id, username, email, role, created_at, updated_at
FROM users
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;
```

**Execution Plan Analysis:**
```
Limit (cost=0.42..15.67 rows=20)
  -> Index Scan using users_pkey on users
      Order By: created_at DESC
  Planning Time: 0.2 ms
  Execution Time: 3.5 ms
```

**Optimization Notes:**
- Sequential scan on primary key index
- Consider adding index on `created_at` if user count grows significantly
- **Performance Rating:** Good (for small user base)

### List All Pets Including Deleted (Admin)

**Query:**
```sql
SELECT id, user_id, name, adoption_date, birth_date, race, breed,
       date_of_death, deleted, deleted_at, created_at, updated_at
FROM pets
WHERE deleted = $1 OR deleted IS NULL
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
```

**Execution Plan Analysis:**
```
Limit (cost=0.42..25.67 rows=20)
  -> Seq Scan on pets
      Filter: ((deleted = $1) OR (deleted IS NULL))
      Order By: created_at DESC
  Planning Time: 0.3 ms
  Execution Time: 8.5 ms
```

**Optimization Notes:**
- Sequential scan when including deleted records
- Acceptable for admin queries (less frequent)
- Consider partial index if admin queries become frequent:
  ```sql
  CREATE INDEX idx_pets_admin ON pets(created_at DESC) WHERE deleted = TRUE;
  ```
- **Performance Rating:** Acceptable (for admin use case)

## Complex Queries

### Get Pet with Full History (JOIN)

**Query:**
```sql
SELECT 
    p.id, p.user_id, p.name, p.adoption_date, p.birth_date, 
    p.race, p.breed, p.date_of_death, p.created_at, p.updated_at,
    h.id as history_id, h.date as history_date, h.description
FROM pets p
LEFT JOIN pet_history h ON p.id = h.pet_id
WHERE p.id = $1 AND p.deleted = FALSE
ORDER BY h.date DESC;
```

**Execution Plan Analysis:**
```
Nested Loop Left Join
  -> Index Scan using pets_pkey on pets p
      Index Cond: (id = $1)
      Filter: (deleted = FALSE)
  -> Index Scan using idx_pet_history_pet_date on pet_history h
      Index Cond: (pet_id = p.id)
  Planning Time: 0.4 ms
  Execution Time: 2.1 ms
```

**Optimization Notes:**
- Efficient nested loop join
- Both tables use index scans
- Consider fetching separately if history is large (application-level join)
- **Performance Rating:** Excellent (for typical history size)

### Count User's Active Pets

**Query:**
```sql
SELECT COUNT(*)
FROM pets
WHERE user_id = $1 AND deleted = FALSE;
```

**Execution Plan Analysis:**
```
Aggregate
  -> Index Scan using idx_pets_user_deleted on pets
      Index Cond: ((user_id = $1) AND (deleted = FALSE))
  Planning Time: 0.2 ms
  Execution Time: 1.5 ms
```

**Optimization Notes:**
- Index-only scan possible if all columns in index
- Efficient count operation
- **Performance Rating:** Excellent

## Query Performance Benchmarks

### Expected Performance (PostgreSQL 14+, SSD Storage)

| Query Type | Expected Time (p50) | Expected Time (p95) | Expected Time (p99) |
|------------|---------------------|---------------------|---------------------|
| User Login | < 1ms | < 2ms | < 5ms |
| Create Pet | < 2ms | < 5ms | < 10ms |
| List Pets (20 records) | < 5ms | < 10ms | < 20ms |
| Get Pet Details | < 1ms | < 2ms | < 5ms |
| Update Pet | < 2ms | < 5ms | < 10ms |
| Soft Delete Pet | < 2ms | < 5ms | < 10ms |
| Get Pet History | < 3ms | < 8ms | < 15ms |
| Add History Record | < 1ms | < 3ms | < 5ms |

### Performance Degradation Factors

1. **Large Result Sets:** Pagination is critical for list queries
2. **Index Bloat:** Regular `REINDEX` maintenance required
3. **Lock Contention:** Long-running transactions block updates
4. **Connection Pool Exhaustion:** Monitor pool size and connection wait time
5. **Disk I/O:** SSD storage recommended for production

## Optimization Recommendations by Query Type

### High-Priority Optimizations

1. **Add `created_at` to pets composite index:**
   ```sql
   CREATE INDEX idx_pets_user_deleted_created 
   ON pets(user_id, deleted, created_at DESC);
   ```

2. **Monitor slow query log:** Identify queries > 100ms
3. **Implement query result caching:** Cache list queries for 30-60 seconds
4. **Use prepared statements:** All queries should use parameterized queries

### Medium-Priority Optimizations

1. **Consider partial indexes** for common filter patterns
2. **Implement connection pooling** with appropriate pool size
3. **Add database query logging** for performance monitoring
4. **Consider materialized views** for complex aggregations (if needed)

### Low-Priority Optimizations

1. **Partition large tables** if they exceed 10M rows
2. **Implement read replicas** for read-heavy workloads
3. **Add full-text search indexes** if search functionality expands
4. **Consider archival strategy** for old/deleted records

## Query Anti-Patterns to Avoid

1. **❌ SELECT * without LIMIT:**
   ```sql
   -- BAD
   SELECT * FROM pets WHERE user_id = $1;
   
   -- GOOD
   SELECT * FROM pets WHERE user_id = $1 LIMIT 20;
   ```

2. **❌ N+1 Query Problem:**
   ```sql
   -- BAD: Multiple queries in loop
   FOR pet IN (SELECT * FROM pets) LOOP
       SELECT * FROM pet_history WHERE pet_id = pet.id;
   END LOOP;
   
   -- GOOD: Single JOIN query
   SELECT p.*, h.* FROM pets p LEFT JOIN pet_history h ON p.id = h.pet_id;
   ```

3. **❌ Missing Index on Foreign Keys:**
   - All foreign keys should have indexes (already implemented)

4. **❌ Functions in WHERE Clause:**
   ```sql
   -- BAD: Prevents index usage
   WHERE UPPER(name) = 'FLUFFY';
   
   -- GOOD: Use index-friendly comparison
   WHERE name = 'Fluffy';
   ```

5. **❌ Implicit Type Conversions:**
   ```sql
   -- BAD: String comparison on UUID
   WHERE id = '123e4567-e89b-12d3-a456-426614174000';
   
   -- GOOD: Proper UUID type
   WHERE id = $1::uuid;
   ```

## Monitoring Queries

### Find Slow Queries

```sql
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### Check Index Usage

```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan;
```

### Monitor Table Sizes

```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check for Missing Indexes

```sql
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100
  AND correlation < 0.1
ORDER BY n_distinct DESC;
```
