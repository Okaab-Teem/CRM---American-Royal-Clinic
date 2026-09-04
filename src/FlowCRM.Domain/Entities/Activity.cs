using FlowCRM.Domain.Common;
using FlowCRM.Domain.Enums;

namespace FlowCRM.Domain.Entities;

public sealed class Activity : Entity
{
    public ActivityType Type { get; set; } = ActivityType.Note;
    public string Subject { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime ActivityDate { get; set; } = DateTime.UtcNow;

    public Guid UserId { get; set; }
    public User? User { get; set; }

    public Guid? CustomerId { get; set; }
    public Customer? Customer { get; set; }

    public Guid? OpportunityId { get; set; }
    public Opportunity? Opportunity { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
