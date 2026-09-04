using FlowCRM.Application.Common.Models;
using FlowCRM.Application.DTOs;

namespace FlowCRM.Application.Services;

public interface IOpportunityService
{
    Task<PagedResult<OpportunityDto>> GetOpportunitiesAsync(QueryParams query, CancellationToken cancellationToken = default);
    Task<OpportunityDto> GetOpportunityByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<OpportunityDto> CreateOpportunityAsync(CreateOpportunityDto dto, CancellationToken cancellationToken = default);
    Task<OpportunityDto> UpdateOpportunityAsync(Guid id, UpdateOpportunityDto dto, CancellationToken cancellationToken = default);
    Task<OpportunityDto> MoveOpportunityStageAsync(Guid id, Guid newStageId, Guid currentUserId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PipelineStageDto>> GetPipelineStagesAsync(Guid? pipelineId = null, CancellationToken cancellationToken = default);
}
