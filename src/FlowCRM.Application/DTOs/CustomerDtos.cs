namespace FlowCRM.Application.DTOs;

public sealed record ContactDto(
    string Id,
    string CustomerId,
    string FirstName,
    string LastName,
    string? JobTitle,
    string? Email,
    string? Phone,
    bool IsPrimary
);

public sealed record CustomerDto(
    string Id,
    string CompanyName,
    string? Industry,
    string? Email,
    string? Phone,
    string? Website,
    string? Address,
    string? AssignedUserId,
    UserSummaryDto? AssignedUser,
    string Status,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public sealed record CreateCustomerDto(
    string CompanyName,
    string? Industry,
    string? Email,
    string? Phone,
    string? Website,
    string? Address,
    string? AssignedUserId,
    string? Status
);

public sealed record UpdateCustomerDto(
    string CompanyName,
    string? Industry,
    string? Email,
    string? Phone,
    string? Website,
    string? Address,
    string? AssignedUserId,
    string? Status
);
