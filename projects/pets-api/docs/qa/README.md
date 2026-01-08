# QA Documentation: Pets API

This directory contains all Quality Assurance documentation and test automation code for the Pets API.

## Structure

```
docs/qa/
├── README.md                    # This file
└── test_strategy.md            # Comprehensive test strategy document

src/test/java/com/pets/api/
├── integration/                # Integration tests
│   ├── BaseIntegrationTest.java
│   ├── auth/
│   │   └── AuthIntegrationTest.java
│   ├── pets/
│   │   └── PetIntegrationTest.java
│   └── util/
│       ├── AuthHelper.java
│       └── TestDataFactory.java
└── e2e/                        # End-to-end tests
    ├── PetManagementWorkflowTest.java
    └── SecurityWorkflowTest.java
```

## Test Strategy

See [test_strategy.md](./test_strategy.md) for comprehensive documentation on:
- Testing pyramid and levels
- Test coverage goals
- Test execution strategy
- Risk-based testing approach
- Test metrics and reporting

## Running Tests

### Prerequisites

- Java 17+
- Maven 3.8+
- Docker (for TestContainers)

### Unit Tests

```bash
mvn test
```

### Integration Tests

```bash
mvn test -Dtest=*IntegrationTest
```

### End-to-End Tests

```bash
mvn test -Dtest=*WorkflowTest
```

### All Tests

```bash
mvn clean test
```

### With Coverage Report

```bash
mvn clean test jacoco:report
```

Coverage report will be available at: `target/site/jacoco/index.html`

## Test Categories

### Unit Tests (60%)
- **Location**: `src/test/java/com/pets/api/controller/`, `src/test/java/com/pets/api/service/`
- **Purpose**: Test individual components in isolation
- **Tools**: JUnit 5, Mockito, AssertJ

### Integration Tests (30%)
- **Location**: `src/test/java/com/pets/api/integration/`
- **Purpose**: Test component interactions with real dependencies
- **Tools**: Spring Boot Test, TestContainers (PostgreSQL, Redis)

### End-to-End Tests (10%)
- **Location**: `src/test/java/com/pets/api/e2e/`
- **Purpose**: Test complete user workflows through the API
- **Tools**: REST Assured, TestContainers

## Test Utilities

### TestDataFactory
Provides factory methods for creating test data:
- `createRegisterRequest()` - Create user registration requests
- `createPetRequest()` - Create pet creation requests
- `createHistoryRequest()` - Create pet history requests

### AuthHelper
Provides authentication utilities:
- `registerAndLogin()` - Register user and get login token
- `login()` - Login and get token
- `logout()` - Logout and revoke token
- `getAuthToken()` - Get authentication token

## Test Configuration

Test configuration is defined in:
- `src/test/resources/application-test.yml` - Test profile configuration
- Uses H2 in-memory database for lightweight tests
- Uses TestContainers for integration tests (PostgreSQL + Redis)

## Continuous Integration

Tests are automatically executed in CI/CD pipeline:
- Pre-commit: Unit tests only
- Pull Request: All unit + integration tests
- Pre-production: Full test suite (unit + integration + E2E)

## Coverage Goals

| Component | Target |
|-----------|--------|
| Controllers | 90%+ |
| Services | 85%+ |
| Repositories | 80%+ |
| Security | 90%+ |
| **Overall** | **80%+** |

## Test Maintenance

- Keep tests independent and isolated
- Use descriptive test names following pattern: `should[ExpectedBehavior]When[Condition]`
- Follow AAA pattern (Arrange, Act, Assert)
- Clean up test data properly
- Update tests when production code changes

## Troubleshooting

### TestContainers Issues

If TestContainers fail to start:
1. Ensure Docker is running
2. Check Docker daemon is accessible
3. Verify network connectivity

### Port Conflicts

If you see port conflicts:
- Tests use random ports by default (`server.port: 0`)
- Ensure no other services are using test ports

### Database Issues

If database-related tests fail:
- Verify Flyway migrations are disabled in test profile
- Check H2 database compatibility
- Ensure TestContainers PostgreSQL is properly configured

## Additional Resources

- [API Design Documentation](../architecture/api_design.md)
- [User Stories](../pm/User%20Stories.md)
- [Security Documentation](../infrastructure/security.md)
