using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FlowCRM.Application.Common.Security;
using FlowCRM.Domain.Entities;
using FlowCRM.Domain.Enums;
using FlowCRM.Infrastructure.Security;
using Microsoft.Extensions.Configuration;

namespace FlowCRM.Tests;

public sealed class AuthTests
{
    [Fact]
    public void Password_hasher_hashes_and_verifies_correctly()
    {
        var hasher = new PasswordHasher();
        var password = "Secure_Pass_123!#";

        var hash = hasher.HashPassword(password);

        Assert.NotNull(hash);
        Assert.True(hasher.VerifyPassword(password, hash));
        Assert.False(hasher.VerifyPassword("WrongPassword123", hash));
    }

    [Fact]
    public void Jwt_token_service_generates_valid_jwt_with_claims()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "FlowCRM_SuperSecretKey_ForDevelopment_RequiresAtLeast32BytesLength!",
                ["Jwt:Issuer"] = "FlowCRM",
                ["Jwt:Audience"] = "FlowCRMClient",
                ["Jwt:ExpiresInMinutes"] = "60"
            })
            .Build();

        var service = new JwtTokenService(config);

        var user = new User
        {
            Id = Guid.NewGuid(),
            FirstName = "Sara",
            LastName = "Ahmed",
            Email = "sara@flowcrm.local",
            Role = UserRole.SalesRepresentative
        };

        var permissions = RolePermissions.GetPermissionsForRole(user.Role);
        var token = service.GenerateToken(user, permissions);

        Assert.False(string.IsNullOrWhiteSpace(token));

        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        Assert.Equal("FlowCRM", jwt.Issuer);
        Assert.Equal(user.Email, jwt.Claims.First(c => c.Type == ClaimTypes.Email).Value);
        Assert.Equal(user.Role.ToString(), jwt.Claims.First(c => c.Type == ClaimTypes.Role).Value);
        Assert.Contains(jwt.Claims, c => c.Type == "permission" && c.Value == "lead.convert");
    }

    [Theory]
    [InlineData(UserRole.Admin, "user.delete")]
    [InlineData(UserRole.Manager, "opportunity.assign")]
    [InlineData(UserRole.SalesRepresentative, "lead.create")]
    public void Role_permissions_matrix_contains_expected_grants(UserRole role, string expectedPermission)
    {
        var perms = RolePermissions.GetPermissionsForRole(role);
        Assert.Contains(expectedPermission, perms);
    }
}
