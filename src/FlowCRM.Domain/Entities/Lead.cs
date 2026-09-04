using FlowCRM.Domain.Common;
using FlowCRM.Domain.Enums;

namespace FlowCRM.Domain.Entities;

public sealed class Lead : AuditableEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public int? SourceId { get; set; }
    public string? SourceName { get; set; }
    public LeadStatus Status { get; set; } = LeadStatus.New;
    public Guid? AssignedUserId { get; set; }
    public User? AssignedUser { get; set; }
    public decimal EstimatedValue { get; set; }
    public string? Notes { get; set; }
    public Guid? ConvertedCustomerId { get; set; }
    public Guid? ConvertedOpportunityId { get; set; }

    public string FullName => $"{FirstName} {LastName}".Trim();
}
