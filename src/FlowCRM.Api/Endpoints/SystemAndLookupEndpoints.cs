using FlowCRM.Api.Extensions;
using FlowCRM.Application.Common.Interfaces;
using FlowCRM.Application.DTOs;
using FlowCRM.Domain.Entities;
using FlowCRM.Domain.Enums;
using FlowCRM.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FlowCRM.Api.Endpoints;

public static class SystemAndLookupEndpoints
{
    public static IEndpointRouteBuilder MapSystemAndLookupEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api").RequireAuthorization();

        // Lead Sources
        group.MapGet("/lead-sources", async (IApplicationDbContext context, CancellationToken ct) =>
        {
            var sources = await context.LeadSources.AsNoTracking().OrderBy(s => s.Id).ToListAsync(ct);
            return Results.Ok(sources);
        })
        .WithTags("LeadSources")
        .WithName("GetLeadSources");

        // Lead status patch
        group.MapPatch("/leads/{id:guid}/status", async (Guid id, UpdateStatusRequest request, IApplicationDbContext context, CancellationToken ct) =>
        {
            var lead = await context.Leads.FindAsync([id], ct);
            if (lead == null) return Results.NotFound();

            if (Enum.TryParse<LeadStatus>(request.Status, true, out var parsed))
            {
                lead.Status = parsed;
                await context.SaveChangesAsync(ct);
                return Results.Ok(new { lead.Id, Status = lead.Status.ToString() });
            }
            return Results.BadRequest(new { message = $"Invalid status '{request.Status}'" });
        })
        .WithTags("Leads");

        // Lead assign patch
        group.MapPatch("/leads/{id:guid}/assign", async (Guid id, AssignRequest request, IApplicationDbContext context, CancellationToken ct) =>
        {
            var lead = await context.Leads.FindAsync([id], ct);
            if (lead == null) return Results.NotFound();

            if (Guid.TryParse(request.AssignedUserId, out var userGuid))
            {
                lead.AssignedUserId = userGuid;
                await context.SaveChangesAsync(ct);
                return Results.Ok(new { lead.Id, lead.AssignedUserId });
            }
            return Results.BadRequest(new { message = "Invalid AssignedUserId" });
        })
        .WithTags("Leads");

        // Customer sub-resources (Customer 360)
        group.MapGet("/customers/{id:guid}/contacts", async (Guid id, IApplicationDbContext context, CancellationToken ct) =>
        {
            var contacts = await context.Contacts.AsNoTracking().Where(c => c.CustomerId == id).ToListAsync(ct);
            return Results.Ok(contacts.Select(c => new ContactDto(
                c.Id.ToString(), c.CustomerId.ToString(), c.FirstName, c.LastName, c.JobTitle, c.Email, c.Phone, c.IsPrimary
            )));
        })
        .WithTags("Customers");

        group.MapGet("/customers/{id:guid}/opportunities", async (Guid id, IApplicationDbContext context, CancellationToken ct) =>
        {
            var opps = await context.Opportunities
                .Include(o => o.Customer)
                .Include(o => o.Pipeline)
                .Include(o => o.PipelineStage)
                .Include(o => o.AssignedUser)
                .AsNoTracking()
                .Where(o => o.CustomerId == id)
                .ToListAsync(ct);

            return Results.Ok(opps.Select(o => new OpportunityDto(
                o.Id.ToString(), o.Name, o.CustomerId.ToString(), o.Customer?.CompanyName ?? "",
                o.LeadId?.ToString(), o.PipelineId.ToString(), o.Pipeline?.Name ?? "",
                o.PipelineStageId.ToString(), o.PipelineStage?.Name ?? "",
                o.AssignedUserId.ToString(),
                new UserSummaryDto(o.AssignedUser?.Id.ToString() ?? "", o.AssignedUser?.FirstName ?? "", o.AssignedUser?.LastName ?? "", o.AssignedUser?.Email ?? "", o.AssignedUser?.Role.ToString() ?? ""),
                o.Value, o.ExpectedCloseDate, o.Probability, o.Description, o.CreatedAt, o.UpdatedAt
            )));
        })
        .WithTags("Customers");

        group.MapGet("/customers/{id:guid}/tasks", async (Guid id, IApplicationDbContext context, CancellationToken ct) =>
        {
            var tasks = await context.Tasks
                .Include(t => t.AssignedUser)
                .Include(t => t.Customer)
                .Include(t => t.Opportunity)
                .AsNoTracking()
                .Where(t => t.CustomerId == id)
                .ToListAsync(ct);

            return Results.Ok(tasks.Select(t => new TaskDto(
                t.Id.ToString(), t.Title, t.Description, t.DueDate, t.Priority.ToString(), t.Status.ToString(),
                t.AssignedUserId.ToString(),
                new UserSummaryDto(t.AssignedUser?.Id.ToString() ?? "", t.AssignedUser?.FirstName ?? "", t.AssignedUser?.LastName ?? "", t.AssignedUser?.Email ?? "", t.AssignedUser?.Role.ToString() ?? ""),
                t.CustomerId?.ToString(), t.Customer?.CompanyName, t.OpportunityId?.ToString(), t.Opportunity?.Name,
                t.CreatedById.ToString(), t.CompletedAt
            )));
        })
        .WithTags("Customers");

        // My tasks
        group.MapGet("/tasks/my", async (System.Security.Claims.ClaimsPrincipal user, IApplicationDbContext context, CancellationToken ct) =>
        {
            var userId = user.GetUserId();
            if (userId == Guid.Empty) userId = DatabaseSeeder.SaraId;

            var tasks = await context.Tasks
                .Include(t => t.AssignedUser)
                .Include(t => t.Customer)
                .Include(t => t.Opportunity)
                .AsNoTracking()
                .Where(t => t.AssignedUserId == userId)
                .OrderBy(t => t.DueDate)
                .ToListAsync(ct);

            return Results.Ok(tasks.Select(t => new TaskDto(
                t.Id.ToString(), t.Title, t.Description, t.DueDate, t.Priority.ToString(), t.Status.ToString(),
                t.AssignedUserId.ToString(),
                new UserSummaryDto(t.AssignedUser?.Id.ToString() ?? "", t.AssignedUser?.FirstName ?? "", t.AssignedUser?.LastName ?? "", t.AssignedUser?.Email ?? "", t.AssignedUser?.Role.ToString() ?? ""),
                t.CustomerId?.ToString(), t.Customer?.CompanyName, t.OpportunityId?.ToString(), t.Opportunity?.Name,
                t.CreatedById.ToString(), t.CompletedAt
            )));
        })
        .WithTags("Tasks");

        // Notifications
        group.MapGet("/notifications", async (System.Security.Claims.ClaimsPrincipal user, IApplicationDbContext context, CancellationToken ct) =>
        {
            var userId = user.GetUserId();
            if (userId == Guid.Empty) userId = DatabaseSeeder.SaraId;

            var notifications = await context.Notifications
                .AsNoTracking()
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync(ct);

            return Results.Ok(notifications.Select(n => new
            {
                Id = n.Id.ToString(),
                n.Title,
                n.Description,
                n.IsRead,
                n.CreatedAt
            }));
        })
        .WithTags("Notifications");

        group.MapPatch("/notifications/{id:guid}/read", async (Guid id, IApplicationDbContext context, CancellationToken ct) =>
        {
            var notif = await context.Notifications.FindAsync([id], ct);
            if (notif == null) return Results.NotFound();

            notif.IsRead = true;
            await context.SaveChangesAsync(ct);
            return Results.Ok(new { notif.Id, notif.IsRead });
        })
        .WithTags("Notifications");

        return app;
    }
}

public sealed record UpdateStatusRequest(string Status);
public sealed record AssignRequest(string AssignedUserId);
