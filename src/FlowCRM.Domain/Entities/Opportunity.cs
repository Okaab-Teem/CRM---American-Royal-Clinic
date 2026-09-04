using FlowCRM.Domain.Common;

namespace FlowCRM.Domain.Entities;

public sealed class Opportunity : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public Guid CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public Guid? LeadId { get; set; }
    public Guid PipelineId { get; set; }
    public Pipeline? Pipeline { get; set; }
    public Guid PipelineStageId { get; set; }
    public PipelineStage? PipelineStage { get; set; }
    public Guid AssignedUserId { get; set; }
    public User? AssignedUser { get; set; }
    public decimal Value { get; set; }
    public int Probability { get; set; }
    public DateTime? ExpectedCloseDate { get; set; }
    public string? Description { get; set; }

    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    public ICollection<Activity> Activities { get; set; } = new List<Activity>();
}
