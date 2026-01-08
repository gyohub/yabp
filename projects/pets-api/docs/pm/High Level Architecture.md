# High Level Architecture: Pets API

## Architecture Overview

The Pets API follows a microservices architecture pattern built on Spring Boot 3, providing a RESTful interface for pet management with authentication and versioning support.

## System Architecture Diagram

```mermaid
graph TB
    Client["Client Applications"] --> API["API Gateway / Load Balancer"]
    API --> Auth["Authentication Service"]
    API --> PetAPI["Pets API v1"]
    PetAPI --> AuthCheck["Auth Middleware"]
    PetAPI --> PetController["Pet Controller"]
    PetAPI --> HistoryController["History Controller"]
    PetAPI --> UserController["User Controller"]
    PetController --> PetService["Pet Service"]
    HistoryController --> HistoryService["History Service"]
    UserController --> UserService["User Service"]
    PetService --> PetRepository["Pet Repository"]
    HistoryService --> HistoryRepository["History Repository"]
    UserService --> UserRepository["User Repository"]
    PetRepository --> DB["PostgreSQL Database"]
    HistoryRepository --> DB
    UserRepository --> DB
    PetAPI --> Health["Health Endpoints"]
    PetAPI --> Actuator["Spring Actuator"]
```

## Component Diagram

```mermaid
graph LR
    subgraph "API Layer"
        PetController["Pet Controller"]
        HistoryController["History Controller"]
        UserController["User Controller"]
        AuthFilter["Authentication Filter"]
    end
    
    subgraph "Service Layer"
        PetService["Pet Service"]
        HistoryService["History Service"]
        UserService["User Service"]
        AuthService["Authentication Service"]
    end
    
    subgraph "Repository Layer"
        PetRepository["Pet Repository"]
        HistoryRepository["History Repository"]
        UserRepository["User Repository"]
    end
    
    subgraph "Data Layer"
        PetEntity["Pet Entity"]
        HistoryEntity["History Entity"]
        UserEntity["User Entity"]
    end
    
    PetController --> PetService
    HistoryController --> HistoryService
    UserController --> UserService
    AuthFilter --> AuthService
    PetService --> PetRepository
    HistoryService --> HistoryRepository
    UserService --> UserRepository
    PetRepository --> PetEntity
    HistoryRepository --> HistoryEntity
    UserRepository --> UserEntity
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "AWS Cloud"
        subgraph "Load Balancer"
            ALB["Application Load Balancer"]
        end
        
        subgraph "ECS Cluster"
            Container1["Pets API Container 1"]
            Container2["Pets API Container 2"]
            Container3["Pets API Container N"]
        end
        
        subgraph "RDS"
            PrimaryDB["PostgreSQL Primary"]
            ReplicaDB["PostgreSQL Replica"]
        end
        
        subgraph "Security"
            SecurityGroup["Security Groups"]
            IAM["IAM Roles"]
        end
    end
    
    Internet["Internet"] --> ALB
    ALB --> Container1
    ALB --> Container2
    ALB --> Container3
    Container1 --> PrimaryDB
    Container2 --> PrimaryDB
    Container3 --> PrimaryDB
    PrimaryDB --> ReplicaDB
    Container1 --> SecurityGroup
    Container2 --> SecurityGroup
    Container3 --> SecurityGroup
```

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Auth
    participant Controller
    participant Service
    participant Repository
    participant Database
    
    Client->>API: HTTP Request
    API->>Auth: Validate Token
    Auth-->>API: Token Valid
    API->>Controller: Route Request
    Controller->>Service: Business Logic
    Service->>Repository: Data Access
    Repository->>Database: SQL Query
    Database-->>Repository: Result Set
    Repository-->>Service: Entity Objects
    Service-->>Controller: DTO Objects
    Controller-->>API: JSON Response
    API-->>Client: HTTP Response
```

## Technology Stack

### Application Layer
- **Framework**: Spring Boot 3
- **Language**: Java
- **Build Tool**: Maven
- **API Style**: RESTful

### Data Layer
- **Database**: PostgreSQL
- **ORM**: Spring Data JPA
- **Migrations**: Flyway or Liquibase

### Security
- **Authentication**: Spring Security
- **Token**: JWT (JSON Web Tokens)
- **Password**: BCrypt

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose (local), ECS (AWS)
- **Cloud Provider**: AWS
- **CI/CD**: GitHub Actions

### Monitoring & Health
- **Health Checks**: Spring Actuator
- **Metrics**: Actuator Metrics
- **Logging**: SLF4J with Logback

## API Structure

### Versioning Strategy
- URL-based versioning: `/api/v1/...`
- Future versions: `/api/v2/...`

### Endpoint Categories

1. **Authentication Endpoints** (`/api/v1/auth`)
   - POST `/login` - User login
   - POST `/register` - User registration
   - POST `/logout` - User logout

2. **User Endpoints** (`/api/v1/users`)
   - GET `/users` - List users (admin only)
   - GET `/users/{id}` - Get user by ID
   - PUT `/users/{id}` - Update user
   - DELETE `/users/{id}` - Delete user

3. **Pet Endpoints** (`/api/v1/pets`)
   - GET `/pets` - List pets
   - GET `/pets/{id}` - Get pet by ID
   - POST `/pets` - Create pet
   - PUT `/pets/{id}` - Update pet
   - DELETE `/pets/{id}` - Soft delete pet

4. **History Endpoints** (`/api/v1/pets/{petId}/history`)
   - GET `/pets/{petId}/history` - Get pet history
   - POST `/pets/{petId}/history` - Add history record
   - PUT `/pets/{petId}/history/{id}` - Update history record
   - DELETE `/pets/{petId}/history/{id}` - Delete history record

5. **Health Endpoints** (`/actuator`)
   - GET `/health` - Health check
   - GET `/info` - Application info

## Data Model

### Core Entities

1. **User**
   - id (UUID)
   - username (String, unique)
   - email (String, unique)
   - password (String, hashed)
   - role (Enum: ADMIN, USER)
   - createdAt (Timestamp)
   - updatedAt (Timestamp)

2. **Pet**
   - id (UUID)
   - name (String)
   - adoptionDate (Date)
   - birthDate (Date)
   - race (String)
   - breed (String)
   - dateOfDeath (Date, nullable)
   - deleted (Boolean, default: false)
   - deletedAt (Timestamp, nullable)
   - createdAt (Timestamp)
   - updatedAt (Timestamp)
   - userId (UUID, Foreign Key)

3. **PetHistory**
   - id (UUID)
   - petId (UUID, Foreign Key)
   - date (Date)
   - description (String)
   - createdAt (Timestamp)
   - updatedAt (Timestamp)

## Security Architecture

### Authentication Flow
1. Client sends credentials to `/api/v1/auth/login`
2. Server validates credentials
3. Server generates JWT token
4. Client includes token in Authorization header for subsequent requests
5. Server validates token on each request

### Authorization
- Role-based access control (RBAC)
- Admin users can manage other users
- Users can only manage their own pets
- All endpoints require valid authentication

## Scalability Considerations

- Horizontal scaling via container orchestration
- Database read replicas for read-heavy workloads
- Connection pooling for database connections
- Caching strategy for frequently accessed data
- Stateless API design for load balancing

## Resilience Patterns

- Health checks for container orchestration
- Database connection retry logic
- Graceful error handling
- Proper HTTP status codes
- Transaction management for data consistency
