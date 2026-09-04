using FlowCRM.Application.Common.Interfaces;
using FlowCRM.Application.DTOs;
using Microsoft.EntityFrameworkCore;
using TaskStatus = FlowCRM.Domain.Enums.TaskStatus;

namespace FlowCRM.Application.Services.Implementations;

public sealed class DashboardService : IDashboardService
{
    private readonly IApplicationDbContext _context;

    public DashboardService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardDto> GetDashboardAsync(CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;

        var totalLeads = await _context.Leads.CountAsync(cancellationToken);

        var opportunities = await _context.Opportunities
            .Include(o => o.PipelineStage)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var activeOpps = opportunities
            .Where(o => o.PipelineStage == null || (!o.PipelineStage.Name.Contains("Won", StringComparison.OrdinalIgnoreCase) && !o.PipelineStage.Name.Contains("Lost", StringComparison.OrdinalIgnoreCase)))
            .ToList();

        var wonOpps = opportunities
            .Where(o => o.PipelineStage != null && o.PipelineStage.Name.Contains("Won", StringComparison.OrdinalIgnoreCase))
            .ToList();

        var activeOppCount = activeOpps.Count;
        var pipelineValue = activeOpps.Sum(o => o.Value);
        var wonRevenue = wonOpps.Sum(o => o.Value);

        var tasksDueToday = await _context.Tasks
            .CountAsync(t => t.Status != TaskStatus.Completed && t.DueDate.Date == today, cancellationToken);

        // Group by pipeline stage
        var allStages = await _context.PipelineStages.AsNoTracking().OrderBy(s => s.Order).ToListAsync(cancellationToken);
        var stageMetrics = allStages.Select(s =>
        {
            var oppsInStage = opportunities.Where(o => o.PipelineStageId == s.Id).ToList();
            return new PipelineStageMetricDto(s.Name, oppsInStage.Count, oppsInStage.Sum(o => o.Value));
        }).ToList();

        // Leads by source
        var leads = await _context.Leads.AsNoTracking().ToListAsync(cancellationToken);
        var sourceMetrics = leads
            .GroupBy(l => string.IsNullOrWhiteSpace(l.SourceName) ? "Other" : l.SourceName)
            .Select(g => new LeadSourceMetricDto(g.Key, g.Count()))
            .OrderByDescending(g => g.Count)
            .ToList();

        // Revenue by month (last 6 months)
        var sixMonthsAgo = today.AddMonths(-5);
        var revenueByMonth = new List<RevenueByMonthMetricDto>();
        for (int i = 0; i < 6; i++)
        {
            var monthDate = sixMonthsAgo.AddMonths(i);
            var monthName = monthDate.ToString("MMM yyyy");
            var monthRevenue = wonOpps
                .Where(o => o.CreatedAt.Year == monthDate.Year && o.CreatedAt.Month == monthDate.Month)
                .Sum(o => o.Value);

            revenueByMonth.Add(new RevenueByMonthMetricDto(monthName, monthRevenue));
        }

        // Recent activities (top 5)
        var recentActs = await _context.Activities
            .Include(a => a.User)
            .Include(a => a.Customer)
            .Include(a => a.Opportunity)
            .AsNoTracking()
            .OrderByDescending(a => a.ActivityDate)
            .Take(5)
            .ToListAsync(cancellationToken);

        var recentActDtos = recentActs.Select(a => new ActivityDto(
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
        )).ToList();

        return new DashboardDto(
            totalLeads,
            activeOppCount,
            pipelineValue,
            wonRevenue,
            tasksDueToday,
            stageMetrics,
            sourceMetrics,
            revenueByMonth,
            recentActDtos
        );
    }
}
