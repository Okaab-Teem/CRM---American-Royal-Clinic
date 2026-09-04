using FlowCRM.Application.DTOs;
using FlowCRM.Application.Exceptions;
using FlowCRM.Application.Services.Implementations;
using FlowCRM.Domain.Entities;
using FlowCRM.Domain.Enums;
using FlowCRM.Infrastructure.Persistence;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using TaskStatus = FlowCRM.Domain.Enums.TaskStatus;

namespace FlowCRM.Tests;

public sealed class TaskAndCustomerTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly FlowCrmDbContext _context;
    private readonly TaskService _taskService;
    private readonly CustomerService _customerService;
    private readonly Guid _userId = Guid.NewGuid();

    public TaskAndCustomerTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<FlowCrmDbContext>()
            .UseSqlite(_connection)
            .Options;

        _context = new FlowCrmDbContext(options);
        _context.Database.EnsureCreated();

        var user = new User
        {
            Id = _userId,
            FirstName = "Mariam",
            LastName = "Saleh",
            Email = "manager@flowcrm.local",
            Role = UserRole.Manager
        };
        _context.Users.Add(user);
        _context.SaveChanges();

        _taskService = new TaskService(_context);
        _customerService = new CustomerService(_context);
    }

    [Fact]
    public async Task Customer_creation_and_timeline_retrieval_works()
    {
        var dto = new CreateCustomerDto(
            "Al-Ahly Healthcare",
            "Healthcare",
            "contact@alahlyhealth.example",
            "+20 2 3300 4400",
            "https://alahlyhealth.example",
            "Zamalek, Cairo",
            _userId.ToString(),
            "Active"
        );

        var customer = await _customerService.CreateCustomerAsync(dto);
        Assert.NotNull(customer);
        Assert.Equal("Al-Ahly Healthcare", customer.CompanyName);

        // Add activity
        _context.Activities.Add(new Activity
        {
            Type = ActivityType.Meeting,
            Subject = "Kickoff Strategy Meeting",
            Description = "Discussed requirements for clinic automation.",
            UserId = _userId,
            CustomerId = Guid.Parse(customer.Id),
            ActivityDate = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var timeline = await _customerService.GetCustomerTimelineAsync(Guid.Parse(customer.Id));
        Assert.Single(timeline);
        Assert.Equal("Kickoff Strategy Meeting", timeline.First().Subject);
    }

    [Fact]
    public async Task Task_creation_and_completion_lifecycle_works()
    {
        var taskDto = new CreateTaskDto(
            "Review diagnostic contract",
            "Urgent contract signoff",
            DateTime.UtcNow.AddDays(1),
            "Urgent",
            _userId.ToString(),
            null,
            null
        );

        var created = await _taskService.CreateTaskAsync(taskDto, _userId);
        Assert.NotNull(created);
        Assert.Equal("Pending", created.Status);
        Assert.Equal("Urgent", created.Priority);

        var completed = await _taskService.UpdateTaskStatusAsync(Guid.Parse(created.Id), "Completed", _userId);
        Assert.Equal("Completed", completed.Status);
        Assert.NotNull(completed.CompletedAt);

        // Activity should be created for task completion
        var activity = await _context.Activities.FirstOrDefaultAsync(a => a.Type == ActivityType.TaskCompleted);
        Assert.NotNull(activity);
        Assert.Contains("Review diagnostic contract", activity.Subject);
    }

    [Fact]
    public async Task Customer_creation_with_phone_greater_than_11_digits_throws_validation_exception()
    {
        var dto = new CreateCustomerDto(
            "Excess Digits Gym",
            "Fitness",
            "info@excessgym.com",
            "010296846855", // 12 digits (> 11)
            null,
            null,
            null,
            "Active"
        );

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _customerService.CreateCustomerAsync(dto));
        Assert.Contains("phone", ex.Details.Keys);
        Assert.Contains("cannot exceed 11 digits", ex.Details["phone"][0]);
    }

    [Fact]
    public async Task Customer_creation_with_valid_11_digit_phone_succeeds()
    {
        var dto = new CreateCustomerDto(
            "Valid 11 Digits Gym",
            "Fitness",
            "valid@gym11.com",
            "01012345678", // Exactly 11 digits
            null,
            null,
            null,
            "Active"
        );

        var customer = await _customerService.CreateCustomerAsync(dto);
        Assert.NotNull(customer);
        Assert.Equal("01012345678", customer.Phone);
    }

    [Fact]
    public async Task Customer_update_with_phone_greater_than_11_digits_throws_validation_exception()
    {
        var createDto = new CreateCustomerDto(
            "Update Gym Test",
            "Fitness",
            "update@gym.com",
            "01112345678", // 11 digits
            null,
            null,
            null,
            "Active"
        );

        var created = await _customerService.CreateCustomerAsync(createDto);

        var updateDto = new UpdateCustomerDto(
            created.CompanyName,
            created.Industry,
            created.Email,
            "0109999888877", // 13 digits (> 11)
            null,
            null,
            null,
            created.Status
        );

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _customerService.UpdateCustomerAsync(Guid.Parse(created.Id), updateDto));
        Assert.Contains("phone", ex.Details.Keys);
        Assert.Contains("cannot exceed 11 digits", ex.Details["phone"][0]);
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }
}
