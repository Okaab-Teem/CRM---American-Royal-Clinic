using FlowCRM.Application.Common.Models;
using FlowCRM.Application.DTOs;

namespace FlowCRM.Application.Services;

public interface IActivityService
{
    Task<PagedResult<ActivityDto>> GetActivitiesAsync(QueryParams query, CancellationToken cancellationToken = default);
    Task<ActivityDto> CreateActivityAsync(CreateActivityDto dto, Guid currentUserId, CancellationToken cancellationToken = default);
}
