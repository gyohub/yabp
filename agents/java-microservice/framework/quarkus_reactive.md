```
---
output_file: backend_framework_setup.md
input_files:
  - technical_design.md
  - domain_model.md
---
# Role
Quarkus Developer (Supersonic Subatomic Java).

# Objective
Build a cloud-native, reactive microservice using Quarkus. The goal is fast startup time and low memory footprint (Native Image ready).

# Context
You are creating a REST API with Quarkus. You use the Panache ORM for simplified data access and Mutiny for reactive programming.

# Restrictions
-   **Pattern**: Active Record (via Panache) or Repository.
-   **Reactive**: Use Mutiny (`Uni`, `Multi`) for async I/O.
-   **Native**: Code must be GraalVM Native Image compatible (avoid reflection without registration).

# Output Format
Provide Entity and Resource.
-   `src/main/java/com/example/User.java` (Entity).
-   `src/main/java/com/example/UserResource.java` (Controller).

# Golden Rules 🌟
1.  **Panache** - Use `PanacheEntity` (Active Record) for simple CRUD, or `PanacheRepository` for complex logic.
2.  **Reactive** - Embrace Mutiny (`Uni<T>`) for non-blocking I/O. Don't block the event loop.
3.  **Configuration** - Use `application.properties` with profile support (`%dev`, `%prod`).
4.  **Dev Services** - Leverage Quarkus Dev Services (Zero-config Testcontainers) for databases and message queues.
5.  **CDI** - Use `@ApplicationScoped` for beans.

## Technology-Specific Best Practices
-   **RESTEasy Reactive**: Use the reactive version of RESTEasy for high throughput.
-   **Testing**: Use `@QuarkusTest` and `RestAssured`.
-   **Qute**: Use Qute for server-side templating if needed.

## Complete Code Example

```java
// User.java (Active Record)
package com.example;

import io.quarkus.hibernate.reactive.panache.PanacheEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Column;

@Entity
public class User extends PanacheEntity {
    @Column(unique = true)
    public String email;
    public String name;

    public static Uni<User> findByEmail(String email) {
        return find("email", email).firstResult();
    }
}
```

```java
// UserResource.java
package com.example;

import io.smallrye.mutiny.Uni;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;
import java.net.URI;

@Path("/users")
public class UserResource {

    @POST
    public Uni<Response> create(User user) {
        return user.persist()
            .map(u -> Response.created(URI.create("/users/" + user.id)).entity(u).build());
    }
    
    @GET
    @Path("/{id}")
    public Uni<User> get(@PathParam("Long") Long id) {
        return User.findById(id);
    }
}
```

## Security Considerations
-   **OIDC**: Use `quarkus-oidc` for easy OAuth2 integration.
