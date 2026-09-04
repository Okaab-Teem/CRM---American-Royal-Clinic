using FlowCRM.Application.Common.Interfaces;
using FlowCRM.Application.Common.Models;
using FlowCRM.Application.DTOs;
using FlowCRM.Application.Exceptions;
using FlowCRM.Domain.Entities;
using FlowCRM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace FlowCRM.Application.Services.Implementations;

public sealed class ActivityService : IActivityService
{
    private readonly IApplicationDbContext _context;

    public ActivityService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<ActivityDto>> GetActivitiesAsync(QueryParams query, CancellationToken cancellationToken = default)
    {
        var actQuery = _context.Activities
            .Include(a => a.User)
            .Include(a => a.Customer)
            .Include(a => a.Opportunity)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            actQuery = actQuery.Where(a =>
                a.Subject.ToLower().Contains(search) ||
                (a.Description != null && a.Description.ToLower().Contains(search)) ||
                (a.Customer != null && a.Customer.CompanyName.ToLower().Contains(search)) ||
                (a.Opportunity != null && a.Opportunity.Name.ToLower().Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(query.CustomerId) && Guid.TryParse(query.CustomerId, out var custId))
        {
            actQuery = actQuery.Where(a => a.CustomerId == custId);
        }

        if (!string.IsNullOrWhiteSpace(query.OpportunityId) && Guid.TryParse(query.OpportunityId, out var oppId))
        {
            actQuery = actQuery.Where(a => a.OpportunityId == oppId);
        }

        var total = await actQuery.CountAsync(cancellationToken);
        var page = query.GetPage();
        var pageSize = query.GetPageSize();

        var items = await actQuery
            .OrderByDescending(a => a.ActivityDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<ActivityDto>
        {
            Items = items.Select(MapToDto).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<ActivityDto> CreateActivityAsync(CreateActivityDto dto, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Subject))
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["subject"] = ["Activity subject is required."]
            });
        }

        var type = ActivityType.Note;
        if (!string.IsNullOrWhiteSpace(dto.Type) && Enum.TryParse<ActivityType>(dto.Type, true, out var parsedType))
        {
            type = parsedType;
        }

        var activity = new Activity
        {
            Type = type,
            Subject = dto.Subject.Trim(),
            Description = dto.Description,
            ActivityDate = dto.ActivityDate ?? DateTime.UtcNow,
            UserId = currentUserId
        };

        if (!string.IsNullOrWhiteSpace(dto.CustomerId) && Guid.TryParse(dto.CustomerId, out var custGuid))
        {
            activity.CustomerId = custGuid;
        }

        if (!string.IsNullOrWhiteSpace(dto.OpportunityId) && Guid.TryParse(dto.OpportunityId, out var oppGuid))
        {
            activity.OpportunityId = oppGuid;
        }

        _context.Activities.Add(activity);
        await _context.SaveChangesAsync(cancellationToken);

        var created = await _context.Activities
            .Include(a => a.User)
            .Include(a => a.Customer)
            .Include(a => a.Opportunity)
            .AsNoTracking()
            .FirstAsync(a => a.Id == activity.Id, cancellationToken);

        return MapToDto(created);
    }

    private static ActivityDto MapToDto(Activity a)
    {
        return new ActivityDto(
            a.Id.ToString(),
            a.Type.ToString(),
            a.Subject,
            a.Description,
            a.ActivityDate,
            new UserSummaryDto(
                a.User?.Id.ToString() ?? "",
                a.User?.FirstName ?? "Unknown",
                a.User?.LastName ?? "",
                a.User?.Email ?? "",
                a.User?.Role.ToString() ?? ""),
            a.CustomerId?.ToString(),
            a.Customer?.CompanyName,
            a.OpportunityId?.ToString(),
            a.Opportunity?.Name
        );
    }
}
