using FlowCRM.Application.Services.Implementations;
using FlowCRM.Domain.Entities;
using FlowCRM.Domain.Enums;
using FlowCRM.Infrastructure.Persistence;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace FlowCRM.Tests;

public sealed class OpportunityAndPipelineTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly FlowCrmDbContext _context;
    private readonly OpportunityService _oppService;
    private readonly DashboardService _dashboardService;
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _pipelineId = Guid.NewGuid();
    private readonly Guid _stage1Id = Guid.NewGuid();
    private readonly Guid _stage2Id = Guid.NewGuid();
    private readonly Guid _stageWonId = Guid.NewGuid();
    private readonly Customer _customer;

    public OpportunityAndPipelineTests()
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
            FirstName = "Sales",
            LastName = "Person",
            Email = "sales@clinic.local",
            Role = UserRole.SalesRepresentative
        };
        _context.Users.Add(user);

        var pipeline = new Pipeline
        {
            Id = _pipelineId,
            Name = "Clinic Sales",
            IsDefault = true,
            Stages = new List<PipelineStage>
            {
                new() { Id = _stage1Id, PipelineId = _pipelineId, Name = "Qualification", Order = 1, Probability = 25 },
                new() { Id = _stage2Id, PipelineId = _pipelineId, Name = "Negotiation", Order = 2, Probability = 75 },
                new() { Id = _stageWonId, PipelineId = _pipelineId, Name = "Closed Won", Order = 3, Probability = 100 }
            }
        };
        _context.Pipelines.Add(pipeline);

        _customer = new Customer
        {
            Id = Guid.NewGuid(),
            CompanyName = "Royal Care Clinic",
            AssignedUserId = _userId
        };
        _context.Customers.Add(_customer);

        _context.SaveChanges();

        _oppService = new OpportunityService(_context);
        _dashboardService = new DashboardService(_context);
    }

    [Fact]
    public async Task Move_opportunity_stage_updates_stage_probability_and_logs_activity()
    {
        var opp = new Opportunity
        {
            Name = "Clinic Software Suite",
            CustomerId = _customer.Id,
            PipelineId = _pipelineId,
            PipelineStageId = _stage1Id,
            AssignedUserId = _userId,
            Value = 50000m,
            Probability = 25
        };
        _context.Opportunities.Add(opp);
        await _context.SaveChangesAsync();

        var result = await _oppService.MoveOpportunityStageAsync(opp.Id, _stage2Id, _userId);

        Assert.NotNull(result);
        Assert.Equal(_stage2Id.ToString(), result.PipelineStageId);
        Assert.Equal("Negotiation", result.StageName);
        Assert.Equal(75, result.Probability);

        var activity = await _context.Activities.FirstOrDefaultAsync(a => a.Type == ActivityType.StageChange);
        Assert.NotNull(activity);
        Assert.Equal(opp.Id, activity.OpportunityId);
        Assert.Contains("Negotiation", activity.Subject);
    }

    [Fact]
    public async Task Dashboard_service_computes_accurate_aggregates()
    {
        // Add Won opp
        var wonOpp = new Opportunity
        {
            Name = "Won Deal",
            CustomerId = _customer.Id,
            PipelineId = _pipelineId,
            PipelineStageId = _stageWonId,
            AssignedUserId = _userId,
            Value = 30000m,
            Probability = 100
        };
        // Add Active opp
        var activeOpp = new Opportunity
        {
            Name = "Active Deal",
            CustomerId = _customer.Id,
            PipelineId = _pipelineId,
            PipelineStageId = _stage1Id,
            AssignedUserId = _userId,
            Value = 20000m,
            Probability = 25
        };
        // Add Lead
        var lead = new Lead
        {
            FirstName = "Test",
            LastName = "Lead",
            CompanyName = "Lead Corp",
            SourceName = "Referral",
            Status = LeadStatus.New
        };

        _context.Opportunities.AddRange(wonOpp, activeOpp);
        _context.Leads.Add(lead);
        await _context.SaveChangesAsync();

        var dashboard = await _dashboardService.GetDashboardAsync();

        Assert.Equal(1, dashboard.TotalLeads);
        Assert.Equal(1, dashboard.ActiveOpportunities);
        Assert.Equal(20000m, dashboard.PipelineValue);
        Assert.Equal(30000m, dashboard.WonRevenue);
        Assert.Contains(dashboard.LeadsBySource, s => s.Source == "Referral" && s.Count == 1);
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }
}
