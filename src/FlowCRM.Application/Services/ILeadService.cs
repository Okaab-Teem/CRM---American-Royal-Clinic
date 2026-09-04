using FlowCRM.Application.Common.Models;
using FlowCRM.Application.DTOs;

namespace FlowCRM.Application.Services;

public interface ILeadService
{
    Task<PagedResult<LeadDto>> GetLeadsAsync(QueryParams query, CancellationToken cancellationToken = default);
    Task<LeadDto> GetLeadByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<LeadDto> CreateLeadAsync(CreateLeadDto dto, Guid? currentUserId, CancellationToken cancellationToken = default);
    Task<LeadDto> UpdateLeadAsync(Guid id, UpdateLeadDto dto, CancellationToken cancellationToken = default);
    Task DeleteLeadAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ConvertLeadResultDto> ConvertLeadAsync(Guid id, ConvertLeadDto dto, Guid currentUserId, CancellationToken cancellationToken = default);
}
