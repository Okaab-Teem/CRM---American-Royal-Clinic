using FlowCRM.Api.Extensions;
using FlowCRM.Application.DTOs;
using FlowCRM.Application.Services;

namespace FlowCRM.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Authentication");

        group.MapPost("/login", async (LoginRequest request, IAuthService authService, CancellationToken ct) =>
        {
            var result = await authService.LoginAsync(request, ct);
            return Results.Ok(result);
        })
        .WithName("Login")
        .AllowAnonymous()
        .RequireRateLimiting("auth-rate-limit");

        group.MapGet("/me", async (System.Security.Claims.ClaimsPrincipal user, IAuthService authService, CancellationToken ct) =>
        {
            var userId = user.GetUserId();
            if (userId == Guid.Empty)
            {
                return Results.Unauthorized();
            }

            var result = await authService.GetCurrentUserAsync(userId, ct);
            return Results.Ok(result);
        })
        .WithName("GetCurrentUser")
        .RequireAuthorization();

        return app;
    }
}
