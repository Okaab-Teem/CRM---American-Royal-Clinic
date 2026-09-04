using FlowCRM.Application.Common.Interfaces;
using FlowCRM.Application.Common.Models;
using FlowCRM.Application.DTOs;
using FlowCRM.Application.Exceptions;
using FlowCRM.Domain.Entities;
using FlowCRM.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using TaskStatus = FlowCRM.Domain.Enums.TaskStatus;

namespace FlowCRM.Application.Services.Implementations;

public sealed class TaskService : ITaskService
{
    private readonly IApplicationDbContext _context;

    public TaskService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<TaskDto>> GetTasksAsync(QueryParams query, CancellationToken cancellationToken = default)
    {
        var taskQuery = _context.Tasks
            .Include(t => t.AssignedUser)
            .Include(t => t.Customer)
            .Include(t => t.Opportunity)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            taskQuery = taskQuery.Where(t =>
                t.Title.ToLower().Contains(search) ||
                (t.Customer != null && t.Customer.CompanyName.ToLower().Contains(search)) ||
                (t.Opportunity != null && t.Opportunity.Name.ToLower().Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(query.Status) && Enum.TryParse<TaskStatus>(query.Status, true, out var parsedStatus))
        {
            taskQuery = taskQuery.Where(t => t.Status == parsedStatus);
        }

        if (!string.IsNullOrWhiteSpace(query.CustomerId) && Guid.TryParse(query.CustomerId, out var custId))
        {
            taskQuery = taskQuery.Where(t => t.CustomerId == custId);
        }

        if (!string.IsNullOrWhiteSpace(query.OpportunityId) && Guid.TryParse(query.OpportunityId, out var oppId))
        {
            taskQuery = taskQuery.Where(t => t.OpportunityId == oppId);
        }

        if (!string.IsNullOrWhiteSpace(query.AssignedUserId) && Guid.TryParse(query.AssignedUserId, out var assignedId))
        {
            taskQuery = taskQuery.Where(t => t.AssignedUserId == assignedId);
        }

        var total = await taskQuery.CountAsync(cancellationToken);
        var page = query.GetPage();
        var pageSize = query.GetPageSize();

        var items = await taskQuery
            .OrderBy(t => t.DueDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<TaskDto>
        {
            Items = items.Select(MapToDto).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<TaskDto> CreateTaskAsync(CreateTaskDto dto, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["title"] = ["Task title is required."]
            });
        }

        Guid assignedGuid = currentUserId;
        if (!string.IsNullOrWhiteSpace(dto.AssignedUserId) && Guid.TryParse(dto.AssignedUserId, out var parsedAssigned))
        {
            assignedGuid = parsedAssigned;
        }

        var priority = TaskPriority.Medium;
        if (!string.IsNullOrWhiteSpace(dto.Priority) && Enum.TryParse<TaskPriority>(dto.Priority, true, out var parsedPriority))
        {
            priority = parsedPriority;
        }

        var task = new TaskItem
        {
            Title = dto.Title.Trim(),
            Description = dto.Description,
            DueDate = dto.DueDate,
            Priority = priority,
            Status = TaskStatus.Pending,
            AssignedUserId = assignedGuid,
            CreatedById = currentUserId
        };

        if (!string.IsNullOrWhiteSpace(dto.CustomerId) && Guid.TryParse(dto.CustomerId, out var custGuid))
        {
            task.CustomerId = custGuid;
        }

        if (!string.IsNullOrWhiteSpace(dto.OpportunityId) && Guid.TryParse(dto.OpportunityId, out var oppGuid))
        {
            task.OpportunityId = oppGuid;
        }

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync(cancellationToken);

        return await GetTaskByIdAsync(task.Id, cancellationToken);
    }

    public async Task<TaskDto> UpdateTaskStatusAsync(Guid id, string status, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
        if (task == null)
        {
            throw new NotFoundException($"Task '{id}' not found.");
        }

        if (!Enum.TryParse<TaskStatus>(status, true, out var newStatus))
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["status"] = [$"Invalid task status: '{status}'."]
            });
        }

        task.Status = newStatus;
        if (newStatus == TaskStatus.Completed)
        {
            task.CompletedAt = DateTime.UtcNow;

            var activity = new Activity
            {
                Type = ActivityType.TaskCompleted,
                Subject = $"Completed task: {task.Title}",
                Description = $"Marked task '{task.Title}' as completed.",
                ActivityDate = DateTime.UtcNow,
                UserId = currentUserId,
                CustomerId = task.CustomerId,
                OpportunityId = task.OpportunityId
            };
            _context.Activities.Add(activity);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return await GetTaskByIdAsync(id, cancellationToken);
    }

    private async Task<TaskDto> GetTaskByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var task = await _context.Tasks
            .Include(t => t.AssignedUser)
            .Include(t => t.Customer)
            .Include(t => t.Opportunity)
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        if (task == null) throw new NotFoundException($"Task '{id}' not found.");
        return MapToDto(task);
    }

    private static TaskDto MapToDto(TaskItem task)
    {
        return new TaskDto(
            task.Id.ToString(),
            task.Title,
            task.Description,
            task.DueDate,
            task.Priority.ToString(),
            task.Status.ToString(),
            task.AssignedUserId.ToString(),
            new UserSummaryDto(
                task.AssignedUser?.Id.ToString() ?? "",
                task.AssignedUser?.FirstName ?? "Unassigned",
                task.AssignedUser?.LastName ?? "",
                task.AssignedUser?.Email ?? "",
                task.AssignedUser?.Role.ToString() ?? ""),
            task.CustomerId?.ToString(),
            task.Customer?.CompanyName,
            task.OpportunityId?.ToString(),
            task.Opportunity?.Name,
            task.CreatedById.ToString(),
            task.CompletedAt
        );
    }
}
