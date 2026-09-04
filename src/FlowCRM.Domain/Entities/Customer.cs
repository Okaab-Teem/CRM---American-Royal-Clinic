using FlowCRM.Domain.Common;

namespace FlowCRM.Domain.Entities;

public sealed class Customer : AuditableEntity
{
    public string CompanyName { get; set; } = string.Empty;
    public string? Industry { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Website { get; set; }
    public string? Address { get; set; }
    public Guid? AssignedUserId { get; set; }
    public User? AssignedUser { get; set; }
    public string Status { get; set; } = "Active";

    public ICollection<Contact> Contacts { get; set; } = new List<Contact>();
    public ICollection<Opportunity> Opportunities { get; set; } = new List<Opportunity>();
    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    public ICollection<Activity> Activities { get; set; } = new List<Activity>();
}
