# Architecture Decision Records (ADRs): Pets API

## Overview

This document records the architectural decisions made for the Pets API project. Each ADR describes a significant architectural decision, its context, and its consequences.

## ADR-001: Layered Architecture Pattern

**Status:** Accepted  
**Date:** 2026-01-07  
**Deciders:** Architecture Team

### Context

We need to structure the application in a way that separates concerns, enables testability, and allows for future scalability.

### Decision

We will use a layered architecture pattern with the following layers:
- Presentation Layer (Controllers)
- Service Layer (Business Logic)
- Repository Layer (Data Access)
- Domain Layer (Entities)

### Consequences

**Positive:**
- Clear separation of concerns
- Easy to test each layer independently
- Maintainable codebase
- Standard Spring Boot structure

**Negative:**
- Potential for over-engineering simple operations
- Requires discipline to avoid layer skipping
- May introduce some overhead for simple CRUD operations

---

## ADR-002: Spring Boot 3 Framework

**Status:** Accepted  
**Date:** 2026-01-07  
**Deciders:** Architecture Team

### Context

We need to choose a Java framework that provides rapid development, built-in features, and enterprise-grade capabilities.

### Decision

We will use Spring Boot 3 as the primary application framework.

### Consequences

**Positive:**
- Rapid development with auto-configuration
- Built-in security, data access, and monitoring
- Large ecosystem and community support
- Production-ready features out of the box
- Native support for Java 17+

**Negative:**
- Learning curve for developers new to Spring
- Some opinionated defaults may not fit all use cases
- Larger application footprint compared to micro-frameworks

---

## ADR-003: PostgreSQL Database

**Status:** Accepted  
**Date:** 2026-01-07  
**Deciders:** Architecture Team, Database Specialist

### Context

We need a relational database that supports ACID transactions, complex queries, and is suitable for production use.

### Decision

We will use PostgreSQL as the primary database.

### Consequences

**Positive:**
- ACID compliance
- Rich feature set (JSON support, full-text search, etc.)
- Excellent performance and scalability
- Strong data integrity features
- Open source and cost-effective
- AWS RDS support

**Negative:**
- Requires database administration knowledge
- May be overkill for simple use cases
- Connection pooling management needed

---

## ADR-004: RESTful API Design

**Status:** Accepted  
**Date:** 2026-01-07  
**Deciders:** Architecture Team

### Context

We need to design an API that is intuitive, follows standards, and is easy for clients to consume.

### Decision

We will design a RESTful API following REST principles and HTTP best practices.

### Consequences

**Positive:**
- Standard and widely understood
- Stateless design enables scalability
- Cacheable responses
- Works well with HTTP infrastructure
- Easy to document and test

**Negative:**
- May not fit all use cases (e.g., real-time updates)
- Over-fetching/under-fetching issues
- Versioning complexity
- Limited support for complex queries

---

## ADR-005: JWT Authentication

**Status:** Accepted  
**Date:** 2026-01-07  
**Deciders:** Architecture Team, Security Team

### Context

We need a stateless authentication mechanism that works across multiple instances and doesn't require server-side session storage.

### Decision

We will use JWT (JSON Web Tokens) for authentication.

### Consequences

**Positive:**
- Stateless authentication
- Scalable across multiple instances
- No server-side session storage needed
- Self-contained token with user information
- Works well with microservices

**Negative:**
- Token size larger than session IDs
- Cannot revoke tokens before expiration (without blacklist)
- Security concerns if token is compromised
- Requires careful secret management

**Update (2026-01-07):** Token revocation mechanism added via Redis blacklist to address security concerns.

---

## ADR-006: URL-Based API Versioning

**Status:** Accepted  
**Date:** 2026-01-07  
**Deciders:** Architecture Team

### Context

We need a versioning strategy that allows API evolution while maintaining backward compatibility.

### Decision

We will use URL-based versioning (`/api/v1/`, `/api/v2/`, etc.) instead of header-based or query parameter-based versioning.

### Consequences

**Positive:**
- Explicit and clear version identification
- Easy to route different versions
- Works with all HTTP clients
- Easy to document and understand
- Allows multiple versions to coexist

**Negative:**
- URL pollution
- More complex routing logic
- Requires maintaining multiple controller versions
- Potential code duplication

---

## ADR-007: Soft Delete Pattern

**Status:** Accepted  
**Date:** 2026-01-07  
**Deciders:** Architecture Team, Product Team

### Context

We need to preserve data for audit purposes and allow data recovery while providing delete functionality to users.

### Decision

We will implement soft delete pattern for pets (marking records as deleted instead of physically removing them).

### Consequences

**Positive:**
- Data preservation for audit trails
- Ability to recover deleted data
- Historical data analysis capability
- Compliance with data retention requirements
- User can "undo" deletions

**Negative:**
- Additional storage requirements
- More complex queries (need to filter deleted records)
- Potential performance impact
- Database growth over time
- Need for cleanup strategy for old deleted records

---

## ADR-008: DTO Pattern for API Responses

**Status:** Accepted  
**Date:** 2026-01-07  
**Deciders:** Architecture Team

### Context

We need to control API contracts independently of domain entities and optimize data transfer.

### Decision

We will use DTOs (Data Transfer Objects) to separate API contracts from domain entities.

### Consequences

**Positive:**
- Independent API contract evolution
- Reduced payload size
- Hides internal domain structure
- Prevents over-fetching
- Better API versioning support

**Negative:**
- Additional mapping code
- Potential for mapping errors
- More classes to maintain
- Slight performance overhead for mapping

---

## ADR-009: Docker Containerization

**Status:** Accepted  
**Date:** 2026-01-07  
**Deciders:** Architecture Team, DevOps Team

### Context

We need a consistent deployment mechanism that works across different environments and cloud providers.

### Decision

We will containerize the application using Docker.

### Consequences

**Positive:**
- Consistent environments (dev, staging, prod)
- Easy deployment and scaling
- Isolation from host system
- Works with container orchestration (ECS, Kubernetes)
- Reproducible builds

**Negative:**
- Additional complexity in build process
- Container image management
- Potential security concerns if not properly configured
- Learning curve for team

---

## ADR-010: AWS ECS for Container Orchestration

**Status:** Accepted  
**Date:** 2026-01-07  
**Deciders:** Architecture Team, DevOps Team

### Context

We need a container orchestration platform that integrates well with AWS services and provides managed infrastructure.

### Decision

We will use AWS ECS (Elastic Container Service) for container orchestration.

### Consequences

**Positive:**
- Native AWS integration
- Managed service (less operational overhead)
- Auto-scaling capabilities
- Integration with ALB, RDS, Secrets Manager
- Cost-effective for AWS-native applications

**Negative:**
- Vendor lock-in to AWS
- Less flexible than Kubernetes
- Learning curve for ECS-specific concepts
- Limited portability to other clouds

---

## ADR-011: AWS RDS for Database Management

**Status:** Accepted  
**Date:** 2026-01-07  
**Deciders:** Architecture Team, DevOps Team

### Context

We need a managed database service that handles backups, scaling, and maintenance automatically.

### Decision

We will use AWS RDS (Relational Database Service) for PostgreSQL.

### Consequences

**Positive:**
- Managed backups and point-in-time recovery
- Automatic software patching
- Multi-AZ for high availability
- Read replicas for scaling reads
- Monitoring and alerting integration
- Reduced operational overhead

**Negative:**
- Higher cost than self-managed database
- Less control over database configuration
- Vendor lock-in
- Potential performance limitations compared to self-managed

---

## ADR-012: Redis for Caching

**Status:** Accepted  
**Date:** 2026-01-07  
**Deciders:** Architecture Team

### Context

We need a caching layer to improve performance and reduce database load.

### Decision

We will use Redis for caching frequently accessed data.

### Consequences

**Positive:**
- Fast in-memory caching
- Reduces database load
- Improves response times
- Supports various data structures
- Widely supported and mature

**Negative:**
- Additional infrastructure to manage
- Memory costs
- Cache invalidation complexity
- Potential for stale data
- Additional point of failure

---

## ADR-013: Spring Data JPA for Data Access

**Status:** Accepted  
**Date:** 2026-01-07  
**Deciders:** Architecture Team

### Context

We need an abstraction layer for database access that reduces boilerplate code and provides type-safe queries.

### Decision

We will use Spring Data JPA for data access layer.

### Consequences

**Positive:**
- Reduces boilerplate code significantly
- Type-safe repository interfaces
- Built-in pagination and sorting
- Easy to test with in-memory databases
- Automatic query generation
- Integration with Spring ecosystem

**Negative:**
- Learning curve for JPA concepts
- Potential N+1 query problems
- Less control over generated SQL
- Performance considerations for complex queries
- May require native queries for optimization

---

## ADR-014: Maven as Build Tool

**Status:** Accepted  
**Date:** 2026-01-07  
**Deciders:** Architecture Team

### Context

We need a build tool that manages dependencies, compiles code, and packages the application.

### Decision

We will use Maven as the build tool.

### Consequences

**Positive:**
- Standard Java build tool
- Excellent dependency management
- Large plugin ecosystem
- Well-integrated with IDEs
- Standard project structure
- Good for Spring Boot projects

**Negative:**
- XML-based configuration (verbose)
- Slower than Gradle for large projects
- Less flexible than Gradle
- Steeper learning curve than Gradle

---

## ADR-015: Flyway for Database Migrations

**Status:** Accepted  
**Date:** 2026-01-07  
**Deciders:** Architecture Team, Database Specialist

### Context

We need a database migration tool that manages schema changes and versioning.

### Decision

We will use Flyway for database migrations.

### Consequences

**Positive:**
- Version-controlled schema changes
- Automatic migration execution
- Rollback capabilities
- SQL-based migrations (explicit control)
- Integration with Spring Boot
- Simple and straightforward

**Negative:**
- Requires SQL knowledge
- Manual rollback scripts needed
- Less flexible than programmatic migrations
- Potential for migration conflicts in team environments

---

## ADR-016: Spring Actuator for Monitoring

**Status:** Accepted  
**Date:** 2026-01-07  
**Deciders:** Architecture Team, DevOps Team

### Context

We need health checks and metrics endpoints for monitoring and orchestration.

### Decision

We will use Spring Actuator for health checks and application metrics.

### Consequences

**Positive:**
- Built-in health endpoints
- Metrics collection
- Integration with monitoring tools
- Easy to configure
- Production-ready features
- Works with CloudWatch

**Negative:**
- Additional endpoints to secure
- Potential information disclosure
- Requires configuration for production
- May expose sensitive information if not configured properly

**Update (2026-01-07):** Security hardening implemented - only `/actuator/health` exposed publicly, `/actuator/info` requires authentication, other endpoints disabled in production.

---

## ADR-017: AWS Secrets Manager for Secrets

**Status:** Accepted  
**Date:** 2026-01-07  
**Deciders:** Architecture Team, Security Team

### Context

We need secure storage and management of sensitive configuration like database passwords and JWT secrets.

### Decision

We will use AWS Secrets Manager for storing and retrieving secrets.

### Consequences

**Positive:**
- Secure secret storage
- Automatic secret rotation support
- Integration with ECS
- Audit trail for secret access
- Encryption at rest and in transit
- Centralized secret management

**Negative:**
- AWS-specific solution (vendor lock-in)
- Additional cost
- Requires IAM permissions
- Slight latency for secret retrieval
- Learning curve for team

---

## ADR-018: Stateless Application Design

**Status:** Accepted  
**Date:** 2026-01-07  
**Deciders:** Architecture Team

### Context

We need an application design that supports horizontal scaling and load balancing.

### Decision

We will design the application to be stateless, storing all state in the database.

### Consequences

**Positive:**
- Easy horizontal scaling
- Works with load balancers
- No session affinity required
- Resilient to instance failures
- Simple deployment model

**Negative:**
- More database load
- Cannot use server-side sessions
- Requires external storage for any state
- Potential performance impact

---

## ADR-019: Role-Based Access Control (RBAC)

**Status:** Accepted  
**Date:** 2026-01-07  
**Deciders:** Architecture Team, Security Team

### Context

We need an authorization model that controls access based on user roles.

### Decision

We will implement Role-Based Access Control with ADMIN and USER roles.

### Consequences

**Positive:**
- Simple and understandable model
- Easy to implement and maintain
- Clear permission boundaries
- Scalable to add more roles
- Standard security pattern

**Negative:**
- May become complex with many roles
- Less flexible than attribute-based access control
- Role explosion problem if not managed
- May require refactoring for complex permissions

---

## ADR-020: JSON for Request/Response Format

**Status:** Accepted  
**Date:** 2026-01-07  
**Deciders:** Architecture Team

### Context

We need a data interchange format that is human-readable, widely supported, and efficient.

### Decision

We will use JSON as the exclusive format for API requests and responses.

### Consequences

**Positive:**
- Human-readable format
- Widely supported by clients
- Language-agnostic
- Easy to parse and generate
- Standard HTTP content type
- Good tooling support

**Negative:**
- Less compact than binary formats
- No schema validation (without additional tools)
- Potential security issues (JSON injection)
- Slower than binary formats for large payloads

---

## Decision Log

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| ADR-001 | Layered Architecture Pattern | Accepted | 2026-01-07 |
| ADR-002 | Spring Boot 3 Framework | Accepted | 2026-01-07 |
| ADR-003 | PostgreSQL Database | Accepted | 2026-01-07 |
| ADR-004 | RESTful API Design | Accepted | 2026-01-07 |
| ADR-005 | JWT Authentication | Accepted | 2026-01-07 |
| ADR-006 | URL-Based API Versioning | Accepted | 2026-01-07 |
| ADR-007 | Soft Delete Pattern | Accepted | 2026-01-07 |
| ADR-008 | DTO Pattern for API Responses | Accepted | 2026-01-07 |
| ADR-009 | Docker Containerization | Accepted | 2026-01-07 |
| ADR-010 | AWS ECS for Container Orchestration | Accepted | 2026-01-07 |
| ADR-011 | AWS RDS for Database Management | Accepted | 2026-01-07 |
| ADR-012 | Redis for Caching | Accepted | 2026-01-07 |
| ADR-013 | Spring Data JPA for Data Access | Accepted | 2026-01-07 |
| ADR-014 | Maven as Build Tool | Accepted | 2026-01-07 |
| ADR-015 | Flyway for Database Migrations | Accepted | 2026-01-07 |
| ADR-016 | Spring Actuator for Monitoring | Accepted | 2026-01-07 |
| ADR-017 | AWS Secrets Manager for Secrets | Accepted | 2026-01-07 |
| ADR-018 | Stateless Application Design | Accepted | 2026-01-07 |
| ADR-019 | Role-Based Access Control | Accepted | 2026-01-07 |
| ADR-020 | JSON for Request/Response Format | Accepted | 2026-01-07 |
| ADR-021 | Token Revocation via Redis Blacklist | Accepted | 2026-01-07 |
| ADR-022 | Multi-Layer Rate Limiting | Accepted | 2026-01-07 |
| ADR-023 | Enhanced Password Policy | Accepted | 2026-01-07 |
| ADR-024 | Data Retention Policy for Soft Delete | Accepted | 2026-01-07 |
| ADR-025 | Security Headers Implementation | Accepted | 2026-01-07 |
| ADR-026 | Request Size Limits | Accepted | 2026-01-07 |

---

## ADR-021: Token Revocation via Redis Blacklist

**Status:** Accepted  
**Date:** 2026-01-07  
**Deciders:** Architecture Team, Security Team

### Context

JWT tokens cannot be revoked before expiration without a mechanism to track revoked tokens. This creates a security risk if a token is compromised or a user account is deleted.

### Decision

We will implement token revocation using a Redis-based blacklist. When a token is revoked (via logout or security incident), it will be added to Redis with a TTL matching the token's expiration time.

### Consequences

**Positive:**
- Immediate token invalidation capability
- Maintains stateless design (Redis is external state)
- Supports security incident response
- GDPR compliance for right to be forgotten
- Minimal performance impact (single Redis lookup)

**Negative:**
- Additional Redis dependency for authentication
- Requires Redis availability for token validation
- Slight latency increase for token validation

---

## ADR-022: Multi-Layer Rate Limiting

**Status:** Accepted  
**Date:** 2026-01-07  
**Deciders:** Architecture Team, Security Team

### Context

The system lacks rate limiting, making it vulnerable to brute force attacks, DDoS, and resource exhaustion. We need protection at multiple layers.

### Decision

We will implement multi-layer rate limiting:
1. **WAF Level**: Edge rate limiting via AWS WAF for DDoS protection
2. **Application Level**: Redis-based rate limiting per user/IP for fine-grained control
3. **Endpoint-Specific**: Different limits for authentication endpoints (5 req/min) vs. general endpoints (100 req/min per user)

### Consequences

**Positive:**
- Protection against brute force attacks
- DDoS mitigation at edge
- Resource exhaustion prevention
- Configurable per endpoint type
- Redis-based solution is scalable

**Negative:**
- Additional Redis dependency
- Configuration complexity
- Potential false positives blocking legitimate users
- Requires monitoring and tuning

---

## ADR-023: Enhanced Password Policy

**Status:** Accepted  
**Date:** 2026-01-07  
**Deciders:** Architecture Team, Security Team

### Context

The initial password policy only specified minimum length (8 characters). This is insufficient to prevent weak passwords and account compromise.

### Decision

We will implement an enhanced password policy with:
- Minimum 8 characters
- Password complexity requirements (uppercase, lowercase, number, special character)
- Account lockout after 5 failed attempts
- Password history (prevent reuse of last 5 passwords)
- Password expiration: 90 days (configurable)

### Consequences

**Positive:**
- Stronger password security
- Protection against brute force attacks
- Compliance with security best practices
- Reduced risk of account compromise

**Negative:**
- More complex password requirements may frustrate users
- Account lockout may cause support burden
- Password expiration may lead to weaker passwords if users increment numbers
- Additional database fields and logic required

---

## ADR-024: Data Retention Policy for Soft Delete

**Status:** Accepted  
**Date:** 2026-01-07  
**Deciders:** Architecture Team, Security Team, Compliance Team

### Context

Soft delete preserves data indefinitely, which may violate data retention requirements and GDPR compliance. Deleted data should be purged after a retention period.

### Decision

We will implement a data retention policy:
- Retention period: 7 years (compliance requirement)
- Automated purging job for records beyond retention period
- Encryption for deleted records before purging
- Audit logging for all deleted record access

### Consequences

**Positive:**
- GDPR compliance (right to be forgotten)
- Compliance with data retention regulations
- Reduced storage costs over time
- Enhanced security for deleted sensitive data

**Negative:**
- Irreversible data loss after retention period
- Additional complexity in data management
- Requires careful scheduling of purging jobs
- Potential impact on audit trails

---

## ADR-025: Security Headers Implementation

**Status:** Accepted  
**Date:** 2026-01-07  
**Deciders:** Architecture Team, Security Team

### Context

Security headers protect against common web vulnerabilities like XSS, clickjacking, and MIME sniffing. These headers were not explicitly configured.

### Decision

We will implement security headers in all HTTP responses:
- `Content-Security-Policy`: Restrict resource loading
- `X-Frame-Options: DENY`: Prevent clickjacking
- `X-Content-Type-Options: nosniff`: Prevent MIME sniffing
- `Strict-Transport-Security`: Enforce HTTPS
- `X-XSS-Protection`: Enable XSS filtering

### Consequences

**Positive:**
- Protection against common web vulnerabilities
- Defense-in-depth security approach
- Compliance with security best practices
- Minimal performance impact

**Negative:**
- Content-Security-Policy may require careful configuration
- Strict-Transport-Security requires HTTPS (already implemented)
- Headers must be maintained and updated

---

## ADR-026: Request Size Limits

**Status:** Accepted  
**Date:** 2026-01-07  
**Deciders:** Architecture Team, Security Team

### Context

The system lacks explicit request size limits, making it vulnerable to large payload attacks that could cause memory exhaustion and denial of service.

### Decision

We will implement request size limits:
- Maximum request body size: 1MB
- Field length validation enforced at API level
- Rejection of oversized requests with HTTP 413 Payload Too Large

### Consequences

**Positive:**
- Protection against memory exhaustion attacks
- Denial of service prevention
- Clear error responses for oversized requests
- Resource usage control

**Negative:**
- May limit legitimate use cases requiring large payloads
- Requires careful tuning of limits
- May need different limits for different endpoints
