namespace FlowCRM.Application.DTOs;

public sealed record TaskDto(
    string Id,
    string Title,
    string? Description,
    DateTime DueDate,
    string Priority,
    string Status,
    string AssignedUserId,
    UserSummaryDto AssignedUser,
    string? CustomerId,
    string? CustomerName,
    string? OpportunityId,
    string? OpportunityName,
    string CreatedById,
    DateTime? CompletedAt
);

public sealed record CreateTaskDto(
    string Title,
    string? Description,
    DateTime DueDate,
    string Priority,
    string AssignedUserId,
    string? CustomerId,
    string? OpportunityId
);

public sealed record UpdateTaskStatusDto(
    string Status
);
