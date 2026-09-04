using FlowCRM.Api.Extensions;
using FlowCRM.Application.Common.Models;
using FlowCRM.Application.DTOs;
using FlowCRM.Application.Services;
using FlowCRM.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;

namespace FlowCRM.Api.Endpoints;

public static class LeadEndpoints
{
    public static IEndpointRouteBuilder MapLeadEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/leads").WithTags("Leads").RequireAuthorization();

        group.MapGet("/", async ([AsParameters] QueryParams query, System.Security.Claims.ClaimsPrincipal user, ILeadService leadService, CancellationToken ct) =>
        {
            var currentUserId = user.GetUserId();
            if (user.IsSalesRep() && currentUserId != Guid.Empty)
            {
                query.AssignedUserId = currentUserId.ToString();
            }

            var result = await leadService.GetLeadsAsync(query, ct);
            return Results.Ok(result);
        })
        .WithName("GetLeads");

        group.MapGet("/{id:guid}", async (Guid id, System.Security.Claims.ClaimsPrincipal user, ILeadService leadService, CancellationToken ct) =>
        {
            var result = await leadService.GetLeadByIdAsync(id, ct);
            var currentUserId = user.GetUserId();

            if (user.IsSalesRep() && currentUserId != Guid.Empty && result.AssignedUserId != currentUserId.ToString())
            {
                return Results.Forbid();
            }

            return Results.Ok(result);
        })
        .WithName("GetLeadById");

        group.MapPost("/", async (CreateLeadDto dto, System.Security.Claims.ClaimsPrincipal user, ILeadService leadService, CancellationToken ct) =>
        {
            var currentUserId = user.GetUserId();
            var result = await leadService.CreateLeadAsync(dto, currentUserId != Guid.Empty ? currentUserId : null, ct);
            return Results.Created($"/api/leads/{result.Id}", result);
        })
        .WithName("CreateLead")
        .RequireRateLimiting("anti-spam-click");

        group.MapPut("/{id:guid}", async (Guid id, UpdateLeadDto dto, System.Security.Claims.ClaimsPrincipal user, ILeadService leadService, CancellationToken ct) =>
        {
            var existing = await leadService.GetLeadByIdAsync(id, ct);
            var currentUserId = user.GetUserId();

            if (user.IsSalesRep() && currentUserId != Guid.Empty && existing.AssignedUserId != currentUserId.ToString())
            {
                return Results.Forbid();
            }

            var result = await leadService.UpdateLeadAsync(id, dto, ct);
            return Results.Ok(result);
        })
        .WithName("UpdateLead");

        group.MapDelete("/{id:guid}", async (Guid id, ILeadService leadService, CancellationToken ct) =>
        {
            await leadService.DeleteLeadAsync(id, ct);
            return Results.NoContent();
        })
        .WithName("DeleteLead")
        .RequireAuthorization("RequireManagerOrAdmin");

        group.MapPost("/{id:guid}/convert", async (Guid id, ConvertLeadDto dto, System.Security.Claims.ClaimsPrincipal user, ILeadService leadService, CancellationToken ct) =>
        {
            var currentUserId = user.GetUserId();
            if (currentUserId == Guid.Empty)
            {
                currentUserId = DatabaseSeeder.SaraId;
            }

            var existing = await leadService.GetLeadByIdAsync(id, ct);
            if (user.IsSalesRep() && existing.AssignedUserId != currentUserId.ToString())
            {
                return Results.Forbid();
            }

            var result = await leadService.ConvertLeadAsync(id, dto, currentUserId, ct);
            return Results.Ok(result);
        })
        .WithName("ConvertLead")
        .RequireRateLimiting("anti-spam-click");

        return app;
    }
}
