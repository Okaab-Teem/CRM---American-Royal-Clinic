using FlowCRM.Application.DTOs;

namespace FlowCRM.Application.Services;

public interface IAuthService
{
    Task<LoginResultDto> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<CurrentUserDto> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default);
}
