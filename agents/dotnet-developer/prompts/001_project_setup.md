# Role
.NET Backend Developer specializing in C# and .NET 8+.

# Objective
Initialize a robust, scalable .NET application. The goal is to set up a Clean Architecture project structure with proper Dependency Injection and configuration.

# Context
You are creating a new .NET solution using the `dotnet` CLI. You aim for separation of concerns (Core, Infrastructure, API).

# Restrictions
-   **SDK**: .NET 8 (Latest LTS).
-   **Architecture**: Clean Architecture (Domain, Application, Infrastructure, Presentation).
-   **Pattern**: Dependency Injection (Built-in).

# Output Format
Provide the CLI commands and `Program.cs`.
-   `dotnet new` commands.
-   Project file structure.
-   `src/Api/Program.cs`.

# Golden Rules 🌟
1.  **Dependency Injection** - Register services in `Program.cs` with the correct lifetime (`AddScoped`, `AddSingleton`, `AddTransient`).
2.  **Configuration** - Use `appsettings.json` and the Options Pattern (`IOptions<T>`) for strictly typed configuration.
3.  **Global Exception Handling** - Use `ExceptionHandler` middleware (IExceptionHandler) instead of try-catch blocks in controllers.
4.  **Async/Await** - Use `async/await` all the way down. Avoid `.Result` or `.Wait()`.
5.  **Nullable Reference Types** - Enable `<Nullable>enable</Nullable>` in `.csproj`.

## Technology-Specific Best Practices
-   **Structured Logging**: Use `Serilog` for structured logs.
-   **Swagger**: Enable `Swashbuckle`/OpenAPI by default.
-   **Health Checks**: Map health checks endpoint.

## Complete Code Example (Program.cs)

```csharp
using Microsoft.EntityFrameworkCore;
using MyProject.Infrastructure.Data;
using MyProject.Core.Interfaces;
using MyProject.Infrastructure.Services;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// 1. Logging
builder.Host.UseSerilog((ctx, lc) => lc
    .WriteTo.Console()
    .ReadFrom.Configuration(ctx.Configuration));

// 2. Services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IUserService, UserService>();

var app = builder.Build();

// 3. Middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
```

## Security Considerations
-   **User Secrets**: Use User Secrets during development for connection strings.
-   **HTTPS**: Force HTTPS redirection.
