# API Design: Pets API

## Overview

This document defines the complete API design for the Pets API, including endpoints, request/response formats, error handling, and API versioning strategy.

## API Base Information

- **Base URL**: `https://api.pets.example.com`
- **API Version**: v1
- **Content-Type**: `application/json`
- **Authentication**: Bearer Token (JWT)

## API Versioning

### Version Strategy
- **URL-based versioning**: `/api/v1/`, `/api/v2/`, etc.
- **Current Version**: v1
- **Version Header**: Optional `X-API-Version` header for explicit versioning

### Version Lifecycle
- **v1**: Stable, production-ready
- **v2+**: Future versions with backward compatibility considerations

## Authentication

### Authentication Flow

All endpoints except `/api/v1/auth/*` and `/actuator/*` require authentication.

**Authentication Header:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Token Format:**
- JWT (JSON Web Token)
- Token expiration: Configurable (default: 24 hours)
- Token refresh: Not implemented in v1
- Token revocation: Supported via Redis blacklist (POST /api/v1/auth/logout)

## API Endpoints

### Authentication Endpoints

#### Register User

**Endpoint:** `POST /api/v1/auth/register`

**Description:** Register a new user account

**Request Body:**
```json
{
  "username": "string (required, 3-50 chars, unique)",
  "email": "string (required, valid email format, unique)",
  "password": "string (required, min 8 chars)"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "username": "string",
  "email": "string",
  "role": "USER",
  "createdAt": "2026-01-07T20:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors
- `409 Conflict`: Username or email already exists

---

#### Login

**Endpoint:** `POST /api/v1/auth/login`

**Description:** Authenticate user and receive JWT token

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Response:** `200 OK`
```json
{
  "token": "jwt_token_string",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "role": "USER"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing credentials
- `401 Unauthorized`: Invalid credentials

---

#### Logout

**Endpoint:** `POST /api/v1/auth/logout`

**Description:** Logout current user and revoke JWT token. Token is added to Redis blacklist and will be rejected for all subsequent requests until expiration.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully",
  "tokenRevoked": true
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token

**Security Notes:**
- Token is immediately invalidated via Redis blacklist
- Blacklist entry has TTL matching token expiration time
- All subsequent requests with revoked token will be rejected

---

### User Management Endpoints

#### List Users

**Endpoint:** `GET /api/v1/users`

**Description:** List all users (Admin only)

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: integer (default: 0)
- `size`: integer (default: 20, max: 100)
- `sort`: string (default: "createdAt,desc")

**Response:** `200 OK`
```json
{
  "content": [
    {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "role": "ADMIN|USER",
      "createdAt": "2026-01-07T20:00:00Z",
      "updatedAt": "2026-01-07T20:00:00Z"
    }
  ],
  "page": {
    "number": 0,
    "size": 20,
    "totalElements": 100,
    "totalPages": 5
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions (non-admin)

---

#### Get User

**Endpoint:** `GET /api/v1/users/{id}`

**Description:** Get user by ID (Admin only)

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `id`: uuid (required)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "username": "string",
  "email": "string",
  "role": "ADMIN|USER",
  "createdAt": "2026-01-07T20:00:00Z",
  "updatedAt": "2026-01-07T20:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found

---

#### Update User

**Endpoint:** `PUT /api/v1/users/{id}`

**Description:** Update user information (Admin only)

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `id`: uuid (required)

**Request Body:**
```json
{
  "username": "string (optional)",
  "email": "string (optional, valid email format)",
  "role": "ADMIN|USER (optional)"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "username": "string",
  "email": "string",
  "role": "ADMIN|USER",
  "createdAt": "2026-01-07T20:00:00Z",
  "updatedAt": "2026-01-07T20:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found
- `409 Conflict`: Username or email already exists

---

#### Delete User

**Endpoint:** `DELETE /api/v1/users/{id}`

**Description:** Delete user (Admin only). Cannot delete default admin if it's the only user.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `id`: uuid (required)

**Response:** `204 No Content`

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found
- `400 Bad Request`: Cannot delete default admin if it's the only user

---

### Pet Management Endpoints

#### Create Pet

**Endpoint:** `POST /api/v1/pets`

**Description:** Create a new pet record

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "string (required, max 100 chars)",
  "adoptionDate": "date (required, ISO 8601 format: YYYY-MM-DD)",
  "birthDate": "date (required, ISO 8601 format: YYYY-MM-DD)",
  "race": "string (required, max 50 chars)",
  "breed": "string (required, max 100 chars)",
  "dateOfDeath": "date (optional, ISO 8601 format: YYYY-MM-DD)"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "string",
  "adoptionDate": "2020-01-15",
  "birthDate": "2018-05-20",
  "race": "Dog",
  "breed": "Golden Retriever",
  "dateOfDeath": null,
  "userId": "uuid",
  "createdAt": "2026-01-07T20:00:00Z",
  "updatedAt": "2026-01-07T20:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors (e.g., birthDate > adoptionDate)
- `401 Unauthorized`: Missing or invalid token

---

#### List Pets

**Endpoint:** `GET /api/v1/pets`

**Description:** List pets. Users see only their pets. Admins see all pets.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: integer (default: 0)
- `size`: integer (default: 20, max: 100)
- `sort`: string (default: "createdAt,desc")
- `includeDeleted`: boolean (default: false)
- `name`: string (optional, filter by name)

**Response:** `200 OK`
```json
{
  "content": [
    {
      "id": "uuid",
      "name": "string",
      "adoptionDate": "2020-01-15",
      "birthDate": "2018-05-20",
      "race": "Dog",
      "breed": "Golden Retriever",
      "dateOfDeath": null,
      "userId": "uuid",
      "createdAt": "2026-01-07T20:00:00Z",
      "updatedAt": "2026-01-07T20:00:00Z"
    }
  ],
  "page": {
    "number": 0,
    "size": 20,
    "totalElements": 50,
    "totalPages": 3
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token

---

#### Get Pet

**Endpoint:** `GET /api/v1/pets/{id}`

**Description:** Get pet by ID. Users can only access their own pets. Admins can access any pet.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `id`: uuid (required)

**Query Parameters:**
- `includeDeleted`: boolean (default: false)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "string",
  "adoptionDate": "2020-01-15",
  "birthDate": "2018-05-20",
  "race": "Dog",
  "breed": "Golden Retriever",
  "dateOfDeath": null,
  "userId": "uuid",
  "createdAt": "2026-01-07T20:00:00Z",
  "updatedAt": "2026-01-07T20:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: User trying to access another user's pet
- `404 Not Found`: Pet not found or soft-deleted (unless includeDeleted=true)

---

#### Update Pet

**Endpoint:** `PUT /api/v1/pets/{id}`

**Description:** Update pet information. Users can only update their own pets. Admins can update any pet.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `id`: uuid (required)

**Request Body:**
```json
{
  "name": "string (optional)",
  "adoptionDate": "date (optional)",
  "birthDate": "date (optional)",
  "race": "string (optional)",
  "breed": "string (optional)",
  "dateOfDeath": "date (optional, null to clear)"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "string",
  "adoptionDate": "2020-01-15",
  "birthDate": "2018-05-20",
  "race": "Dog",
  "breed": "Golden Retriever",
  "dateOfDeath": null,
  "userId": "uuid",
  "createdAt": "2026-01-07T20:00:00Z",
  "updatedAt": "2026-01-07T20:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: User trying to update another user's pet
- `404 Not Found`: Pet not found or soft-deleted

---

#### Delete Pet

**Endpoint:** `DELETE /api/v1/pets/{id}`

**Description:** Soft delete a pet. Users can only delete their own pets. Admins can delete any pet.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `id`: uuid (required)

**Response:** `204 No Content`

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: User trying to delete another user's pet
- `404 Not Found`: Pet not found or already deleted

---

### Pet History Endpoints

#### Add History Record

**Endpoint:** `POST /api/v1/pets/{petId}/history`

**Description:** Add a history record to a pet. Users can only add history to their own pets. Admins can add history to any pet.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `petId`: uuid (required)

**Request Body:**
```json
{
  "date": "date (required, ISO 8601 format: YYYY-MM-DD)",
  "description": "string (required, max 1000 chars)"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "petId": "uuid",
  "date": "2025-12-15",
  "description": "Annual checkup completed. All vaccinations up to date.",
  "createdAt": "2026-01-07T20:00:00Z",
  "updatedAt": "2026-01-07T20:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: User trying to add history to another user's pet
- `404 Not Found`: Pet not found

---

#### List Pet History

**Endpoint:** `GET /api/v1/pets/{petId}/history`

**Description:** Get all history records for a pet. Users can only access history of their own pets. Admins can access any pet's history.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `petId`: uuid (required)

**Query Parameters:**
- `page`: integer (default: 0)
- `size`: integer (default: 20, max: 100)
- `sort`: string (default: "date,desc")
- `order`: string (optional: "asc" or "desc")

**Response:** `200 OK`
```json
{
  "content": [
    {
      "id": "uuid",
      "petId": "uuid",
      "date": "2025-12-15",
      "description": "Annual checkup completed.",
      "createdAt": "2026-01-07T20:00:00Z",
      "updatedAt": "2026-01-07T20:00:00Z"
    }
  ],
  "page": {
    "number": 0,
    "size": 20,
    "totalElements": 15,
    "totalPages": 1
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: User trying to access another user's pet history
- `404 Not Found`: Pet not found

---

#### Update History Record

**Endpoint:** `PUT /api/v1/pets/{petId}/history/{id}`

**Description:** Update a history record. Users can only update history of their own pets. Admins can update any pet's history.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `petId`: uuid (required)
- `id`: uuid (required)

**Request Body:**
```json
{
  "date": "date (optional)",
  "description": "string (optional)"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "petId": "uuid",
  "date": "2025-12-15",
  "description": "Updated description",
  "createdAt": "2026-01-07T20:00:00Z",
  "updatedAt": "2026-01-07T20:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: User trying to update another user's pet history
- `404 Not Found`: Pet or history record not found

---

#### Delete History Record

**Endpoint:** `DELETE /api/v1/pets/{petId}/history/{id}`

**Description:** Delete a history record. Users can only delete history of their own pets. Admins can delete any pet's history.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `petId`: uuid (required)
- `id`: uuid (required)

**Response:** `204 No Content`

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: User trying to delete another user's pet history
- `404 Not Found`: Pet or history record not found

---

### Health and Monitoring Endpoints

#### Health Check

**Endpoint:** `GET /actuator/health`

**Description:** Check application health status. Does not require authentication.

**Response:** `200 OK`
```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "PostgreSQL",
        "validationQuery": "isValid()"
      }
    },
    "diskSpace": {
      "status": "UP",
      "details": {
        "total": 50000000000,
        "free": 40000000000,
        "threshold": 10000000000
      }
    }
  }
}
```

**Error Response:** `503 Service Unavailable`
```json
{
  "status": "DOWN",
  "components": {
    "db": {
      "status": "DOWN"
    }
  }
}
```

---

#### Application Info

**Endpoint:** `GET /actuator/info`

**Description:** Get application information. Does not require authentication.

**Response:** `200 OK`
```json
{
  "app": {
    "name": "Pets API",
    "version": "1.0.0",
    "description": "RESTful API for pet management"
  }
}
```

---

## Error Handling

### Error Response Format

All error responses follow a consistent format:

```json
{
  "timestamp": "2026-01-07T20:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/v1/pets",
  "details": [
    {
      "field": "birthDate",
      "message": "Birth date must be before adoption date"
    }
  ]
}
```

### HTTP Status Codes

- `200 OK`: Successful GET, PUT requests
- `201 Created`: Successful POST requests
- `204 No Content`: Successful DELETE requests
- `400 Bad Request`: Validation errors, malformed requests
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate username)
- `500 Internal Server Error`: Server errors
- `503 Service Unavailable`: Service unavailable (health check)

### Error Categories

#### Validation Errors (400)
- Missing required fields
- Invalid data format
- Business rule violations (e.g., birthDate > adoptionDate)

#### Authentication Errors (401)
- Missing Authorization header
- Invalid or expired token
- Malformed token

#### Authorization Errors (403)
- User trying to access another user's resource
- Non-admin trying to access admin-only endpoints

#### Not Found Errors (404)
- Resource doesn't exist
- Resource soft-deleted (unless includeDeleted=true)
- Invalid resource ID format

## Pagination

### Pagination Format

All list endpoints support pagination:

**Query Parameters:**
- `page`: Page number (0-indexed, default: 0)
- `size`: Page size (default: 20, max: 100)
- `sort`: Sort criteria (format: "field,direction", default: "createdAt,desc")

**Response Format:**
```json
{
  "content": [...],
  "page": {
    "number": 0,
    "size": 20,
    "totalElements": 100,
    "totalPages": 5
  }
}
```

## Filtering and Sorting

### Filtering

Supported filters vary by endpoint:
- **Pets**: `name` (partial match), `includeDeleted` (boolean)
- **Users**: `role` (ADMIN|USER)
- **History**: `date` (date range), `petId` (implicit from path)

### Sorting

Sort format: `field,direction`
- Direction: `asc` or `desc`
- Multiple sorts: `field1,asc&sort=field2,desc`
- Default: `createdAt,desc`

## Rate Limiting

**Implementation:** Multi-layer rate limiting is implemented for security and resource protection.

### Rate Limiting Strategy

**Layer 1: WAF (Edge)**
- DDoS protection at AWS WAF level
- General traffic rate limiting

**Layer 2: Application Level (Redis-based)**
- Per-endpoint rate limits:
  - **Authentication endpoints** (`/api/v1/auth/*`): 5 requests/minute per IP address
  - **General API endpoints**: 100 requests/minute per authenticated user
  - **Admin endpoints**: 200 requests/minute per admin user

### Rate Limit Headers

Responses include rate limit information:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1641600000
```

### Rate Limit Exceeded Response

**Status:** `429 Too Many Requests`

```json
{
  "timestamp": "2026-01-07T20:00:00Z",
  "status": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 60
}
```

**Headers:**
```
Retry-After: 60
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1641600000
```

## API Documentation

### OpenAPI/Swagger

- **Swagger UI**: `/swagger-ui.html`
- **OpenAPI JSON**: `/v3/api-docs`
- **OpenAPI YAML**: `/v3/api-docs.yaml`

## Best Practices

### Request Best Practices
1. Always include `Content-Type: application/json` header
2. Use proper HTTP methods (GET, POST, PUT, DELETE)
3. Include Authorization header for protected endpoints
4. Validate data before sending requests

### Response Best Practices
1. Always check HTTP status codes
2. Handle error responses appropriately
3. Use pagination for large datasets
4. Cache responses when appropriate

### Security Best Practices
1. Never expose tokens in logs or URLs
2. Use HTTPS in production
3. Implement token refresh mechanism (future)
4. Validate and sanitize all inputs
5. Respect rate limits and implement exponential backoff
6. Revoke tokens immediately when compromised
7. Use strong passwords meeting complexity requirements
8. Monitor for suspicious activity patterns

## Security Enhancements

### Token Revocation
- Tokens can be revoked via `/api/v1/auth/logout` endpoint
- Revoked tokens are stored in Redis blacklist
- Blacklist check performed before token validation
- Supports immediate security incident response

### Request Size Limits
- Maximum request body size: **1MB**
- Field length validation enforced
- Oversized requests rejected with `413 Payload Too Large`

### Security Headers
All responses include security headers:
- `Content-Security-Policy`: Restricts resource loading
- `X-Frame-Options: DENY`: Prevents clickjacking
- `X-Content-Type-Options: nosniff`: Prevents MIME sniffing
- `Strict-Transport-Security`: Enforces HTTPS
- `X-XSS-Protection`: Enables XSS filtering

### Password Policy
- Minimum 8 characters
- Complexity requirements: uppercase, lowercase, number, special character
- Account lockout after 5 failed login attempts
- Password history: cannot reuse last 5 passwords
- Password expiration: 90 days (configurable)

### Actuator Endpoint Security
- `/actuator/health`: Public (for load balancer health checks)
- `/actuator/info`: Requires authentication
- All other actuator endpoints: Disabled in production
