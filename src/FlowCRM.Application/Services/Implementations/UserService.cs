using FlowCRM.Application.Common.Interfaces;
using FlowCRM.Application.Common.Security;
using FlowCRM.Application.DTOs;
using FlowCRM.Application.Exceptions;
using FlowCRM.Domain.Entities;
using FlowCRM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace FlowCRM.Application.Services.Implementations;

public sealed class UserService : IUserService
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public UserService(IApplicationDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<IReadOnlyList<CurrentUserDto>> GetUsersAsync(CancellationToken cancellationToken = default)
    {
        var users = await _context.Users.AsNoTracking().ToListAsync(cancellationToken);
        return users.Select(u => new CurrentUserDto(
            u.Id.ToString(),
            u.FirstName,
            u.LastName,
            u.Email,
            u.Role.ToString(),
            u.IsActive,
            RolePermissions.GetPermissionsForRole(u.Role)
        )).ToList();
    }

    public async Task<CurrentUserDto> GetUserByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
        if (user == null)
        {
            throw new NotFoundException($"User '{id}' not found.");
        }

        return new CurrentUserDto(
            user.Id.ToString(),
            user.FirstName,
            user.LastName,
            user.Email,
            user.Role.ToString(),
            user.IsActive,
            RolePermissions.GetPermissionsForRole(user.Role)
        );
    }

    public async Task<CurrentUserDto> CreateUserAsync(CreateUserDto dto, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password) ||
            string.IsNullOrWhiteSpace(dto.FirstName) || string.IsNullOrWhiteSpace(dto.LastName))
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["user"] = ["All user fields are required."]
            });
        }

        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        var existing = await _context.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);
        if (existing)
        {
            throw new ConflictException($"User with email '{dto.Email}' already exists.");
        }

        var role = UserRole.SalesRepresentative;
        if (Enum.TryParse<UserRole>(dto.Role, true, out var parsedRole))
        {
            role = parsedRole;
        }

        var user = new User
        {
            FirstName = dto.FirstName.Trim(),
            LastName = dto.LastName.Trim(),
            Email = dto.Email.Trim(),
            PasswordHash = _passwordHasher.HashPassword(dto.Password),
            Role = role,
            IsActive = true
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        return new CurrentUserDto(
            user.Id.ToString(),
            user.FirstName,
            user.LastName,
            user.Email,
            user.Role.ToString(),
            user.IsActive,
            RolePermissions.GetPermissionsForRole(user.Role)
        );
    }

    public async Task<CurrentUserDto> UpdateUserAsync(Guid id, UpdateUserDto dto, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
        if (user == null)
        {
            throw new NotFoundException($"User '{id}' not found.");
        }

        user.FirstName = dto.FirstName.Trim();
        user.LastName = dto.LastName.Trim();
        user.Email = dto.Email.Trim();
        user.IsActive = dto.IsActive;

        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            user.PasswordHash = _passwordHasher.HashPassword(dto.Password);
        }

        if (Enum.TryParse<UserRole>(dto.Role, true, out var parsedRole))
        {
            user.Role = parsedRole;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new CurrentUserDto(
            user.Id.ToString(),
            user.FirstName,
            user.LastName,
            user.Email,
            user.Role.ToString(),
            user.IsActive,
            RolePermissions.GetPermissionsForRole(user.Role)
        );
    }

    public async Task DeleteUserAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
        if (user == null)
        {
            throw new NotFoundException($"User '{id}' not found.");
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
