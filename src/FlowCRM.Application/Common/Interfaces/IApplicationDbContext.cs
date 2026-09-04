using FlowCRM.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FlowCRM.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<LeadSource> LeadSources { get; }
    DbSet<Lead> Leads { get; }
    DbSet<Customer> Customers { get; }
    DbSet<Contact> Contacts { get; }
    DbSet<Pipeline> Pipelines { get; }
    DbSet<PipelineStage> PipelineStages { get; }
    DbSet<Opportunity> Opportunities { get; }
    DbSet<TaskItem> Tasks { get; }
    DbSet<Activity> Activities { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<Product> Products { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
