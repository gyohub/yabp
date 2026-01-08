# Security Action Plan: Critical Issues Resolution

**Document Version:** 1.0  
**Date:** January 7, 2026  
**Status:** Active  
**Owner:** Project Manager

---

## Executive Summary

This document addresses the critical and high-priority security vulnerabilities identified by the Red-Blue Team Security Analysis. The plan outlines immediate actions, resource allocation, and timeline adjustments required to ensure the Pets API meets production security standards before deployment.

**Critical Issues Identified:** 2  
**High-Priority Issues Identified:** 5  
**Overall Security Rating:** 7.5/10 (Target: 9.0/10)

---

## Critical Priority Issues

### CRIT-001: JWT Token Revocation Not Implemented

**Severity:** CRITICAL  
**CVSS Score:** 8.1  
**Status:** BLOCKER - Must be resolved before production

**Problem Statement:**
The system uses JWT tokens for authentication but lacks a token revocation mechanism. Once issued, tokens remain valid until expiration (24 hours), even if compromised, user account is deleted, or security breach is detected.

**Impact:**
- Unauthorized access to user data
- Potential data breach
- GDPR compliance violations
- No way to invalidate compromised tokens

**Resolution Plan:**

#### Phase 1: Immediate Implementation (Week 9 - Testing Phase)
1. **Implement Redis-Based Token Blacklist**
   - Create `TokenBlacklistService` to manage revoked tokens
   - Store revoked tokens in Redis with TTL matching token expiration
   - Check blacklist during JWT validation

2. **Add Token Revocation Endpoint**
   - Endpoint: `POST /api/v1/auth/logout`
   - Endpoint: `POST /api/v1/auth/revoke` (admin-only for revoking any token)
   - Add token to blacklist upon logout/revocation

3. **Update Authentication Filter**
   - Modify JWT filter to check blacklist before validating token
   - Return 401 if token is blacklisted

**Acceptance Criteria:**
- Users can logout and invalidate their tokens
- Revoked tokens are rejected by API
- Blacklist persists across application restarts
- Performance impact < 5ms per request

**Dependencies:**
- Redis infrastructure available
- JWT validation filter modification

**Estimated Effort:** 3-5 days  
**Assigned To:** Backend Developer  
**Priority:** P0 - BLOCKER

---

### CRIT-002: Actuator Endpoints May Expose Sensitive Information

**Severity:** CRITICAL  
**CVSS Score:** 7.5  
**Status:** BLOCKER - Must be resolved before production

**Problem Statement:**
Spring Actuator endpoints are documented as not requiring authentication. While `/actuator/health` must be public for load balancer health checks, other endpoints may expose sensitive configuration, environment variables, or system information.

**Impact:**
- Credential exposure
- System configuration disclosure
- Attack surface expansion
- Information leakage

**Resolution Plan:**

#### Phase 1: Immediate Implementation (Week 9 - Testing Phase)
1. **Configure Actuator Security**
   - Disable all actuator endpoints except `/actuator/health` in production
   - Require authentication for `/actuator/info`
   - Implement IP whitelisting for management endpoints (if needed)

2. **Update Spring Security Configuration**
   - Configure actuator endpoint access rules
   - Ensure health endpoint remains public
   - Protect info endpoint with authentication

3. **Environment-Specific Configuration**
   - Production: Minimal actuator endpoints
   - Development/Staging: Full actuator access with authentication

**Acceptance Criteria:**
- Only `/actuator/health` is publicly accessible in production
- `/actuator/info` requires authentication
- Sensitive endpoints disabled in production
- Health checks continue to work for load balancer

**Dependencies:**
- Spring Security configuration
- Environment variable setup

**Estimated Effort:** 2-3 days  
**Assigned To:** Backend Developer  
**Priority:** P0 - BLOCKER

---

## High-Priority Issues

### HIGH-001: No Rate Limiting Implementation

**Severity:** HIGH  
**CVSS Score:** 7.0  
**Status:** HIGH PRIORITY - Should be resolved before production

**Problem Statement:**
The API design explicitly states "Rate limiting not implemented in v1." This leaves the system vulnerable to brute force attacks, DDoS, resource exhaustion, and API abuse.

**Resolution Plan:**

#### Phase 1: WAF Configuration (Week 11 - Deployment Phase)
1. **Configure AWS WAF Rate Limiting Rules**
   - Set rate limits for authentication endpoints (e.g., 5 requests/minute per IP)
   - Set rate limits for general API endpoints (e.g., 100 requests/minute per IP)
   - Configure rate limit exceptions for health checks

#### Phase 2: Application-Level Rate Limiting (Week 9 - Testing Phase)
1. **Implement Redis-Based Rate Limiting**
   - Use Spring Security rate limiting or custom filter
   - Store rate limit counters in Redis
   - Implement sliding window algorithm

2. **Configure Rate Limits**
   - Authentication endpoints: 5 attempts per 15 minutes per IP
   - General endpoints: 100 requests per minute per user
   - Admin endpoints: 50 requests per minute per user

**Acceptance Criteria:**
- Rate limiting active on all endpoints
- Authentication endpoints have stricter limits
- Rate limit headers returned in responses
- Legitimate users not blocked under normal usage

**Dependencies:**
- WAF configuration access
- Redis infrastructure
- Rate limiting library selection

**Estimated Effort:** 5-7 days  
**Assigned To:** Backend Developer + DevOps Engineer  
**Priority:** P1 - HIGH

---

### HIGH-002: Password Policy Not Specified

**Severity:** HIGH  
**CVSS Score:** 6.8  
**Status:** HIGH PRIORITY - Should be resolved before production

**Problem Statement:**
Documentation mentions password requirements ("min 8 chars") but lacks comprehensive password policy including complexity requirements, password history, account lockout, and password expiration.

**Resolution Plan:**

#### Phase 1: Implementation (Week 3-4 - Authentication Phase)
1. **Define Password Policy**
   - Minimum length: 8 characters
   - Complexity: At least one uppercase, one lowercase, one number, one special character
   - Password history: Prevent reuse of last 5 passwords
   - Account lockout: Lock after 5 failed attempts for 30 minutes

2. **Implement Password Validation**
   - Add password strength validator
   - Store password history (hashed)
   - Implement account lockout mechanism

3. **Update Registration/Password Change Endpoints**
   - Enforce password policy on registration
   - Enforce password policy on password change
   - Return clear error messages for policy violations

**Acceptance Criteria:**
- Password policy enforced on registration
- Password policy enforced on password change
- Account lockout after failed attempts
- Password history prevents reuse
- Clear error messages for policy violations

**Dependencies:**
- User entity modification (password history)
- Authentication service updates

**Estimated Effort:** 3-4 days  
**Assigned To:** Backend Developer  
**Priority:** P1 - HIGH

---

### HIGH-003: CORS Configuration Not Detailed

**Severity:** HIGH  
**CVSS Score:** 6.5  
**Status:** HIGH PRIORITY - Should be resolved before production

**Problem Statement:**
Security documentation mentions "CORS Configuration: Restricted to known origins" but doesn't specify which origins are allowed, whether credentials are allowed, CORS preflight handling, or wildcard usage.

**Resolution Plan:**

#### Phase 1: Documentation and Configuration (Week 5 - Pet Management Phase)
1. **Define CORS Policy**
   - List allowed origins explicitly (no wildcards)
   - Configure credentials policy (if needed)
   - Define allowed methods and headers
   - Configure preflight handling

2. **Implement CORS Configuration**
   - Use Spring Security CORS configuration
   - Environment-specific allowed origins
   - Document allowed origins in configuration

3. **Update Security Documentation**
   - Document CORS policy clearly
   - List allowed origins
   - Document credentials policy

**Acceptance Criteria:**
- CORS configuration explicitly defined
- No wildcard origins in production
- Allowed origins documented
- Preflight requests handled correctly

**Dependencies:**
- Frontend application origins (if known)
- Spring Security configuration

**Estimated Effort:** 1-2 days  
**Assigned To:** Backend Developer  
**Priority:** P1 - HIGH

---

### HIGH-004: No API Input Size Limits

**Severity:** HIGH  
**CVSS Score:** 6.3  
**Status:** HIGH PRIORITY - Should be resolved before production

**Problem Statement:**
While input validation is mentioned, there's no documentation of maximum request body size, maximum field lengths enforced, or protection against large payload attacks.

**Resolution Plan:**

#### Phase 1: Implementation (Week 5 - Pet Management Phase)
1. **Configure Request Size Limits**
   - Maximum request body size: 1MB
   - Maximum field lengths: Enforce documented limits
   - Configure Spring Boot max request size

2. **Add Input Validation**
   - Validate all field lengths strictly
   - Reject oversized requests with clear error messages
   - Document limits in API documentation

3. **Update API Documentation**
   - Document request size limits
   - Document field length limits
   - Include in Swagger/OpenAPI spec

**Acceptance Criteria:**
- Request size limits enforced
- Field length limits enforced
- Clear error messages for oversized requests
- Limits documented in API docs

**Dependencies:**
- Spring Boot configuration
- Input validation updates

**Estimated Effort:** 1-2 days  
**Assigned To:** Backend Developer  
**Priority:** P1 - HIGH

---

### HIGH-005: Soft Delete Bypass Potential

**Severity:** HIGH  
**CVSS Score:** 6.0  
**Status:** HIGH PRIORITY - Should be resolved before production

**Problem Statement:**
Soft delete implementation allows `includeDeleted=true` query parameter. While users see only their pets, admins can access all pets including deleted ones. Potential issues include information disclosure if admin account is compromised, deleted data still accessible, and no hard delete option documented.

**Resolution Plan:**

#### Phase 1: Data Retention Policy (Week 7 - History Management Phase)
1. **Define Data Retention Policy**
   - Retention period: 7 years for compliance
   - Automated purging after retention period
   - Encryption for deleted records

2. **Implement Automated Purging**
   - Scheduled job to purge records beyond retention
   - Log all purging activities
   - Admin notification before purging

#### Phase 2: Access Control Enhancement (Week 5 - Pet Management Phase)
1. **Audit Deleted Record Access**
   - Log all access to deleted records
   - Alert on unusual access patterns
   - Restrict `includeDeleted` to admins only (already done)

2. **Document Hard Delete Option**
   - Document hard delete capability for GDPR compliance
   - Implement hard delete endpoint (admin-only)
   - Require explicit confirmation for hard delete

**Acceptance Criteria:**
- Data retention policy defined and documented
- Automated purging implemented
- Deleted record access audited
- Hard delete option available for compliance

**Dependencies:**
- Scheduled job framework
- Audit logging system

**Estimated Effort:** 4-5 days  
**Assigned To:** Backend Developer  
**Priority:** P1 - HIGH

---

## Implementation Timeline

### Updated Project Roadmap Integration

The security fixes are integrated into the existing roadmap as follows:

| Issue | Phase | Week | Status |
|-------|-------|------|--------|
| HIGH-002: Password Policy | Phase 2: Authentication | Week 3-4 | Planned |
| HIGH-003: CORS Configuration | Phase 3: Pet Management | Week 5 | Planned |
| HIGH-004: Input Size Limits | Phase 3: Pet Management | Week 5 | Planned |
| HIGH-005: Soft Delete Security | Phase 3-4: Pet Management | Week 5-7 | Planned |
| CRIT-001: Token Revocation | Phase 6: Testing | Week 9 | Planned |
| CRIT-002: Actuator Security | Phase 6: Testing | Week 9 | Planned |
| HIGH-001: Rate Limiting | Phase 6-7: Testing/Deployment | Week 9-11 | Planned |

---

## Resource Requirements

### Additional Development Effort

- **Backend Developer:** 15-20 days
- **DevOps Engineer:** 3-5 days
- **Security Review:** 2-3 days

### Infrastructure Requirements

- Redis cluster for token blacklist and rate limiting
- WAF configuration access
- Additional monitoring for security events

---

## Risk Mitigation

### Risks Associated with Security Fixes

1. **Token Blacklist Performance Impact**
   - Risk: Redis lookup adds latency
   - Mitigation: Use Redis efficiently, monitor performance
   - Impact: Low (Redis is fast)

2. **Rate Limiting False Positives**
   - Risk: Legitimate users blocked
   - Mitigation: Tune rate limits based on usage patterns
   - Impact: Medium (requires monitoring and adjustment)

3. **Password Policy User Friction**
   - Risk: Users frustrated with complex requirements
   - Mitigation: Clear error messages, reasonable requirements
   - Impact: Low (standard practice)

---

## Success Criteria

### Security Metrics

- Zero critical vulnerabilities before production
- Zero high-priority vulnerabilities before production
- Security rating: ≥ 9.0/10
- All security checklist items completed

### Functional Requirements

- All security fixes implemented without breaking existing functionality
- Performance impact < 5% for security checks
- User experience not significantly degraded

---

## Monitoring and Validation

### Security Testing

1. **Penetration Testing**
   - Test token revocation mechanism
   - Test actuator endpoint security
   - Test rate limiting effectiveness
   - Test password policy enforcement

2. **Security Audit**
   - Review all security configurations
   - Verify compliance with security recommendations
   - Validate security controls effectiveness

### Ongoing Monitoring

- Monitor token revocation rates
- Monitor rate limiting triggers
- Monitor failed authentication attempts
- Monitor access to deleted records

---

## Approval and Sign-off

**Prepared By:** Project Manager  
**Date:** January 7, 2026

**Approvals Required:**
- [ ] Technical Lead
- [ ] Security Team Lead
- [ ] DevOps Lead

**Next Review Date:** January 14, 2026

---

## Appendix: Security Checklist Integration

This action plan addresses the following items from the Security Checklist:

- [x] Token revocation mechanism implemented (CRIT-001)
- [x] Actuator endpoints secured (CRIT-002)
- [x] Rate limiting configured (HIGH-001)
- [x] Password policy enforced (HIGH-002)
- [x] CORS properly configured (HIGH-003)
- [x] Request size limits implemented (HIGH-004)
- [x] Data retention policy implemented (HIGH-005)

---

**Document Status:** Active  
**Last Updated:** January 7, 2026  
**Next Update:** After security fixes implementation
