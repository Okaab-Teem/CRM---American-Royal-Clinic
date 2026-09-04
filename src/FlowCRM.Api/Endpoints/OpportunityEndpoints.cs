using FlowCRM.Api.Extensions;
using FlowCRM.Application.Common.Models;
using FlowCRM.Application.DTOs;
using FlowCRM.Application.Services;
using FlowCRM.Infrastructure.Persistence;

namespace FlowCRM.Api.Endpoints;

public static class OpportunityEndpoints
{
    public static IEndpointRouteBuilder MapOpportunityEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/opportunities").WithTags("Opportunities").RequireAuthorization();

        group.MapGet("/", async ([AsParameters] QueryParams query, System.Security.Claims.ClaimsPrincipal user, IOpportunityService oppService, CancellationToken ct) =>
        {
            var currentUserId = user.GetUserId();
            if (user.IsSalesRep() && currentUserId != Guid.Empty)
            {
                query.AssignedUserId = currentUserId.ToString();
            }

            var result = await oppService.GetOpportunitiesAsync(query, ct);
            return Results.Ok(result);
        })
        .WithName("GetOpportunities");

        group.MapGet("/{id:guid}", async (Guid id, System.Security.Claims.ClaimsPrincipal user, IOpportunityService oppService, CancellationToken ct) =>
        {
            var result = await oppService.GetOpportunityByIdAsync(id, ct);
            var currentUserId = user.GetUserId();

            if (user.IsSalesRep() && currentUserId != Guid.Empty && result.AssignedUserId != currentUserId.ToString())
            {
                return Results.Forbid();
            }

            return Results.Ok(result);
        })
        .WithName("GetOpportunityById");

        group.MapPost("/", async (CreateOpportunityDto dto, System.Security.Claims.ClaimsPrincipal user, IOpportunityService oppService, CancellationToken ct) =>
        {
            var currentUserId = user.GetUserId();
            if (user.IsSalesRep() && currentUserId != Guid.Empty)
            {
                dto = dto with { AssignedUserId = currentUserId.ToString() };
            }

            var result = await oppService.CreateOpportunityAsync(dto, ct);
            return Results.Created($"/api/opportunities/{result.Id}", result);
        })
        .WithName("CreateOpportunity")
        .RequireRateLimiting("anti-spam-click");

        group.MapPut("/{id:guid}", async (Guid id, UpdateOpportunityDto dto, System.Security.Claims.ClaimsPrincipal user, IOpportunityService oppService, CancellationToken ct) =>
        {
            var existing = await oppService.GetOpportunityByIdAsync(id, ct);
            var currentUserId = user.GetUserId();

            if (user.IsSalesRep() && currentUserId != Guid.Empty && existing.AssignedUserId != currentUserId.ToString())
            {
                return Results.Forbid();
            }

            var result = await oppService.UpdateOpportunityAsync(id, dto, ct);
            return Results.Ok(result);
        })
        .WithName("UpdateOpportunity");

        group.MapPatch("/{id:guid}/stage", async (Guid id, MoveOpportunityStageDto dto, System.Security.Claims.ClaimsPrincipal user, IOpportunityService oppService, CancellationToken ct) =>
        {
            if (!Guid.TryParse(dto.PipelineStageId, out var stageGuid))
            {
                return Results.BadRequest(new { message = "Valid PipelineStageId is required." });
            }

            var currentUserId = user.GetUserId();
            if (currentUserId == Guid.Empty)
            {
                currentUserId = DatabaseSeeder.SaraId;
            }

            var existing = await oppService.GetOpportunityByIdAsync(id, ct);
            if (user.IsSalesRep() && existing.AssignedUserId != currentUserId.ToString())
            {
                return Results.Forbid();
            }

            var result = await oppService.MoveOpportunityStageAsync(id, stageGuid, currentUserId, ct);
            return Results.Ok(result);
        })
        .WithName("MoveOpportunityStage");

        return app;
    }
}
