using FlowCRM.Application.Common.Interfaces;
using FlowCRM.Application.Common.Models;
using FlowCRM.Application.DTOs;
using FlowCRM.Application.Exceptions;
using FlowCRM.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FlowCRM.Application.Services.Implementations;

public sealed class CustomerService : ICustomerService
{
    private static readonly SemaphoreSlim _customerCreationLock = new(1, 1);
    private readonly IApplicationDbContext _context;

    public CustomerService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<CustomerDto>> GetCustomersAsync(QueryParams query, CancellationToken cancellationToken = default)
    {
        var customerQuery = _context.Customers
            .Include(c => c.AssignedUser)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            customerQuery = customerQuery.Where(c =>
                c.CompanyName.ToLower().Contains(search) ||
                (c.Industry != null && c.Industry.ToLower().Contains(search)) ||
                (c.Email != null && c.Email.ToLower().Contains(search)));
        }

        var total = await customerQuery.CountAsync(cancellationToken);
        var page = query.GetPage();
        var pageSize = query.GetPageSize();

        var items = await customerQuery
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<CustomerDto>
        {
            Items = items.Select(MapToDto).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<CustomerDto> GetCustomerByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var customer = await _context.Customers
            .Include(c => c.AssignedUser)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (customer == null)
        {
            throw new NotFoundException($"Customer '{id}' not found.");
        }

        return MapToDto(customer);
    }

    public async Task<CustomerDto> CreateCustomerAsync(CreateCustomerDto dto, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.CompanyName))
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["companyName"] = ["Company name is required."]
            });
        }

        await _customerCreationLock.WaitAsync(cancellationToken);
        try
        {
            // Deduplication Check
            var normCompany = dto.CompanyName.Trim().ToLower();
            var existingCompanyCustomer = await _context.Customers
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.CompanyName.ToLower() == normCompany, cancellationToken);
            if (existingCompanyCustomer != null)
            {
                throw new ConflictException($"A customer with company name '{dto.CompanyName}' already exists (Customer ID: {existingCompanyCustomer.Id}).");
            }

            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                var normEmail = dto.Email.Trim().ToLower();
                var existingEmailCustomer = await _context.Customers
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.Email != null && c.Email.ToLower() == normEmail, cancellationToken);
                if (existingEmailCustomer != null)
                {
                    throw new ConflictException($"A customer with email '{dto.Email}' already exists (Customer ID: {existingEmailCustomer.Id}, Company: {existingEmailCustomer.CompanyName}).");
                }
            }

            if (!string.IsNullOrWhiteSpace(dto.Phone))
            {
                var phoneDigits = new string(dto.Phone.Where(char.IsDigit).ToArray());
                if (phoneDigits.Length > 11)
                {
                    throw new ValidationException(new Dictionary<string, string[]>
                    {
                        ["phone"] = ["Client phone number cannot exceed 11 digits."]
                    });
                }

                var normPhone = dto.Phone.Trim();
                var existingPhoneCustomer = await _context.Customers
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.Phone != null && c.Phone == normPhone, cancellationToken);
                if (existingPhoneCustomer != null)
                {
                    throw new ConflictException($"A customer with phone '{dto.Phone}' already exists (Customer ID: {existingPhoneCustomer.Id}, Company: {existingPhoneCustomer.CompanyName}).");
                }
            }

            Guid? assignedGuid = null;
            if (!string.IsNullOrWhiteSpace(dto.AssignedUserId) && Guid.TryParse(dto.AssignedUserId, out var parsedUser))
            {
                assignedGuid = parsedUser;
            }

            var customer = new Customer
            {
                CompanyName = dto.CompanyName.Trim(),
                Industry = dto.Industry?.Trim(),
                Email = dto.Email?.Trim(),
                Phone = dto.Phone?.Trim(),
                Website = dto.Website?.Trim(),
                Address = dto.Address?.Trim(),
                AssignedUserId = assignedGuid,
                Status = dto.Status ?? "Active"
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync(cancellationToken);

            if (assignedGuid.HasValue)
            {
                customer.AssignedUser = await _context.Users.FindAsync([assignedGuid.Value], cancellationToken);
            }

            return MapToDto(customer);
        }
        finally
        {
            _customerCreationLock.Release();
        }
    }

    public async Task<CustomerDto> UpdateCustomerAsync(Guid id, UpdateCustomerDto dto, CancellationToken cancellationToken = default)
    {
        var customer = await _context.Customers
            .Include(c => c.AssignedUser)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (customer == null)
        {
            throw new NotFoundException($"Customer '{id}' not found.");
        }

        if (!string.IsNullOrWhiteSpace(dto.Phone))
        {
            var phoneDigits = new string(dto.Phone.Where(char.IsDigit).ToArray());
            if (phoneDigits.Length > 11)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    ["phone"] = ["Client phone number cannot exceed 11 digits."]
                });
            }
        }

        customer.CompanyName = dto.CompanyName.Trim();
        customer.Industry = dto.Industry?.Trim();
        customer.Email = dto.Email?.Trim();
        customer.Phone = dto.Phone?.Trim();
        customer.Website = dto.Website?.Trim();
        customer.Address = dto.Address?.Trim();
        customer.Status = dto.Status ?? customer.Status;

        if (!string.IsNullOrWhiteSpace(dto.AssignedUserId))
        {
            if (Guid.TryParse(dto.AssignedUserId, out var parsedUser))
            {
                customer.AssignedUserId = parsedUser;
                customer.AssignedUser = await _context.Users.FindAsync([parsedUser], cancellationToken);
            }
        }
        else
        {
            customer.AssignedUserId = null;
            customer.AssignedUser = null;
        }


        await _context.SaveChangesAsync(cancellationToken);
        return MapToDto(customer);
    }

    public async Task<IReadOnlyList<ActivityDto>> GetCustomerTimelineAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var activities = await _context.Activities
            .Include(a => a.User)
            .Include(a => a.Customer)
            .Include(a => a.Opportunity)
            .AsNoTracking()
            .Where(a => a.CustomerId == id)
            .OrderByDescending(a => a.ActivityDate)
            .ToListAsync(cancellationToken);

        return activities.Select(a => new ActivityDto(
            a.Id.ToString(),
            a.Type.ToString(),
            a.Subject,
            a.Description,
            a.ActivityDate,
            new UserSummaryDto(
                a.User?.Id.ToString() ?? "",
                a.User?.FirstName ?? "Unknown",
                a.User?.LastName ?? "",
                a.User?.Email ?? "",
                a.User?.Role.ToString() ?? ""),
            a.CustomerId?.ToString(),
            a.Customer?.CompanyName,
            a.OpportunityId?.ToString(),
            a.Opportunity?.Name
        )).ToList();
    }

    private static CustomerDto MapToDto(Customer customer)
    {
        return new CustomerDto(
            customer.Id.ToString(),
            customer.CompanyName,
            customer.Industry,
            customer.Email,
            customer.Phone,
            customer.Website,
            customer.Address,
            customer.AssignedUserId?.ToString(),
            customer.AssignedUser != null
                ? new UserSummaryDto(
                    customer.AssignedUser.Id.ToString(),
                    customer.AssignedUser.FirstName,
                    customer.AssignedUser.LastName,
                    customer.AssignedUser.Email,
                    customer.AssignedUser.Role.ToString())
                : null,
            customer.Status,
            customer.CreatedAt,
            customer.UpdatedAt
        );
    }
}
