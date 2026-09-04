using FlowCRM.Application.Common.Models;
using FlowCRM.Application.DTOs;

namespace FlowCRM.Application.Services;

public interface ICustomerService
{
    Task<PagedResult<CustomerDto>> GetCustomersAsync(QueryParams query, CancellationToken cancellationToken = default);
    Task<CustomerDto> GetCustomerByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<CustomerDto> CreateCustomerAsync(CreateCustomerDto dto, CancellationToken cancellationToken = default);
    Task<CustomerDto> UpdateCustomerAsync(Guid id, UpdateCustomerDto dto, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ActivityDto>> GetCustomerTimelineAsync(Guid id, CancellationToken cancellationToken = default);
}
