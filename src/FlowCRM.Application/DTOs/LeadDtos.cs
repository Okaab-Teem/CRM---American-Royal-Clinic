namespace FlowCRM.Application.DTOs;

public sealed record LeadDto(
    string Id,
    string FirstName,
    string LastName,
    string CompanyName,
    string? Email,
    string? Phone,
    int? SourceId,
    string? SourceName,
    string Status,
    string? AssignedUserId,
    UserSummaryDto? AssignedUser,
    decimal EstimatedValue,
    string? Notes,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public sealed record CreateLeadDto(
    string FirstName,
    string LastName,
    string CompanyName,
    string? Email,
    string? Phone,
    int? SourceId,
    string? SourceName,
    string? Status,
    string? AssignedUserId,
    decimal? EstimatedValue,
    string? Notes
);

public sealed record UpdateLeadDto(
    string FirstName,
    string LastName,
    string CompanyName,
    string? Email,
    string? Phone,
    int? SourceId,
    string? SourceName,
    string? Status,
    string? AssignedUserId,
    decimal? EstimatedValue,
    string? Notes
);

public sealed record ConvertLeadDto(
    decimal? EstimatedValue,
    DateTime? ExpectedCloseDate,
    string? Notes
);

public sealed record ConvertLeadResultDto(
    string CustomerId,
    string OpportunityId
);
