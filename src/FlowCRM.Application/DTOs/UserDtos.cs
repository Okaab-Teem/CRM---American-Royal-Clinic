namespace FlowCRM.Application.DTOs;

public sealed record CreateUserDto(
    string FirstName,
    string LastName,
    string Email,
    string Password,
    string Role
);

public sealed record UpdateUserDto(
    string FirstName,
    string LastName,
    string Email,
    string Role,
    bool IsActive,
    string? Password = null
);
