using FlowCRM.Application.DTOs;

namespace FlowCRM.Application.Services;

public interface IDashboardService
{
    Task<DashboardDto> GetDashboardAsync(CancellationToken cancellationToken = default);
}
