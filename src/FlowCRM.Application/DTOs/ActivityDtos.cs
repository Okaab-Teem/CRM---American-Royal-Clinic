namespace FlowCRM.Application.DTOs;

public sealed record ActivityDto(
    string Id,
    string Type,
    string Subject,
    string? Description,
    DateTime ActivityDate,
    UserSummaryDto User,
    string? CustomerId,
    string? CustomerName,
    string? OpportunityId,
    string? OpportunityName
);

public sealed record CreateActivityDto(
    string Type,
    string Subject,
    string? Description,
    DateTime? ActivityDate,
    string? CustomerId,
    string? OpportunityId
);
