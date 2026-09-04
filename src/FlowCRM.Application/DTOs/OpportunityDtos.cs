namespace FlowCRM.Application.DTOs;

public sealed record PipelineStageDto(
    string Id,
    string Name,
    int Order,
    int Probability
);

public sealed record OpportunityDto(
    string Id,
    string Name,
    string CustomerId,
    string CustomerName,
    string? LeadId,
    string PipelineId,
    string PipelineName,
    string PipelineStageId,
    string StageName,
    string AssignedUserId,
    UserSummaryDto AssignedUser,
    decimal Value,
    DateTime? ExpectedCloseDate,
    int Probability,
    string? Description,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public sealed record CreateOpportunityDto(
    string Name,
    string CustomerId,
    string? LeadId,
    string PipelineId,
    string PipelineStageId,
    string AssignedUserId,
    decimal Value,
    DateTime? ExpectedCloseDate,
    int Probability,
    string? Description
);

public sealed record UpdateOpportunityDto(
    string Name,
    string CustomerId,
    string PipelineId,
    string PipelineStageId,
    string AssignedUserId,
    decimal Value,
    DateTime? ExpectedCloseDate,
    int Probability,
    string? Description
);

public sealed record MoveOpportunityStageDto(
    string PipelineStageId
);
