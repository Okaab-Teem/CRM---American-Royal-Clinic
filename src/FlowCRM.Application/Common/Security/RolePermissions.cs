using FlowCRM.Domain.Enums;

namespace FlowCRM.Application.Common.Security;

public static class RolePermissions
{
    private static readonly string[] AdminPerms =
    [
        "dashboard.view",
        "lead.view", "lead.create", "lead.update", "lead.delete", "lead.assign", "lead.convert",
        "customer.view", "customer.create", "customer.update", "customer.delete",
        "opportunity.view", "opportunity.create", "opportunity.update", "opportunity.delete", "opportunity.assign", "opportunity.changeStage",
        "task.view", "task.create", "task.update", "task.delete", "task.complete",
        "activity.view", "activity.create", "activity.delete",
        "report.view",
        "user.view", "user.create", "user.update", "user.delete"
    ];

    private static readonly string[] ManagerPerms =
    [
        "dashboard.view",
        "lead.view", "lead.create", "lead.update", "lead.assign", "lead.convert",
        "customer.view", "customer.create", "customer.update",
        "opportunity.view", "opportunity.create", "opportunity.update", "opportunity.assign", "opportunity.changeStage",
        "task.view", "task.create", "task.update", "task.complete",
        "activity.view", "activity.create",
        "report.view",
        "user.view"
    ];

    private static readonly string[] SalesRepPerms =
    [
        "dashboard.view",
        "lead.view", "lead.create", "lead.update", "lead.convert",
        "customer.view", "customer.create", "customer.update",
        "opportunity.view", "opportunity.create", "opportunity.update", "opportunity.changeStage",
        "task.view", "task.create", "task.update", "task.complete",
        "activity.view", "activity.create",
        "report.view"
    ];

    public static IReadOnlyList<string> GetPermissionsForRole(UserRole role) => role switch
    {
        UserRole.Admin => AdminPerms,
        UserRole.Manager => ManagerPerms,
        _ => SalesRepPerms
    };
}
