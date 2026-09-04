namespace FlowCRM.Application.DTOs;

public sealed record PipelineStageMetricDto(string Name, int Count, decimal Value);
public sealed record LeadSourceMetricDto(string Source, int Count);
public sealed record RevenueByMonthMetricDto(string Month, decimal Revenue);

public sealed record DashboardDto(
    int TotalLeads,
    int ActiveOpportunities,
    decimal PipelineValue,
    decimal WonRevenue,
    int TasksDueToday,
    IReadOnlyList<PipelineStageMetricDto> PipelineStages,
    IReadOnlyList<LeadSourceMetricDto> LeadsBySource,
    IReadOnlyList<RevenueByMonthMetricDto> RevenueByMonth,
    IReadOnlyList<ActivityDto> RecentActivities
);
