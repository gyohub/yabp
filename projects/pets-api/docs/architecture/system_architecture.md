# System Architecture: Pets API

## Overview

The Pets API is a RESTful microservice built on Spring Boot 3, designed to provide pet management capabilities with authentication, versioning, and comprehensive data management features. The system follows a layered architecture pattern with clear separation of concerns.

## Architecture Principles

1. **Separation of Concerns**: Clear boundaries between layers (Controller, Service, Repository)
2. **Stateless Design**: API is stateless, enabling horizontal scaling
3. **Security First**: All endpoints require authentication
4. **API Versioning**: URL-based versioning for backward compatibility
5. **Soft Delete**: Data preservation through soft delete pattern
6. **RESTful Standards**: Adherence to REST principles and HTTP best practices

## System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        WebApp["Web Applications"]
        MobileApp["Mobile Applications"]
        APIClients["API Clients"]
    end
    
    subgraph "API Gateway / Load Balancer"
        ALB["Application Load Balancer"]
        WAF["AWS WAF"]
    end
    
    subgraph "Application Layer"
        subgraph "Spring Boot Application"
            AuthFilter["Authentication Filter"]
            VersionFilter["Version Filter"]
            PetController["Pet Controller"]
            HistoryController["History Controller"]
            UserController["User Controller"]
            AuthController["Auth Controller"]
        end
        
        subgraph "Service Layer"
            PetService["Pet Service"]
            HistoryService["History Service"]
            UserService["User Service"]
            AuthService["Auth Service"]
        end
        
        subgraph "Repository Layer"
            PetRepository["Pet Repository"]
            HistoryRepository["History Repository"]
            UserRepository["User Repository"]
        end
        
        subgraph "Domain Layer"
            PetEntity["Pet Entity"]
            HistoryEntity["History Entity"]
            UserEntity["User Entity"]
        end
    end
    
    subgraph "Data Layer"
        PostgreSQL["PostgreSQL Database"]
        Redis["Redis Cache"]
    end
    
    subgraph "Infrastructure Services"
        SecretsManager["AWS Secrets Manager"]
        CloudWatch["CloudWatch Logs"]
        XRay["AWS X-Ray"]
    end
    
    WebApp --> ALB
    MobileApp --> ALB
    APIClients --> ALB
    ALB --> WAF
    WAF --> AuthFilter
    AuthFilter --> VersionFilter
    VersionFilter --> PetController
    VersionFilter --> HistoryController
    VersionFilter --> UserController
    VersionFilter --> AuthController
    PetController --> PetService
    HistoryController --> HistoryService
    UserController --> UserService
    AuthController --> AuthService
    PetService --> PetRepository
    HistoryService --> HistoryRepository
    UserService --> UserRepository
    AuthService --> UserRepository
    PetRepository --> PetEntity
    HistoryRepository --> HistoryEntity
    UserRepository --> UserEntity
    PetEntity --> PostgreSQL
    HistoryEntity --> PostgreSQL
    UserEntity --> PostgreSQL
    AuthService --> Redis
    PetService --> Redis
    PetService --> SecretsManager
    UserService --> SecretsManager
    PetService --> CloudWatch
    UserService --> CloudWatch
    PetService --> XRay
    UserService --> XRay
```

## Layered Architecture

### Presentation Layer (Controllers)

**Responsibilities:**
- Handle HTTP requests and responses
- Request validation
- Response serialization
- Error handling
- API version routing

**Components:**
- `PetController`: Pet CRUD operations
- `HistoryController`: Pet history management
- `UserController`: User management (admin)
- `AuthController`: Authentication endpoints

### Service Layer

**Responsibilities:**
- Business logic implementation
- Transaction management
- Data transformation (Entity ↔ DTO)
- Authorization checks
- Caching coordination

**Components:**
- `PetService`: Pet business logic
- `HistoryService`: History business logic
- `UserService`: User management logic
- `AuthService`: Authentication and token management

### Repository Layer

**Responsibilities:**
- Data access abstraction
- Query execution
- Soft delete filtering
- Database-specific optimizations

**Components:**
- `PetRepository`: Pet data access
- `HistoryRepository`: History data access
- `UserRepository`: User data access

### Domain Layer

**Responsibilities:**
- Entity definitions
- Domain validation
- Business rules enforcement
- Relationships management

**Components:**
- `Pet`: Pet entity with soft delete support
- `PetHistory`: History entity
- `User`: User entity with role-based access

## Component Interaction Diagram

```mermaid
sequenceDiagram
    participant Client
    participant ALB
    participant AuthFilter
    participant Controller
    participant Service
    participant Repository
    participant Database
    participant Cache
    
    Client->>ALB: HTTP Request
    ALB->>AuthFilter: Forward Request
    AuthFilter->>AuthFilter: Validate JWT Token
    alt Token Invalid
        AuthFilter-->>Client: 401 Unauthorized
    else Token Valid
        AuthFilter->>Controller: Route Request
        Controller->>Controller: Validate Input
        Controller->>Service: Execute Business Logic
        Service->>Cache: Check Cache
        alt Cache Hit
            Cache-->>Service: Cached Data
        else Cache Miss
            Service->>Repository: Query Data
            Repository->>Database: Execute Query
            Database-->>Repository: Result Set
            Repository-->>Service: Entity Objects
            Service->>Cache: Store in Cache
        end
        Service->>Service: Apply Business Rules
        Service-->>Controller: DTO Objects
        Controller-->>ALB: JSON Response
        ALB-->>Client: HTTP Response
    end
```

## Data Flow Architecture

```mermaid
graph LR
    subgraph "Request Flow"
        R1["HTTP Request"] --> R2["Load Balancer"]
        R2 --> R3["WAF"]
        R3 --> R4["Auth Filter"]
        R4 --> R5["Controller"]
        R5 --> R6["Service"]
        R6 --> R7["Repository"]
        R7 --> R8["Database"]
    end
    
    subgraph "Response Flow"
        D1["Database"] --> D2["Repository"]
        D2 --> D3["Service"]
        D3 --> D4["DTO Mapping"]
        D4 --> D5["Controller"]
        D5 --> D6["JSON Serialization"]
        D6 --> D7["HTTP Response"]
    end
    
    R8 --> D1
```

## Security Architecture

### Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant AuthService
    participant UserRepository
    participant Database
    
    Client->>AuthController: POST /api/v1/auth/login
    AuthController->>AuthService: authenticate(username, password)
    AuthService->>UserRepository: findByUsername(username)
    UserRepository->>Database: SELECT user
    Database-->>UserRepository: User entity
    UserRepository-->>AuthService: User entity
    AuthService->>AuthService: validatePassword(password, hash)
    alt Valid Credentials
        AuthService->>AuthService: generateJWT(user)
        AuthService-->>AuthController: JWT Token
        AuthController-->>Client: 200 OK + Token
    else Invalid Credentials
        AuthService-->>AuthController: AuthenticationException
        AuthController-->>Client: 401 Unauthorized
    end
```

### Authorization Flow

```mermaid
sequenceDiagram
    participant Client
    participant AuthFilter
    participant TokenBlacklist["Token Blacklist<br/>(Redis)"]
    participant Controller
    participant Service
    
    Client->>AuthFilter: Request + JWT Token
    AuthFilter->>AuthFilter: Extract Token
    AuthFilter->>TokenBlacklist: Check if Token Revoked
    TokenBlacklist-->>AuthFilter: Token Status
    alt Token Revoked
        AuthFilter-->>Client: 401 Unauthorized
    else Token Not Revoked
        AuthFilter->>AuthFilter: Validate Token
        AuthFilter->>AuthFilter: Extract User Info
        alt Token Valid
            AuthFilter->>Controller: Request + User Context
            Controller->>Service: Business Operation + User Context
            Service->>Service: Check Authorization
            alt Authorized
                Service->>Service: Execute Operation
                Service-->>Controller: Result
                Controller-->>Client: Success Response
            else Unauthorized
                Service-->>Controller: AuthorizationException
                Controller-->>Client: 403 Forbidden
            end
        else Token Invalid
            AuthFilter-->>Client: 401 Unauthorized
        end
    end
```

### Token Revocation Architecture

```mermaid
graph TB
    subgraph "Token Lifecycle"
        Login["Login Request"] --> GenerateToken["Generate JWT Token"]
        GenerateToken --> StoreToken["Store Token in Response"]
        StoreToken --> UseToken["Client Uses Token"]
    end
    
    subgraph "Revocation Flow"
        RevokeRequest["Revoke Request"] --> CheckToken["Validate Token"]
        CheckToken --> AddToBlacklist["Add to Redis Blacklist"]
        AddToBlacklist --> SetTTL["Set TTL = Token Expiration"]
    end
    
    subgraph "Validation Flow"
        Request["API Request"] --> ExtractToken["Extract Token"]
        ExtractToken --> CheckBlacklist["Check Redis Blacklist"]
        CheckBlacklist -->|Revoked| Reject["Reject Request"]
        CheckBlacklist -->|Not Revoked| ValidateToken["Validate Token Signature"]
        ValidateToken -->|Valid| ProcessRequest["Process Request"]
        ValidateToken -->|Invalid| Reject
    end
```

### Rate Limiting Architecture

```mermaid
graph TB
    Request["HTTP Request"] --> WAF["AWS WAF<br/>Edge Rate Limiting"]
    WAF -->|Rate Limit Exceeded| RejectWAF["429 Too Many Requests"]
    WAF -->|Within Limits| ALB["Application Load Balancer"]
    ALB --> RateLimiter["Application Rate Limiter<br/>(Redis-based)"]
    RateLimiter -->|Rate Limit Exceeded| RejectApp["429 Too Many Requests"]
    RateLimiter -->|Within Limits| AuthFilter["Authentication Filter"]
    
    subgraph "Rate Limiting Rules"
        AuthEndpoints["Auth Endpoints<br/>5 req/min per IP"]
        GeneralEndpoints["General Endpoints<br/>100 req/min per user"]
        AdminEndpoints["Admin Endpoints<br/>200 req/min per admin"]
    end
    
    RateLimiter --> AuthEndpoints
    RateLimiter --> GeneralEndpoints
    RateLimiter --> AdminEndpoints
```

## API Versioning Strategy

### Version Routing

```mermaid
graph TB
    Request["HTTP Request"] --> VersionFilter["Version Filter"]
    VersionFilter --> V1["/api/v1/*"]
    VersionFilter --> V2["/api/v2/*"]
    VersionFilter --> V3["/api/v3/*"]
    
    V1 --> V1Controller["V1 Controllers"]
    V2 --> V2Controller["V2 Controllers"]
    V3 --> V3Controller["V3 Controllers"]
    
    V1Controller --> SharedService["Shared Services"]
    V2Controller --> SharedService
    V3Controller --> SharedService
```

### Version Lifecycle

- **v1**: Current stable version
- **v2**: Future version (backward compatible changes)
- **v3**: Future version (breaking changes)

## Data Management Patterns

### Soft Delete Pattern

```mermaid
graph TB
    DeleteRequest["DELETE Request"] --> Service["Pet Service"]
    Service --> CheckDeleted["Check if Already Deleted"]
    CheckDeleted -->|Not Deleted| UpdateFlag["Set deleted = true"]
    CheckDeleted -->|Already Deleted| Error["Return 404"]
    UpdateFlag --> SetTimestamp["Set deletedAt = now()"]
    SetTimestamp --> EncryptDeleted["Encrypt Deleted Record"]
    EncryptDeleted --> Save["Save Entity"]
    Save --> Response["204 No Content"]
    
    QueryRequest["Query Request"] --> FilterDeleted["Filter deleted = false"]
    FilterDeleted --> Results["Return Results"]
    
    RetentionJob["Data Retention Job<br/>(Scheduled)"] --> CheckRetention["Check deletedAt > Retention Period"]
    CheckRetention -->|Expired| HardDelete["Hard Delete Record"]
    CheckRetention -->|Not Expired| Skip["Skip Record"]
```

### Cascade Delete Strategy

```mermaid
graph TB
    DeleteUser["Delete User"] --> CheckPets["Check User Pets"]
    CheckPets -->|Has Pets| CascadeDelete["Cascade Delete Pets"]
    CascadeDelete --> CheckHistory["Check Pet History"]
    CheckHistory --> CascadeHistory["Cascade Delete History"]
    CascadeHistory --> DeleteUser["Delete User"]
    CheckPets -->|No Pets| DeleteUser["Delete User"]
```

## Scalability Architecture

### Horizontal Scaling

```mermaid
graph TB
    subgraph "Load Balancer"
        ALB["Application Load Balancer"]
    end
    
    subgraph "Application Instances"
        Instance1["Instance 1"]
        Instance2["Instance 2"]
        Instance3["Instance 3"]
        InstanceN["Instance N"]
    end
    
    subgraph "Database"
        Primary["PostgreSQL Primary"]
        Replica["PostgreSQL Replica"]
    end
    
    ALB --> Instance1
    ALB --> Instance2
    ALB --> Instance3
    ALB --> InstanceN
    
    Instance1 --> Primary
    Instance2 --> Primary
    Instance3 --> Primary
    InstanceN --> Primary
    
    Instance1 --> Replica
    Instance2 --> Replica
    Instance3 --> Replica
    InstanceN --> Replica
```

### Caching Strategy

```mermaid
graph TB
    Request["API Request"] --> CheckCache["Check Redis Cache"]
    CheckCache -->|Cache Hit| ReturnCached["Return Cached Data"]
    CheckCache -->|Cache Miss| QueryDB["Query Database"]
    QueryDB --> StoreCache["Store in Cache"]
    StoreCache --> ReturnData["Return Data"]
    ReturnCached --> Response["HTTP Response"]
    ReturnData --> Response
```

## Error Handling Architecture

### Error Flow

```mermaid
graph TB
    Error["Exception Occurs"] --> ExceptionHandler["Global Exception Handler"]
    ExceptionHandler --> ErrorType{"Error Type?"}
    ErrorType -->|Validation| ValidationError["400 Bad Request"]
    ErrorType -->|Authentication| AuthError["401 Unauthorized"]
    ErrorType -->|Authorization| ForbiddenError["403 Forbidden"]
    ErrorType -->|Not Found| NotFoundError["404 Not Found"]
    ErrorType -->|Server Error| ServerError["500 Internal Server Error"]
    
    ValidationError --> ErrorResponse["Error Response"]
    AuthError --> ErrorResponse
    ForbiddenError --> ErrorResponse
    NotFoundError --> ErrorResponse
    ServerError --> ErrorResponse
    
    ErrorResponse --> LogError["Log Error"]
    LogError --> ClientResponse["Client Response"]
```

## Technology Stack

### Application Framework
- **Spring Boot 3**: Application framework
- **Spring Security**: Authentication and authorization
- **Spring Data JPA**: Data access layer
- **Spring Actuator**: Health checks and metrics

### Data Layer
- **PostgreSQL**: Primary database
- **Redis**: Caching layer
- **Flyway/Liquibase**: Database migrations

### Infrastructure
- **Docker**: Containerization
- **AWS ECS**: Container orchestration
- **AWS RDS**: Managed database
- **AWS ALB**: Load balancing
- **AWS Secrets Manager**: Secrets management

### Monitoring
- **CloudWatch**: Logging and metrics
- **AWS X-Ray**: Distributed tracing
- **Spring Actuator**: Application metrics

## Deployment Architecture

### Container Architecture

```mermaid
graph TB
    subgraph "Docker Container"
        JVM["JVM"]
        SpringBoot["Spring Boot Application"]
        AppCode["Application Code"]
    end
    
    subgraph "ECS Task"
        Container["Container"]
        HealthCheck["Health Check"]
    end
    
    subgraph "ECS Service"
        Task1["Task 1"]
        Task2["Task 2"]
        TaskN["Task N"]
    end
    
    JVM --> SpringBoot
    SpringBoot --> AppCode
    Container --> JVM
    Container --> HealthCheck
    Task1 --> Container
    Task2 --> Container
    TaskN --> Container
```

## Performance Considerations

### Database Optimization
- Connection pooling (HikariCP)
- Query optimization with indexes
- Read replicas for read-heavy workloads
- Prepared statements for SQL injection prevention

### Application Optimization
- Stateless design for load balancing
- Caching frequently accessed data
- Async processing for non-critical operations
- Efficient DTO mapping

### Network Optimization
- HTTP/2 support
- Compression (gzip)
- CDN for static assets (if applicable)
- Keep-alive connections

## Resilience Patterns

### Circuit Breaker Pattern

```mermaid
graph TB
    Request["Service Request"] --> CircuitBreaker["Circuit Breaker"]
    CircuitBreaker --> State{"Circuit State?"}
    State -->|Closed| CallService["Call Service"]
    State -->|Open| FailFast["Fail Fast"]
    State -->|Half-Open| TestCall["Test Call"]
    
    CallService --> Success{"Success?"}
    Success -->|Yes| ClosedState["Keep Closed"]
    Success -->|No| ErrorCount["Increment Error Count"]
    ErrorCount --> Threshold{"Threshold Reached?"}
    Threshold -->|Yes| OpenState["Open Circuit"]
    Threshold -->|No| ClosedState
    
    TestCall --> TestSuccess{"Success?"}
    TestSuccess -->|Yes| ClosedState
    TestSuccess -->|No| OpenState
```

### Retry Pattern

```mermaid
graph TB
    Request["Service Request"] --> Attempt["Attempt Call"]
    Attempt --> Result{"Result?"}
    Result -->|Success| ReturnSuccess["Return Success"]
    Result -->|Failure| CheckRetries["Check Retry Count"]
    CheckRetries -->|Under Limit| Wait["Exponential Backoff"]
    Wait --> Attempt
    CheckRetries -->|Limit Reached| ReturnFailure["Return Failure"]
```

## Security Enhancements (Post Red-Blue Team Analysis)

### Token Revocation Mechanism

**Implementation:**
- Redis-based token blacklist for revoked tokens
- Token revocation endpoint (`POST /api/v1/auth/logout`)
- Blacklist check in authentication filter before token validation
- TTL set to match token expiration time

**Benefits:**
- Immediate token invalidation capability
- Maintains stateless design (Redis is external state)
- Supports security incident response
- GDPR compliance for right to be forgotten

### Rate Limiting Strategy

**Multi-Layer Approach:**
1. **WAF Level**: Edge rate limiting for DDoS protection
2. **Application Level**: Redis-based rate limiting per user/IP
3. **Endpoint-Specific**: Different limits for auth vs. general endpoints

**Rate Limits:**
- Authentication endpoints: 5 requests/minute per IP
- General API endpoints: 100 requests/minute per user
- Admin endpoints: 200 requests/minute per admin

### Actuator Endpoint Security

**Configuration:**
- Only `/actuator/health` exposed publicly (for load balancer health checks)
- `/actuator/info` requires authentication
- All other actuator endpoints disabled in production
- IP whitelisting for management endpoints (if needed)

### Security Headers

**Implemented Headers:**
- `Content-Security-Policy`: Restrict resource loading
- `X-Frame-Options: DENY`: Prevent clickjacking
- `X-Content-Type-Options: nosniff`: Prevent MIME sniffing
- `Strict-Transport-Security`: Enforce HTTPS
- `X-XSS-Protection`: Enable XSS filtering

### Data Retention Policy

**Soft Delete Enhancement:**
- Retention period: 7 years (compliance requirement)
- Automated purging job for records beyond retention
- Encryption for deleted records
- Audit logging for all deleted record access

### Password Policy Enhancement

**Requirements:**
- Minimum 8 characters
- Password complexity (uppercase, lowercase, number, special character)
- Account lockout after 5 failed attempts
- Password history (prevent reuse of last 5 passwords)
- Password expiration: 90 days (configurable)

### Request Size Limits

**Configuration:**
- Maximum request body size: 1MB
- Field length validation enforced
- Rejection of oversized requests with 413 Payload Too Large

## Future Architecture Considerations

### Microservices Evolution
- Potential split into separate services (Auth Service, Pet Service)
- Service mesh for inter-service communication
- API Gateway for centralized routing

### Event-Driven Architecture
- Event sourcing for audit trail
- Message queues for async processing
- Event-driven notifications

### Multi-Tenancy Support
- Tenant isolation at database level
- Shared schema with tenant ID
- Tenant-specific configurations

### Security Enhancements (Future)
- Multi-factor authentication (MFA) with TOTP
- Refresh token mechanism with short-lived access tokens
- Fine-grained permissions (ABAC)
- IAM database authentication
- Automated security testing (SAST/DAST)
