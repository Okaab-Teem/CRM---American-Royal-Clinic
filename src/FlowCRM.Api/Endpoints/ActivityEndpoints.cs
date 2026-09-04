using FlowCRM.Api.Extensions;
using FlowCRM.Application.Common.Models;
using FlowCRM.Application.DTOs;
using FlowCRM.Application.Services;
using FlowCRM.Infrastructure.Persistence;

namespace FlowCRM.Api.Endpoints;

public static class ActivityEndpoints
{
    public static IEndpointRouteBuilder MapActivityEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/activities").WithTags("Activities").RequireAuthorization();

        group.MapGet("/", async ([AsParameters] QueryParams query, IActivityService actService, CancellationToken ct) =>
        {
            var result = await actService.GetActivitiesAsync(query, ct);
            return Results.Ok(result);
        })
        .WithName("GetActivities");

        group.MapPost("/", async (CreateActivityDto dto, System.Security.Claims.ClaimsPrincipal user, IActivityService actService, CancellationToken ct) =>
        {
            var currentUserId = user.GetUserId();
            if (currentUserId == Guid.Empty) currentUserId = DatabaseSeeder.SaraId;

            var result = await actService.CreateActivityAsync(dto, currentUserId, ct);
            return Results.Created($"/api/activities/{result.Id}", result);
        })
        .WithName("CreateActivity");

        return app;
    }
}
