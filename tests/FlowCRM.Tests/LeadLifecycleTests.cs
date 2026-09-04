using FlowCRM.Application.Common.Models;
using FlowCRM.Application.DTOs;
using FlowCRM.Application.Exceptions;
using FlowCRM.Application.Services.Implementations;
using FlowCRM.Domain.Entities;
using FlowCRM.Domain.Enums;
using FlowCRM.Infrastructure.Persistence;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace FlowCRM.Tests;

public sealed class LeadLifecycleTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly FlowCrmDbContext _context;
    private readonly LeadService _leadService;
    private readonly Guid _userId = Guid.NewGuid();

    public LeadLifecycleTests()
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
            FirstName = "Test",
            LastName = "Rep",
            Email = "rep@test.local",
            PasswordHash = "hash",
            Role = UserRole.SalesRepresentative
        };
        _context.Users.Add(user);

        var pipeline = new Pipeline
        {
            Id = Guid.NewGuid(),
            Name = "Default Pipeline",
            IsDefault = true,
            Stages = new List<PipelineStage>
            {
                new() { Id = Guid.NewGuid(), Name = "Qualification", Order = 1, Probability = 20 },
                new() { Id = Guid.NewGuid(), Name = "Closed Won", Order = 2, Probability = 100 }
            }
        };
        _context.Pipelines.Add(pipeline);
        _context.SaveChanges();

        _leadService = new LeadService(_context);
    }

    [Fact]
    public async Task Create_lead_persists_and_returns_dto()
    {
        var dto = new CreateLeadDto(
            "Amr",
            "Diab",
            "Diab Media",
            "amr@diabmedia.example",
            "+20 100 000 0001",
            1,
            "Website",
            "New",
            _userId.ToString(),
            50000m,
            "Initial inquiry"
        );

        var result = await _leadService.CreateLeadAsync(dto, _userId);

        Assert.NotNull(result);
        Assert.Equal("Amr", result.FirstName);
        Assert.Equal("Diab Media", result.CompanyName);
        Assert.Equal("New", result.Status);
        Assert.Equal(50000m, result.EstimatedValue);
    }

    [Fact]
    public async Task Convert_lead_creates_customer_contact_opportunity_and_activity()
    {
        var lead = new Lead
        {
            FirstName = "Nour",
            LastName = "Sherif",
            CompanyName = "Nour Medical",
            Email = "nour@nourmed.example",
            Phone = "+20 122 000 0002",
            Status = LeadStatus.Qualified,
            AssignedUserId = _userId,
            EstimatedValue = 80000m
        };
        _context.Leads.Add(lead);
        await _context.SaveChangesAsync();

        var convertDto = new ConvertLeadDto(85000m, DateTime.UtcNow.AddDays(30), "Converted from qualified lead");
        var result = await _leadService.ConvertLeadAsync(lead.Id, convertDto, _userId);

        Assert.NotNull(result);
        Assert.False(string.IsNullOrWhiteSpace(result.CustomerId));
        Assert.False(string.IsNullOrWhiteSpace(result.OpportunityId));

        // Verify Customer
        var customer = await _context.Customers.Include(c => c.Contacts).FirstOrDefaultAsync(c => c.Id == Guid.Parse(result.CustomerId));
        Assert.NotNull(customer);
        Assert.Equal("Nour Medical", customer.CompanyName);
        Assert.Single(customer.Contacts);
        Assert.True(customer.Contacts.First().IsPrimary);

        // Verify Opportunity
        var opp = await _context.Opportunities.FindAsync(Guid.Parse(result.OpportunityId));
        Assert.NotNull(opp);
        Assert.Equal(85000m, opp.Value);

        // Verify Activity
        var activity = await _context.Activities.FirstOrDefaultAsync(a => a.Type == ActivityType.LeadConverted);
        Assert.NotNull(activity);
        Assert.Equal(customer.Id, activity.CustomerId);

        // Verify Lead status updated
        var updatedLead = await _context.Leads.FindAsync(lead.Id);
        Assert.NotNull(updatedLead);
        Assert.Equal(LeadStatus.Converted, updatedLead.Status);
    }

    [Fact]
    public async Task Converting_already_converted_lead_throws_conflict_exception()
    {
        var lead = new Lead
        {
            FirstName = "Hany",
            LastName = "Adel",
            CompanyName = "Adel Systems",
            Status = LeadStatus.Converted
        };
        _context.Leads.Add(lead);
        await _context.SaveChangesAsync();

        var convertDto = new ConvertLeadDto(10000m, null, null);

        await Assert.ThrowsAsync<ConflictException>(() =>
            _leadService.ConvertLeadAsync(lead.Id, convertDto, _userId));
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }
}
