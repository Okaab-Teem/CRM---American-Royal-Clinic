namespace FlowCRM.Application.DTOs;

public sealed record LoginRequest(string Email, string Password);

public sealed record UserSummaryDto(
    string Id,
    string FirstName,
    string LastName,
    string Email,
    string Role
);

public sealed record CurrentUserDto(
    string Id,
    string FirstName,
    string LastName,
    string Email,
    string Role,
    bool IsActive,
    IReadOnlyList<string> Permissions
);

public sealed record LoginResultDto(
    string Token,
    CurrentUserDto User
);
