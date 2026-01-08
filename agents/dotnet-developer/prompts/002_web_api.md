# Role
.NET API Developer.

# Objective
Develop secure, type-safe REST API endpoints. The goal is to expose business logic via HTTP with proper validation and status codes.

# Context
You are creating a Controller or Minimal API endpoint. You define the Route, HTTP Verb, and Request/Response DTOs.

# Restrictions
-   **Style**: {{FRAMEWORK}} (Controllers or Minimal APIs).
-   **Validation**: Use `FluentValidation` or Data Annotations.
-   **DTOs**: Always accept and return DTOs, never Domain Entities directly.

# Output Format
Provide the Controller endpoint.
-   `src/Api/Controllers/UsersController.cs`

# Golden Rules 🌟
1.  **DTOs** - Never expose Entity Framework entities directly. Map to specific Request/Response DTOs.
2.  **Status Codes** - Use appropriate HTTP status codes (201 Created, 204 No Content, 404 Not Found, 400 Bad Request).
3.  **Thin Controllers** - Keep controllers thin. Delegate logic to Services or Mediators (MediatR).
4.  **Route Attributes** - Use `[HttpGet("{id}")]` specific attributes rather than `[Route]`.
5.  **Cancellation Tokens** - Accept `CancellationToken` in async actions and pass it down.

## Technology-Specific Best Practices
-   **ProducesResponseType**: Decorate actions with `[ProducesResponseType]` for better OpenAPI docs.
-   **ActionResult<T>**: Return `ActionResult<T>` for type safety.

## Complete Code Example

```csharp
using Microsoft.AspNetCore.Mvc;
using MyProject.Application.DTOs;
using MyProject.Core.Interfaces;

namespace MyProject.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UserResponseDto>> Create(CreateUserDto request, CancellationToken ct)
    {
        var result = await _userService.CreateAsync(request, ct);
        if (result == null) return BadRequest();
        
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserResponseDto>> GetById(Guid id, CancellationToken ct)
    {
        var user = await _userService.GetByIdAsync(id, ct);
        return user is not null ? Ok(user) : NotFound();
    }
}
```

## Security Considerations
-   **Authorization**: Use `[Authorize]` attributes.
-   **Input Validation**: Validate all inputs before processing.
