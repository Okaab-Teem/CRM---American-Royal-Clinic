using FlowCRM.Application.Common.Models;
using FlowCRM.Application.DTOs;

namespace FlowCRM.Application.Services;

public interface ITaskService
{
    Task<PagedResult<TaskDto>> GetTasksAsync(QueryParams query, CancellationToken cancellationToken = default);
    Task<TaskDto> CreateTaskAsync(CreateTaskDto dto, Guid currentUserId, CancellationToken cancellationToken = default);
    Task<TaskDto> UpdateTaskStatusAsync(Guid id, string status, Guid currentUserId, CancellationToken cancellationToken = default);
}
