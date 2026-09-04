using FlowCRM.Application.DTOs;

namespace FlowCRM.Application.Services;

public interface IUserService
{
    Task<IReadOnlyList<CurrentUserDto>> GetUsersAsync(CancellationToken cancellationToken = default);
    Task<CurrentUserDto> GetUserByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<CurrentUserDto> CreateUserAsync(CreateUserDto dto, CancellationToken cancellationToken = default);
    Task<CurrentUserDto> UpdateUserAsync(Guid id, UpdateUserDto dto, CancellationToken cancellationToken = default);
    Task DeleteUserAsync(Guid id, CancellationToken cancellationToken = default);
}
