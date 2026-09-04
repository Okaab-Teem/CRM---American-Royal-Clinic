using FlowCRM.Application.Common.Interfaces;
using FlowCRM.Application.Common.Models;
using FlowCRM.Application.DTOs;
using FlowCRM.Application.Exceptions;
using FlowCRM.Domain.Entities;
using FlowCRM.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace FlowCRM.Application.Services.Implementations;

public sealed class OpportunityService : IOpportunityService
{
    private readonly IApplicationDbContext _context;
    private readonly IMemoryCache? _cache;

    public OpportunityService(IApplicationDbContext context, IMemoryCache? cache = null)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<PagedResult<OpportunityDto>> GetOpportunitiesAsync(QueryParams query, CancellationToken cancellationToken = default)
    {
        var oppQuery = _context.Opportunities
            .Include(o => o.Customer)
            .Include(o => o.Pipeline)
            .Include(o => o.PipelineStage)
            .Include(o => o.AssignedUser)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            oppQuery = oppQuery.Where(o =>
                o.Name.ToLower().Contains(search) ||
                (o.Customer != null && o.Customer.CompanyName.ToLower().Contains(search)) ||
                (o.PipelineStage != null && o.PipelineStage.Name.ToLower().Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(query.CustomerId) && Guid.TryParse(query.CustomerId, out var custId))
        {
            oppQuery = oppQuery.Where(o => o.CustomerId == custId);
        }

        if (!string.IsNullOrWhiteSpace(query.AssignedUserId) && Guid.TryParse(query.AssignedUserId, out var assignedId))
        {
            oppQuery = oppQuery.Where(o => o.AssignedUserId == assignedId);
        }

        var total = await oppQuery.CountAsync(cancellationToken);
        var page = query.GetPage();
        var pageSize = query.GetPageSize();

        var items = await oppQuery
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<OpportunityDto>
        {
            Items = items.Select(MapToDto).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<OpportunityDto> GetOpportunityByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var opp = await _context.Opportunities
            .Include(o => o.Customer)
            .Include(o => o.Pipeline)
            .Include(o => o.PipelineStage)
            .Include(o => o.AssignedUser)
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);

        if (opp == null)
        {
            throw new NotFoundException($"Opportunity '{id}' not found.");
        }

        return MapToDto(opp);
    }

    public async Task<OpportunityDto> CreateOpportunityAsync(CreateOpportunityDto dto, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["name"] = ["Opportunity name is required."]
            });
        }

        if (!Guid.TryParse(dto.CustomerId, out var customerGuid))
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["customerId"] = ["Valid CustomerId is required."]
            });
        }

        if (!Guid.TryParse(dto.PipelineStageId, out var stageGuid))
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["pipelineStageId"] = ["Valid PipelineStageId is required."]
            });
        }

        Guid.TryParse(dto.PipelineId, out var pipelineGuid);
        Guid.TryParse(dto.AssignedUserId, out var assignedGuid);

        var stage = await _context.PipelineStages.FindAsync([stageGuid], cancellationToken);
        if (stage == null)
        {
            throw new NotFoundException("Pipeline stage not found.");
        }

        var opp = new Opportunity
        {
            Name = dto.Name.Trim(),
            CustomerId = customerGuid,
            PipelineId = pipelineGuid != Guid.Empty ? pipelineGuid : stage.PipelineId,
            PipelineStageId = stageGuid,
            AssignedUserId = assignedGuid,
            Value = dto.Value,
            Probability = dto.Probability > 0 ? dto.Probability : stage.Probability,
            ExpectedCloseDate = dto.ExpectedCloseDate,
            Description = dto.Description
        };

        if (!string.IsNullOrWhiteSpace(dto.LeadId) && Guid.TryParse(dto.LeadId, out var leadGuid))
        {
            opp.LeadId = leadGuid;
        }

        _context.Opportunities.Add(opp);
        await _context.SaveChangesAsync(cancellationToken);

        return await GetOpportunityByIdAsync(opp.Id, cancellationToken);
    }

    public async Task<OpportunityDto> UpdateOpportunityAsync(Guid id, UpdateOpportunityDto dto, CancellationToken cancellationToken = default)
    {
        var opp = await _context.Opportunities.FirstOrDefaultAsync(o => o.Id == id, cancellationToken);
        if (opp == null)
        {
            throw new NotFoundException($"Opportunity '{id}' not found.");
        }

        opp.Name = dto.Name.Trim();
        opp.Value = dto.Value;
        opp.Probability = dto.Probability;
        opp.ExpectedCloseDate = dto.ExpectedCloseDate;
        opp.Description = dto.Description;

        if (Guid.TryParse(dto.CustomerId, out var customerGuid)) opp.CustomerId = customerGuid;
        if (Guid.TryParse(dto.PipelineId, out var pipeGuid)) opp.PipelineId = pipeGuid;
        if (Guid.TryParse(dto.PipelineStageId, out var stageGuid)) opp.PipelineStageId = stageGuid;
        if (Guid.TryParse(dto.AssignedUserId, out var userGuid)) opp.AssignedUserId = userGuid;

        await _context.SaveChangesAsync(cancellationToken);
        return await GetOpportunityByIdAsync(id, cancellationToken);
    }

    public async Task<OpportunityDto> MoveOpportunityStageAsync(Guid id, Guid newStageId, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var opp = await _context.Opportunities
            .Include(o => o.PipelineStage)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);

        if (opp == null)
        {
            throw new NotFoundException($"Opportunity '{id}' not found.");
        }

        var newStage = await _context.PipelineStages.FindAsync([newStageId], cancellationToken);
        if (newStage == null)
        {
            throw new NotFoundException($"Stage '{newStageId}' not found.");
        }

        var oldStageName = opp.PipelineStage?.Name ?? "Unknown";
        opp.PipelineStageId = newStageId;
        opp.Probability = newStage.Probability;

        // Log StageChange Activity
        var activity = new Activity
        {
            Type = ActivityType.StageChange,
            Subject = $"Stage changed to {newStage.Name}",
            Description = $"Moved deal '{opp.Name}' from '{oldStageName}' to '{newStage.Name}' ({newStage.Probability}% probability).",
            ActivityDate = DateTime.UtcNow,
            UserId = currentUserId,
            CustomerId = opp.CustomerId,
            OpportunityId = opp.Id
        };
        _context.Activities.Add(activity);

        await _context.SaveChangesAsync(cancellationToken);
        return await GetOpportunityByIdAsync(id, cancellationToken);
    }

    public async Task<IReadOnlyList<PipelineStageDto>> GetPipelineStagesAsync(Guid? pipelineId = null, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"PipelineStages_{pipelineId?.ToString() ?? "all"}";
        if (_cache != null && _cache.TryGetValue(cacheKey, out IReadOnlyList<PipelineStageDto>? cachedStages) && cachedStages != null)
        {
            return cachedStages;
        }

        var query = _context.PipelineStages.AsNoTracking();

        if (pipelineId.HasValue && pipelineId.Value != Guid.Empty)
        {
            query = query.Where(s => s.PipelineId == pipelineId.Value);
        }

        var stages = await query.OrderBy(s => s.Order).ToListAsync(cancellationToken);
        var result = stages.Select(s => new PipelineStageDto(
            s.Id.ToString(),
            s.Name,
            s.Order,
            s.Probability
        )).ToList();

        _cache?.Set(cacheKey, (IReadOnlyList<PipelineStageDto>)result, TimeSpan.FromMinutes(10));
        return result;
    }

    private static OpportunityDto MapToDto(Opportunity opp)
    {
        return new OpportunityDto(
            opp.Id.ToString(),
            opp.Name,
            opp.CustomerId.ToString(),
            opp.Customer?.CompanyName ?? "Unknown",
            opp.LeadId?.ToString(),
            opp.PipelineId.ToString(),
            opp.Pipeline?.Name ?? "Standard",
            opp.PipelineStageId.ToString(),
            opp.PipelineStage?.Name ?? "Unknown",
            opp.AssignedUserId.ToString(),
            new UserSummaryDto(
                opp.AssignedUser?.Id.ToString() ?? "",
                opp.AssignedUser?.FirstName ?? "Unassigned",
                opp.AssignedUser?.LastName ?? "",
                opp.AssignedUser?.Email ?? "",
                opp.AssignedUser?.Role.ToString() ?? ""),
            opp.Value,
            opp.ExpectedCloseDate,
            opp.Probability,
            opp.Description,
            opp.CreatedAt,
            opp.UpdatedAt
        );
    }
}
