using FlowCRM.Application.DTOs;
using FlowCRM.Application.Services;

namespace FlowCRM.Api.Endpoints;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/users").WithTags("Users").RequireAuthorization();

        group.MapGet("/", async (IUserService userService, CancellationToken ct) =>
        {
            var result = await userService.GetUsersAsync(ct);
            return Results.Ok(result);
        })
        .WithName("GetUsers")
        .RequireAuthorization("RequireManagerOrAdmin");

        group.MapGet("/{id:guid}", async (Guid id, IUserService userService, CancellationToken ct) =>
        {
            var result = await userService.GetUserByIdAsync(id, ct);
            return Results.Ok(result);
        })
        .WithName("GetUserById")
        .RequireAuthorization("RequireManagerOrAdmin");

        group.MapPost("/", async (CreateUserDto dto, IUserService userService, CancellationToken ct) =>
        {
            var result = await userService.CreateUserAsync(dto, ct);
            return Results.Created($"/api/users/{result.Id}", result);
        })
        .WithName("CreateUser")
        .RequireAuthorization("RequireAdmin");

        group.MapPut("/{id:guid}", async (Guid id, UpdateUserDto dto, IUserService userService, CancellationToken ct) =>
        {
            var result = await userService.UpdateUserAsync(id, dto, ct);
            return Results.Ok(result);
        })
        .WithName("UpdateUser")
        .RequireAuthorization("RequireAdmin");

        group.MapDelete("/{id:guid}", async (Guid id, IUserService userService, CancellationToken ct) =>
        {
            await userService.DeleteUserAsync(id, ct);
            return Results.NoContent();
        })
        .WithName("DeleteUser")
        .RequireAuthorization("RequireAdmin");

        return app;
    }
}
