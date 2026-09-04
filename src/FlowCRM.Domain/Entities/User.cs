using FlowCRM.Domain.Common;
using FlowCRM.Domain.Enums;

namespace FlowCRM.Domain.Entities;

public sealed class User : AuditableEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.SalesRepresentative;
    public bool IsActive { get; set; } = true;
    public string PermissionsJson { get; set; } = "[]";

    public string FullName => $"{FirstName} {LastName}".Trim();
}
