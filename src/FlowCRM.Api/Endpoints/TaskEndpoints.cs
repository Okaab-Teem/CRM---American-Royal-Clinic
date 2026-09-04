using FlowCRM.Api.Extensions;
using FlowCRM.Application.Common.Models;
using FlowCRM.Application.DTOs;
using FlowCRM.Application.Services;
using FlowCRM.Infrastructure.Persistence;

namespace FlowCRM.Api.Endpoints;

public static class TaskEndpoints
{
    public static IEndpointRouteBuilder MapTaskEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/tasks").WithTags("Tasks").RequireAuthorization();

        group.MapGet("/", async ([AsParameters] QueryParams query, System.Security.Claims.ClaimsPrincipal user, ITaskService taskService, CancellationToken ct) =>
        {
            var currentUserId = user.GetUserId();
            if (user.IsSalesRep() && currentUserId != Guid.Empty)
            {
                query.AssignedUserId = currentUserId.ToString();
            }

            var result = await taskService.GetTasksAsync(query, ct);
            return Results.Ok(result);
        })
        .WithName("GetTasks");

        group.MapPost("/", async (CreateTaskDto dto, System.Security.Claims.ClaimsPrincipal user, ITaskService taskService, CancellationToken ct) =>
        {
            var currentUserId = user.GetUserId();
            if (currentUserId == Guid.Empty) currentUserId = DatabaseSeeder.SaraId;

            var result = await taskService.CreateTaskAsync(dto, currentUserId, ct);
            return Results.Created($"/api/tasks/{result.Id}", result);
        })
        .WithName("CreateTask")
        .RequireRateLimiting("anti-spam-click");

        group.MapPatch("/{id:guid}/status", async (Guid id, UpdateTaskStatusDto dto, System.Security.Claims.ClaimsPrincipal user, ITaskService taskService, CancellationToken ct) =>
        {
            var currentUserId = user.GetUserId();
            if (currentUserId == Guid.Empty) currentUserId = DatabaseSeeder.SaraId;

            var result = await taskService.UpdateTaskStatusAsync(id, dto.Status, currentUserId, ct);
            return Results.Ok(result);
        })
        .WithName("UpdateTaskStatus");

        return app;
    }
}
