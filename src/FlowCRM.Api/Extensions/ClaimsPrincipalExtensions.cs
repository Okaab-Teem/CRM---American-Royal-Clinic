using System.Security.Claims;

namespace FlowCRM.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        var claim = principal.FindFirst(ClaimTypes.NameIdentifier) ?? principal.FindFirst("userId");
        return claim != null && Guid.TryParse(claim.Value, out var guid) ? guid : Guid.Empty;
    }

    public static string GetRole(this ClaimsPrincipal principal)
    {
        return principal.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;
    }

    public static bool IsAdmin(this ClaimsPrincipal principal) =>
        principal.IsInRole("Admin") || principal.GetRole().Equals("Admin", StringComparison.OrdinalIgnoreCase);

    public static bool IsManager(this ClaimsPrincipal principal) =>
        principal.IsInRole("Manager") || principal.GetRole().Equals("Manager", StringComparison.OrdinalIgnoreCase);

    public static bool IsSalesRep(this ClaimsPrincipal principal) =>
        principal.IsInRole("SalesRepresentative") || principal.GetRole().Equals("SalesRepresentative", StringComparison.OrdinalIgnoreCase);
}
