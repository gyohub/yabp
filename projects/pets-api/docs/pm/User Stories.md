# User Stories: Pets API

## Epic 1: User Authentication and Management

### US-001: User Registration
**As a** new user  
**I want to** register an account  
**So that** I can access the Pets API

**Acceptance Criteria:**
- User can register with username, email, and password
- Username and email must be unique
- Password must meet security requirements
- Registration endpoint returns success response
- User receives appropriate error messages for validation failures

**Technical Details:**
- Endpoint: `POST /api/v1/auth/register`
- Request body: `{ "username": string, "email": string, "password": string }`
- Response: `201 Created` with user details (excluding password)

---

### US-002: User Login
**As a** registered user  
**I want to** login to the API  
**So that** I can authenticate and access protected endpoints

**Acceptance Criteria:**
- User can login with username/email and password
- System validates credentials
- System returns JWT token upon successful authentication
- Failed login attempts return appropriate error
- Token expiration is configured

**Technical Details:**
- Endpoint: `POST /api/v1/auth/login`
- Request body: `{ "username": string, "password": string }`
- Response: `200 OK` with `{ "token": string, "expiresIn": number }`

---

### US-003: User Logout
**As a** logged-in user  
**I want to** logout  
**So that** my session is terminated

**Acceptance Criteria:**
- User can logout using their token
- Token is invalidated (if using token blacklist)
- Appropriate success response returned

**Technical Details:**
- Endpoint: `POST /api/v1/auth/logout`
- Headers: `Authorization: Bearer {token}`
- Response: `200 OK`

---

### US-004: Default Admin User Creation
**As a** system administrator  
**I want to** have a default admin user created on system initialization  
**So that** I can initially access and configure the system

**Acceptance Criteria:**
- Default admin user is created on first application startup
- Admin credentials are configurable via environment variables
- Admin user can manage other users
- Admin user can be deleted only if at least one other user exists

**Technical Details:**
- Created via database migration or application startup listener
- Default username: `admin` (configurable)
- Default password: Set via environment variable
- Role: `ADMIN`

---

### US-005: Admin User Management
**As an** admin user  
**I want to** manage other users  
**So that** I can control access to the system

**Acceptance Criteria:**
- Admin can list all users
- Admin can view user details
- Admin can update user information
- Admin can delete users
- Admin cannot delete default admin if it's the only user

**Technical Details:**
- Endpoints: `GET /api/v1/users`, `GET /api/v1/users/{id}`, `PUT /api/v1/users/{id}`, `DELETE /api/v1/users/{id}`
- Requires `ADMIN` role
- Response: `200 OK` or `204 No Content`

---

## Epic 2: Pet Management

### US-006: Create Pet
**As a** authenticated user  
**I want to** create a new pet record  
**So that** I can track pet information

**Acceptance Criteria:**
- User can create a pet with name, adoption date, birth date, race, and breed
- Date of death is optional
- Pet is associated with the authenticated user
- System validates all required fields
- System returns created pet with generated ID
- Appropriate error messages for validation failures

**Technical Details:**
- Endpoint: `POST /api/v1/pets`
- Headers: `Authorization: Bearer {token}`
- Request body: `{ "name": string, "adoptionDate": date, "birthDate": date, "race": string, "breed": string, "dateOfDeath": date? }`
- Response: `201 Created` with pet object

---

### US-007: List Pets
**As a** authenticated user  
**I want to** list all my pets  
**So that** I can see all pets I manage

**Acceptance Criteria:**
- User can retrieve list of their pets
- List excludes soft-deleted pets by default
- List can be filtered and paginated
- Response includes pet basic information
- Admin users can see all pets

**Technical Details:**
- Endpoint: `GET /api/v1/pets`
- Headers: `Authorization: Bearer {token}`
- Query parameters: `?page=number&size=number&includeDeleted=boolean`
- Response: `200 OK` with paginated pet list

---

### US-008: Get Pet Details
**As a** authenticated user  
**I want to** view details of a specific pet  
**So that** I can see complete pet information

**Acceptance Criteria:**
- User can retrieve pet by ID
- User can only access their own pets (unless admin)
- Response includes all pet fields
- Returns 404 if pet not found or not accessible
- Returns 404 if pet is soft-deleted (unless includeDeleted=true)

**Technical Details:**
- Endpoint: `GET /api/v1/pets/{id}`
- Headers: `Authorization: Bearer {token}`
- Query parameters: `?includeDeleted=boolean`
- Response: `200 OK` with pet object or `404 Not Found`

---

### US-009: Update Pet
**As a** authenticated user  
**I want to** update pet information  
**So that** I can keep pet records current

**Acceptance Criteria:**
- User can update pet fields (name, dates, race, breed)
- User can only update their own pets (unless admin)
- System validates updated data
- Cannot update soft-deleted pets
- Returns updated pet information
- Appropriate error messages for validation failures

**Technical Details:**
- Endpoint: `PUT /api/v1/pets/{id}`
- Headers: `Authorization: Bearer {token}`
- Request body: `{ "name": string?, "adoptionDate": date?, "birthDate": date?, "race": string?, "breed": string?, "dateOfDeath": date? }`
- Response: `200 OK` with updated pet object or `404 Not Found`

---

### US-010: Soft Delete Pet
**As a** authenticated user  
**I want to** delete a pet  
**So that** I can remove pets I no longer need, while preserving data

**Acceptance Criteria:**
- User can soft delete their pets
- User can only delete their own pets (unless admin)
- Pet is marked as deleted, not physically removed
- Deleted timestamp is recorded
- Deleted pets are excluded from default queries
- Cannot delete already deleted pets

**Technical Details:**
- Endpoint: `DELETE /api/v1/pets/{id}`
- Headers: `Authorization: Bearer {token}`
- Response: `204 No Content` or `404 Not Found`
- Pet entity: `deleted = true`, `deletedAt = current timestamp`

---

## Epic 3: Pet History Management

### US-011: Add Pet History Record
**As a** authenticated user  
**I want to** add a history record to a pet  
**So that** I can track important events and information about the pet

**Acceptance Criteria:**
- User can add history record with date and description
- User can add multiple history records per pet
- History is associated with specific pet
- User can only add history to their own pets (unless admin)
- System validates required fields
- Returns created history record

**Technical Details:**
- Endpoint: `POST /api/v1/pets/{petId}/history`
- Headers: `Authorization: Bearer {token}`
- Request body: `{ "date": date, "description": string }`
- Response: `201 Created` with history object

---

### US-012: List Pet History
**As a** authenticated user  
**I want to** view all history records for a pet  
**So that** I can see the complete history timeline

**Acceptance Criteria:**
- User can retrieve all history records for a pet
- History records are ordered by date (newest or oldest first)
- User can only access history of their own pets (unless admin)
- Response includes date and description for each record
- Returns empty list if no history exists

**Technical Details:**
- Endpoint: `GET /api/v1/pets/{petId}/history`
- Headers: `Authorization: Bearer {token}`
- Query parameters: `?sort=date&order=asc|desc`
- Response: `200 OK` with history list

---

### US-013: Update Pet History Record
**As a** authenticated user  
**I want to** update a history record  
**So that** I can correct or modify historical information

**Acceptance Criteria:**
- User can update date and/or description of history record
- User can only update history of their own pets (unless admin)
- System validates updated data
- Returns updated history record
- Appropriate error messages for validation failures

**Technical Details:**
- Endpoint: `PUT /api/v1/pets/{petId}/history/{id}`
- Headers: `Authorization: Bearer {token}`
- Request body: `{ "date": date?, "description": string? }`
- Response: `200 OK` with updated history object or `404 Not Found`

---

### US-014: Delete Pet History Record
**As a** authenticated user  
**I want to** delete a history record  
**So that** I can remove incorrect or unwanted history entries

**Acceptance Criteria:**
- User can delete history record
- User can only delete history of their own pets (unless admin)
- History record is physically removed from database
- Returns success response
- Returns 404 if history record not found

**Technical Details:**
- Endpoint: `DELETE /api/v1/pets/{petId}/history/{id}`
- Headers: `Authorization: Bearer {token}`
- Response: `204 No Content` or `404 Not Found`

---

## Epic 4: API Infrastructure

### US-015: API Versioning
**As an** API consumer  
**I want to** access versioned API endpoints  
**So that** I can rely on stable API contracts and migrate to new versions when ready

**Acceptance Criteria:**
- All endpoints are prefixed with version (e.g., `/api/v1/`)
- Version is clearly indicated in URL
- Future versions can be added without breaking existing clients
- Version information is documented

**Technical Details:**
- Base path: `/api/v1/`
- Future versions: `/api/v2/`, `/api/v3/`, etc.
- Version in URL path, not headers

---

### US-016: Health Check Endpoint
**As a** system administrator or monitoring tool  
**I want to** check API health status  
**So that** I can monitor system availability

**Acceptance Criteria:**
- Health endpoint returns system status
- Endpoint does not require authentication
- Returns database connectivity status
- Returns appropriate HTTP status codes

**Technical Details:**
- Endpoint: `GET /actuator/health`
- Response: `200 OK` with `{ "status": "UP" }` or `503 Service Unavailable`
- Uses Spring Actuator

---

### US-017: API Documentation
**As an** API consumer  
**I want to** access API documentation  
**So that** I can understand how to use the API

**Acceptance Criteria:**
- API documentation is available
- Documentation includes all endpoints
- Documentation includes request/response examples
- Documentation includes authentication requirements

**Technical Details:**
- Swagger/OpenAPI documentation
- Endpoint: `GET /swagger-ui.html` or `/api-docs`

---

## User Story Summary

| Epic | Story ID | Story Title | Priority |
|------|----------|-------------|----------|
| Authentication | US-001 | User Registration | High |
| Authentication | US-002 | User Login | High |
| Authentication | US-003 | User Logout | Medium |
| Authentication | US-004 | Default Admin User Creation | High |
| Authentication | US-005 | Admin User Management | Medium |
| Pet Management | US-006 | Create Pet | High |
| Pet Management | US-007 | List Pets | High |
| Pet Management | US-008 | Get Pet Details | High |
| Pet Management | US-009 | Update Pet | High |
| Pet Management | US-010 | Soft Delete Pet | High |
| Pet History | US-011 | Add Pet History Record | High |
| Pet History | US-012 | List Pet History | High |
| Pet History | US-013 | Update Pet History Record | Medium |
| Pet History | US-014 | Delete Pet History Record | Medium |
| Infrastructure | US-015 | API Versioning | High |
| Infrastructure | US-016 | Health Check Endpoint | High |
| Infrastructure | US-017 | API Documentation | Medium |
