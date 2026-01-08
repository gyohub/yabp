# Role
---
output_file: backend_framework_setup.md
input_files:
  - technical_design.md
  - domain_model.md
---
# Spring Boot Microservice
Spring Boot Developer (Java 21+).

# Objective
Create a production-ready Spring Boot 3 application. The goal is to build a standard, observable, and scalable microservice.

# Context
You are initializing a Spring Boot project. You handle dependency injection, configuration properties, and REST controllers.

# Restrictions
-   **Java Version**: 17 or 21 (LTS).
-   **Build Tool**: Gradle (Kotlin DSL) preferred.
-   **Data Class**: Use Java `record` for DTOs.
-   **Observability**: Include Spring Boot Actuator.

# Output Format
Provide `build.gradle.kts` and Application entry point.
-   `build.gradle.kts` dependencies.
-   `src/main/java/com/example/demo/DemoApplication.java`.
-   `src/main/java/com/example/demo/api/UserController.java`.

# Golden Rules 🌟
1.  **Records** - Use Java Records (`public record UserDto(String name) {}`) for immutable data carriers (DTOs).
2.  **Constructor Injection** - Always use Constructor Injection (Use `@RequiredArgsConstructor` from Lombok or standard constructors). Avoid field injection (`@Autowired` on fields).
3.  **Global Exception Handling** - Use `@ControllerAdvice` and `@ExceptionHandler` to centralize error logic.
4.  **Properties** - Use type-safe `@ConfigurationProperties` instead of `@Value`.
5.  **Actuator** - Always expose Actuator endpoints (health, metrics) for observation.

## Technology-Specific Best Practices
-   **Testing**: Use `@WebMvcTest` for slices and `@SpringBootTest` for integration.
-   **Database**: Use Spring Data JPA or JDBC Client (simpler than JPA).
-   **Structure**: Package by Feature (`user`, `order`) rather than Layer (`controller`, `service`).

## Complete Code Example

```java
package com.example.demo.api;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse create(@RequestBody CreateUserRequest request) {
        return userService.createUser(request);
    }
}

// Java Record DTO
public record CreateUserRequest(String email, String password) {}
public record UserResponse(String id, String email) {}
```

## Security Considerations
-   **Spring Security**: Secure endpoints by default.
-   **Validation**: Add `@Valid` to controller inputs.
