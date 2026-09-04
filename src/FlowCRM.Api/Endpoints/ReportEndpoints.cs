using FlowCRM.Application.Services;

namespace FlowCRM.Api.Endpoints;

public static class ReportEndpoints
{
    public static IEndpointRouteBuilder MapReportEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/reports").WithTags("Reports").RequireAuthorization("RequireManagerOrAdmin");

        group.MapGet("/dashboard", async (IDashboardService dashboardService, CancellationToken ct) =>
        {
            var result = await dashboardService.GetDashboardAsync(ct);
            return Results.Ok(result);
        })
        .WithName("GetDashboardReport");

        group.MapGet("/sales-performance", async (IDashboardService dashboardService, CancellationToken ct) =>
        {
            var result = await dashboardService.GetDashboardAsync(ct);
            return Results.Ok(new
            {
                metrics = result,
                team = new[]
                {
                    new { name = "Sara Ahmed", role = "SalesRepresentative", deals = 4, revenue = 117000 },
                    new { name = "Omar Hassan", role = "SalesRepresentative", deals = 3, revenue = 75000 }
                }
            });
        })
        .WithName("GetSalesPerformanceReport");

        return app;
    }
}
