using FlowCRM.Domain.Common;

namespace FlowCRM.Domain.Entities;

public sealed class Contact : AuditableEntity
{
    public Guid CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? JobTitle { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public bool IsPrimary { get; set; }

    public string FullName => $"{FirstName} {LastName}".Trim();
}
