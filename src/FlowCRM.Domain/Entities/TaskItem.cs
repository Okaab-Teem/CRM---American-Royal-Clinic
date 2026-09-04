using FlowCRM.Domain.Common;
using FlowCRM.Domain.Enums;
using TaskStatus = FlowCRM.Domain.Enums.TaskStatus;

namespace FlowCRM.Domain.Entities;

public sealed class TaskItem : AuditableEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime DueDate { get; set; }
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    public TaskStatus Status { get; set; } = TaskStatus.Pending;

    public Guid AssignedUserId { get; set; }
    public User? AssignedUser { get; set; }

    public Guid CreatedById { get; set; }
    public User? CreatedBy { get; set; }

    public Guid? CustomerId { get; set; }
    public Customer? Customer { get; set; }

    public Guid? OpportunityId { get; set; }
    public Opportunity? Opportunity { get; set; }

    public DateTime? CompletedAt { get; set; }
}
