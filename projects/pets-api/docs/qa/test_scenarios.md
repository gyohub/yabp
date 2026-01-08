# Test Scenarios: Pets API

This document provides detailed test scenarios for manual and automated testing of the Pets API.

## Authentication Scenarios

### Registration

| Scenario | Steps | Expected Result |
|----------|-------|----------------|
| Successful registration | 1. POST `/api/v1/auth/register` with valid data | 201 Created, user object returned |
| Duplicate username | 1. Register user<br>2. Register again with same username | 409 Conflict |
| Duplicate email | 1. Register user<br>2. Register again with same email | 409 Conflict |
| Invalid email format | 1. POST register with invalid email | 400 Bad Request |
| Weak password | 1. POST register with password < 8 chars | 400 Bad Request |
| Missing required fields | 1. POST register with missing fields | 400 Bad Request |

### Login

| Scenario | Steps | Expected Result |
|----------|-------|----------------|
| Successful login | 1. POST `/api/v1/auth/login` with valid credentials | 200 OK, JWT token returned |
| Invalid username | 1. POST login with non-existent username | 401 Unauthorized |
| Invalid password | 1. POST login with wrong password | 401 Unauthorized |
| Missing credentials | 1. POST login without body | 400 Bad Request |

### Logout

| Scenario | Steps | Expected Result |
|----------|-------|----------------|
| Successful logout | 1. Login<br>2. POST `/api/v1/auth/logout` with token<br>3. Use token in request | 200 OK, token invalidated |
| Logout without token | 1. POST logout without Authorization header | 200 OK (no-op) |

## Pet Management Scenarios

### Create Pet

| Scenario | Steps | Expected Result |
|----------|-------|----------------|
| Successful creation | 1. Login<br>2. POST `/api/v1/pets` with valid data | 201 Created, pet object returned |
| Invalid date range | 1. POST pet with birthDate > adoptionDate | 400 Bad Request |
| Missing required fields | 1. POST pet with missing fields | 400 Bad Request |
| Unauthenticated request | 1. POST pet without token | 401 Unauthorized |

### List Pets

| Scenario | Steps | Expected Result |
|----------|-------|----------------|
| List user's pets | 1. Login as user<br>2. Create pets<br>3. GET `/api/v1/pets` | 200 OK, only user's pets returned |
| Admin sees all pets | 1. Login as admin<br>2. GET `/api/v1/pets` | 200 OK, all pets returned |
| Pagination | 1. Create 10 pets<br>2. GET with page=0&size=5 | 200 OK, 5 pets, totalElements=10 |
| Filter by name | 1. Create pets with different names<br>2. GET with name filter | 200 OK, filtered results |
| Include deleted | 1. Delete pet<br>2. GET with includeDeleted=true | 200 OK, deleted pet included |

### Get Pet

| Scenario | Steps | Expected Result |
|----------|-------|----------------|
| Get own pet | 1. Login as user<br>2. Create pet<br>3. GET `/api/v1/pets/{id}` | 200 OK, pet returned |
| Get another user's pet | 1. Login as user1<br>2. Create pet<br>3. Login as user2<br>4. GET pet | 403 Forbidden |
| Admin gets any pet | 1. Login as admin<br>2. GET any pet ID | 200 OK, pet returned |
| Pet not found | 1. GET non-existent pet ID | 404 Not Found |

### Update Pet

| Scenario | Steps | Expected Result |
|----------|-------|----------------|
| Update own pet | 1. Login<br>2. Create pet<br>3. PUT `/api/v1/pets/{id}` | 200 OK, updated pet returned |
| Update another user's pet | 1. Login as user1<br>2. Create pet<br>3. Login as user2<br>4. PUT pet | 403 Forbidden |
| Admin updates any pet | 1. Login as admin<br>2. PUT any pet | 200 OK |
| Invalid data | 1. PUT with invalid date range | 400 Bad Request |

### Delete Pet

| Scenario | Steps | Expected Result |
|----------|-------|----------------|
| Soft delete own pet | 1. Login<br>2. Create pet<br>3. DELETE `/api/v1/pets/{id}`<br>4. GET pets | 204 No Content, pet excluded from list |
| Delete another user's pet | 1. Login as user1<br>2. Create pet<br>3. Login as user2<br>4. DELETE pet | 403 Forbidden |
| Admin deletes any pet | 1. Login as admin<br>2. DELETE any pet | 204 No Content |

## Pet History Scenarios

### Create History

| Scenario | Steps | Expected Result |
|----------|-------|----------------|
| Add history to own pet | 1. Login<br>2. Create pet<br>3. POST `/api/v1/pets/{petId}/history` | 201 Created, history record returned |
| Add history to another user's pet | 1. Login as user1<br>2. Create pet<br>3. Login as user2<br>4. POST history | 403 Forbidden |
| Missing required fields | 1. POST history without date/description | 400 Bad Request |

### List History

| Scenario | Steps | Expected Result |
|----------|-------|----------------|
| List pet history | 1. Login<br>2. Create pet<br>3. Add history records<br>4. GET `/api/v1/pets/{petId}/history` | 200 OK, all history records returned |
| Pagination | 1. Add 10 history records<br>2. GET with page=0&size=5 | 200 OK, paginated results |
| Sort by date | 1. Add history with different dates<br>2. GET with sort=date,desc | 200 OK, sorted by date desc |

### Update History

| Scenario | Steps | Expected Result |
|----------|-------|----------------|
| Update own pet's history | 1. Login<br>2. Create pet and history<br>3. PUT `/api/v1/pets/{petId}/history/{id}` | 200 OK, updated history returned |
| Update another user's pet history | 1. Login as user1<br>2. Create pet and history<br>3. Login as user2<br>4. PUT history | 403 Forbidden |

### Delete History

| Scenario | Steps | Expected Result |
|----------|-------|----------------|
| Delete own pet's history | 1. Login<br>2. Create pet and history<br>3. DELETE `/api/v1/pets/{petId}/history/{id}` | 204 No Content |
| Delete another user's pet history | 1. Login as user1<br>2. Create pet and history<br>3. Login as user2<br>4. DELETE history | 403 Forbidden |

## User Management Scenarios (Admin Only)

### List Users

| Scenario | Steps | Expected Result |
|----------|-------|----------------|
| Admin lists users | 1. Login as admin<br>2. GET `/api/v1/users` | 200 OK, all users returned |
| Regular user lists users | 1. Login as regular user<br>2. GET `/api/v1/users` | 403 Forbidden |
| Pagination | 1. Create multiple users<br>2. GET with pagination | 200 OK, paginated results |

### Get User

| Scenario | Steps | Expected Result |
|----------|-------|----------------|
| Admin gets user | 1. Login as admin<br>2. GET `/api/v1/users/{id}` | 200 OK, user returned |
| Regular user gets user | 1. Login as regular user<br>2. GET `/api/v1/users/{id}` | 403 Forbidden |

### Update User

| Scenario | Steps | Expected Result |
|----------|-------|----------------|
| Admin updates user | 1. Login as admin<br>2. PUT `/api/v1/users/{id}` | 200 OK, updated user returned |
| Change user role | 1. Login as admin<br>2. PUT user with role=ADMIN | 200 OK, role updated |

### Delete User

| Scenario | Steps | Expected Result |
|----------|-------|----------------|
| Admin deletes user | 1. Login as admin<br>2. DELETE `/api/v1/users/{id}` | 204 No Content |
| Cannot delete last admin | 1. Login as admin<br>2. Try to delete only admin | 400 Bad Request |

## Security Scenarios

### Rate Limiting

| Scenario | Steps | Expected Result |
|----------|-------|----------------|
| Rate limit exceeded | 1. Send 6 requests/minute to auth endpoint | 429 Too Many Requests |
| Rate limit headers | 1. Send request<br>2. Check response headers | X-RateLimit-* headers present |

### Token Security

| Scenario | Steps | Expected Result |
|----------|-------|----------------|
| Expired token | 1. Use expired token | 401 Unauthorized |
| Tampered token | 1. Modify token payload<br>2. Use modified token | 401 Unauthorized |
| Token without Bearer prefix | 1. Send token without "Bearer " prefix | 401 Unauthorized |

## Performance Scenarios

### Response Time

| Endpoint | Target | Measurement |
|----------|--------|-------------|
| POST `/api/v1/auth/login` | < 200ms | Average response time |
| GET `/api/v1/pets` | < 300ms | Average response time |
| POST `/api/v1/pets` | < 300ms | Average response time |

### Load Testing

| Scenario | Load | Expected Result |
|----------|------|----------------|
| Concurrent users | 100 concurrent users | All requests succeed |
| Requests per minute | 1000 req/min per endpoint | Rate limiting applied correctly |

## Error Handling Scenarios

### Validation Errors

| Scenario | Steps | Expected Result |
|----------|-------|----------------|
| Field validation | 1. POST with invalid field value | 400 Bad Request, details array |
| Multiple validation errors | 1. POST with multiple invalid fields | 400 Bad Request, all errors listed |

### Not Found Errors

| Scenario | Steps | Expected Result |
|----------|-------|----------------|
| Resource not found | 1. GET non-existent resource | 404 Not Found |
| Soft-deleted resource | 1. GET deleted pet without includeDeleted | 404 Not Found |

### Authorization Errors

| Scenario | Steps | Expected Result |
|----------|-------|----------------|
| Insufficient permissions | 1. Regular user accesses admin endpoint | 403 Forbidden |
| Access another user's resource | 1. User accesses another user's pet | 403 Forbidden |
