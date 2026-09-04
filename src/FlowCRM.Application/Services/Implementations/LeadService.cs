using FlowCRM.Application.Common.Interfaces;
using FlowCRM.Application.Common.Models;
using FlowCRM.Application.DTOs;
using FlowCRM.Application.Exceptions;
using FlowCRM.Domain.Entities;
using FlowCRM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace FlowCRM.Application.Services.Implementations;

public sealed class LeadService : ILeadService
{
    private static readonly SemaphoreSlim _leadCreationLock = new(1, 1);
    private static readonly SemaphoreSlim _leadConversionLock = new(1, 1);
    private readonly IApplicationDbContext _context;

    public LeadService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<LeadDto>> GetLeadsAsync(QueryParams query, CancellationToken cancellationToken = default)
    {
        var leadsQuery = _context.Leads
            .Include(l => l.AssignedUser)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            leadsQuery = leadsQuery.Where(l =>
                l.FirstName.ToLower().Contains(search) ||
                l.LastName.ToLower().Contains(search) ||
                l.CompanyName.ToLower().Contains(search) ||
                (l.Email != null && l.Email.ToLower().Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(query.Status) && Enum.TryParse<LeadStatus>(query.Status, true, out var statusEnum))
        {
            leadsQuery = leadsQuery.Where(l => l.Status == statusEnum);
        }

        if (!string.IsNullOrWhiteSpace(query.AssignedUserId) && Guid.TryParse(query.AssignedUserId, out var assignedId))
        {
            leadsQuery = leadsQuery.Where(l => l.AssignedUserId == assignedId);
        }

        var total = await leadsQuery.CountAsync(cancellationToken);

        var page = query.GetPage();
        var pageSize = query.GetPageSize();

        var items = await leadsQuery
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = items.Select(MapToDto).ToList();

        return new PagedResult<LeadDto>
        {
            Items = dtos,
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<LeadDto> GetLeadByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var lead = await _context.Leads
            .Include(l => l.AssignedUser)
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == id, cancellationToken);

        if (lead == null)
        {
            throw new NotFoundException($"Lead '{id}' not found.");
        }

        return MapToDto(lead);
    }

    public async Task<LeadDto> CreateLeadAsync(CreateLeadDto dto, Guid? currentUserId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.FirstName) || string.IsNullOrWhiteSpace(dto.LastName) || string.IsNullOrWhiteSpace(dto.CompanyName))
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["name"] = ["First name, last name, and company name are required."]
            });
        }

        Guid? assignedGuid = null;
        if (!string.IsNullOrWhiteSpace(dto.AssignedUserId) && Guid.TryParse(dto.AssignedUserId, out var parsedUser))
        {
            assignedGuid = parsedUser;
        }
        else if (currentUserId.HasValue)
        {
            assignedGuid = currentUserId.Value;
        }

        var status = LeadStatus.New;
        if (!string.IsNullOrWhiteSpace(dto.Status) && Enum.TryParse<LeadStatus>(dto.Status, true, out var parsedStatus))
        {
            status = parsedStatus;
        }

        await _leadCreationLock.WaitAsync(cancellationToken);
        try
        {
            // Deduplication Check: prevent duplicate active leads with same Email or Phone
            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                var normalizedEmail = dto.Email.Trim().ToLower();
                var existingEmailLead = await _context.Leads
                    .AsNoTracking()
                    .FirstOrDefaultAsync(l => l.Email != null && l.Email.ToLower() == normalizedEmail && l.Status != LeadStatus.Unqualified && l.Status != LeadStatus.Converted, cancellationToken);

                if (existingEmailLead != null)
                {
                    throw new ConflictException($"An active lead with email '{dto.Email}' already exists (Lead ID: {existingEmailLead.Id}, Company: {existingEmailLead.CompanyName}).");
                }
            }

            if (!string.IsNullOrWhiteSpace(dto.Phone))
            {
                var normalizedPhone = dto.Phone.Trim();
                var existingPhoneLead = await _context.Leads
                    .AsNoTracking()
                    .FirstOrDefaultAsync(l => l.Phone != null && l.Phone == normalizedPhone && l.Status != LeadStatus.Unqualified && l.Status != LeadStatus.Converted, cancellationToken);

                if (existingPhoneLead != null)
                {
                    throw new ConflictException($"An active lead with phone '{dto.Phone}' already exists (Lead ID: {existingPhoneLead.Id}, Company: {existingPhoneLead.CompanyName}).");
                }
            }

            var lead = new Lead
            {
                FirstName = dto.FirstName.Trim(),
                LastName = dto.LastName.Trim(),
                CompanyName = dto.CompanyName.Trim(),
                Email = dto.Email?.Trim(),
                Phone = dto.Phone?.Trim(),
                SourceId = dto.SourceId,
                SourceName = dto.SourceName ?? "Website",
                Status = status,
                AssignedUserId = assignedGuid,
                EstimatedValue = dto.EstimatedValue ?? 0,
                Notes = dto.Notes
            };

            _context.Leads.Add(lead);
            await _context.SaveChangesAsync(cancellationToken);

            // Fetch with user if assigned
            if (assignedGuid.HasValue)
            {
                lead.AssignedUser = await _context.Users.FindAsync([assignedGuid.Value], cancellationToken);
            }

            return MapToDto(lead);
        }
        finally
        {
            _leadCreationLock.Release();
        }
    }

    public async Task<LeadDto> UpdateLeadAsync(Guid id, UpdateLeadDto dto, CancellationToken cancellationToken = default)
    {
        var lead = await _context.Leads
            .Include(l => l.AssignedUser)
            .FirstOrDefaultAsync(l => l.Id == id, cancellationToken);

        if (lead == null)
        {
            throw new NotFoundException($"Lead '{id}' not found.");
        }

        lead.FirstName = dto.FirstName.Trim();
        lead.LastName = dto.LastName.Trim();
        lead.CompanyName = dto.CompanyName.Trim();
        lead.Email = dto.Email?.Trim();
        lead.Phone = dto.Phone?.Trim();
        lead.SourceId = dto.SourceId ?? lead.SourceId;
        lead.SourceName = dto.SourceName ?? lead.SourceName;
        lead.EstimatedValue = dto.EstimatedValue ?? lead.EstimatedValue;
        lead.Notes = dto.Notes ?? lead.Notes;

        if (!string.IsNullOrWhiteSpace(dto.Status) && Enum.TryParse<LeadStatus>(dto.Status, true, out var parsedStatus))
        {
            lead.Status = parsedStatus;
        }

        if (!string.IsNullOrWhiteSpace(dto.AssignedUserId) && Guid.TryParse(dto.AssignedUserId, out var parsedUser))
        {
            lead.AssignedUserId = parsedUser;
            lead.AssignedUser = await _context.Users.FindAsync([parsedUser], cancellationToken);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return MapToDto(lead);
    }

    public async Task DeleteLeadAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var lead = await _context.Leads.FirstOrDefaultAsync(l => l.Id == id, cancellationToken);
        if (lead == null)
        {
            throw new NotFoundException($"Lead '{id}' not found.");
        }

        _context.Leads.Remove(lead);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<ConvertLeadResultDto> ConvertLeadAsync(Guid id, ConvertLeadDto dto, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        await _leadConversionLock.WaitAsync(cancellationToken);
        try
        {
            var lead = await _context.Leads
                .Include(l => l.AssignedUser)
                .FirstOrDefaultAsync(l => l.Id == id, cancellationToken);

            if (lead == null)
            {
                throw new NotFoundException($"Lead '{id}' not found.");
            }

            if (lead.Status == LeadStatus.Converted)
            {
                throw new ConflictException("Lead has already been converted.");
            }

        // 1. Transaction & Customer Deduplication
        Customer? customer = null;
        if (!string.IsNullOrWhiteSpace(lead.Email))
        {
            var normEmail = lead.Email.Trim().ToLower();
            customer = await _context.Customers
                .FirstOrDefaultAsync(c => c.Email != null && c.Email.ToLower() == normEmail, cancellationToken);
        }
        if (customer == null && !string.IsNullOrWhiteSpace(lead.Phone))
        {
            var normPhone = lead.Phone.Trim();
            customer = await _context.Customers
                .FirstOrDefaultAsync(c => c.Phone != null && c.Phone == normPhone, cancellationToken);
        }
        if (customer == null)
        {
            var normCompany = lead.CompanyName.Trim().ToLower();
            customer = await _context.Customers
                .FirstOrDefaultAsync(c => c.CompanyName.ToLower() == normCompany, cancellationToken);
        }

        var isNewCustomer = false;
        if (customer == null)
        {
            customer = new Customer
            {
                CompanyName = lead.CompanyName.Trim(),
                Email = lead.Email?.Trim(),
                Phone = lead.Phone?.Trim(),
                AssignedUserId = lead.AssignedUserId ?? currentUserId,
                Status = "Active"
            };
            _context.Customers.Add(customer);
            isNewCustomer = true;
        }

        // 2. Primary Contact Deduplication
        Contact? contact = null;
        if (!isNewCustomer)
        {
            contact = await _context.Contacts
                .FirstOrDefaultAsync(c => c.CustomerId == customer.Id &&
                    ((lead.Email != null && c.Email != null && c.Email.ToLower() == lead.Email.ToLower()) ||
                     (c.FirstName == lead.FirstName && c.LastName == lead.LastName)), cancellationToken);
        }

        if (contact == null)
        {
            contact = new Contact
            {
                CustomerId = customer.Id,
                FirstName = lead.FirstName,
                LastName = lead.LastName,
                Email = lead.Email,
                Phone = lead.Phone,
                IsPrimary = isNewCustomer || !await _context.Contacts.AnyAsync(c => c.CustomerId == customer.Id, cancellationToken)
            };
            _context.Contacts.Add(contact);
        }

        // 3. Find default Pipeline & First Stage
        var pipeline = await _context.Pipelines
            .Include(p => p.Stages.OrderBy(s => s.Order))
            .FirstOrDefaultAsync(p => p.IsDefault, cancellationToken)
            ?? await _context.Pipelines.Include(p => p.Stages.OrderBy(s => s.Order)).FirstOrDefaultAsync(cancellationToken);

        if (pipeline == null || !pipeline.Stages.Any())
        {
            // Seed a default pipeline if none
            pipeline = new Pipeline { Name = "Sales Pipeline", IsDefault = true };
            pipeline.Stages.Add(new PipelineStage { Name = "Qualification", Order = 1, Probability = 20 });
            pipeline.Stages.Add(new PipelineStage { Name = "Proposal", Order = 2, Probability = 50 });
            pipeline.Stages.Add(new PipelineStage { Name = "Negotiation", Order = 3, Probability = 80 });
            pipeline.Stages.Add(new PipelineStage { Name = "Closed Won", Order = 4, Probability = 100 });
            pipeline.Stages.Add(new PipelineStage { Name = "Closed Lost", Order = 5, Probability = 0 });
            _context.Pipelines.Add(pipeline);
            await _context.SaveChangesAsync(cancellationToken);
        }

        var firstStage = pipeline.Stages.OrderBy(s => s.Order).First();

        // 4. Create Opportunity
        var dealValue = dto.EstimatedValue ?? (lead.EstimatedValue > 0 ? lead.EstimatedValue : 10000m);
        var opp = new Opportunity
        {
            Name = $"{lead.CompanyName} - Deal",
            CustomerId = customer.Id,
            LeadId = lead.Id,
            PipelineId = pipeline.Id,
            PipelineStageId = firstStage.Id,
            AssignedUserId = lead.AssignedUserId ?? currentUserId,
            Value = dealValue,
            Probability = firstStage.Probability,
            ExpectedCloseDate = dto.ExpectedCloseDate ?? DateTime.UtcNow.AddMonths(1),
            Description = dto.Notes ?? lead.Notes
        };
        _context.Opportunities.Add(opp);

        // 5. Log Activity
        var activity = new Activity
        {
            Type = ActivityType.LeadConverted,
            Subject = $"Lead converted: {lead.FullName}",
            Description = $"Converted lead into customer '{customer.CompanyName}' and created deal '{opp.Name}'.",
            ActivityDate = DateTime.UtcNow,
            UserId = currentUserId,
            CustomerId = customer.Id,
            OpportunityId = opp.Id
        };
        _context.Activities.Add(activity);

        // 6. Update Lead status
        lead.Status = LeadStatus.Converted;
        lead.ConvertedCustomerId = customer.Id;
        lead.ConvertedOpportunityId = opp.Id;

        if (_context is DbContext dbContext)
        {
            using var tx = await dbContext.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                await _context.SaveChangesAsync(cancellationToken);
                await tx.CommitAsync(cancellationToken);
            }
            catch
            {
                await tx.RollbackAsync(cancellationToken);
                throw;
            }
        }
        else
        {
            await _context.SaveChangesAsync(cancellationToken);
        }

            return new ConvertLeadResultDto(customer.Id.ToString(), opp.Id.ToString());
        }
        finally
        {
            _leadConversionLock.Release();
        }
    }

    private static LeadDto MapToDto(Lead lead)
    {
        return new LeadDto(
            lead.Id.ToString(),
            lead.FirstName,
            lead.LastName,
            lead.CompanyName,
            lead.Email,
            lead.Phone,
            lead.SourceId,
            lead.SourceName,
            lead.Status.ToString(),
            lead.AssignedUserId?.ToString(),
            lead.AssignedUser != null
                ? new UserSummaryDto(
                    lead.AssignedUser.Id.ToString(),
                    lead.AssignedUser.FirstName,
                    lead.AssignedUser.LastName,
                    lead.AssignedUser.Email,
                    lead.AssignedUser.Role.ToString())
                : null,
            lead.EstimatedValue,
            lead.Notes,
            lead.CreatedAt,
            lead.UpdatedAt
        );
    }
}
