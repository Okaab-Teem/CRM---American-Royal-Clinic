using FlowCRM.Application.Common.Models;
using FlowCRM.Application.DTOs;
using FlowCRM.Application.Services;

namespace FlowCRM.Api.Endpoints;

public static class CustomerEndpoints
{
    public static IEndpointRouteBuilder MapCustomerEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/customers").WithTags("Customers").RequireAuthorization();

        group.MapGet("/", async ([AsParameters] QueryParams query, ICustomerService customerService, CancellationToken ct) =>
        {
            var result = await customerService.GetCustomersAsync(query, ct);
            return Results.Ok(result);
        })
        .WithName("GetCustomers");

        group.MapGet("/{id:guid}", async (Guid id, ICustomerService customerService, CancellationToken ct) =>
        {
            var result = await customerService.GetCustomerByIdAsync(id, ct);
            return Results.Ok(result);
        })
        .WithName("GetCustomerById");

        group.MapPost("/", async (CreateCustomerDto dto, ICustomerService customerService, CancellationToken ct) =>
        {
            var result = await customerService.CreateCustomerAsync(dto, ct);
            return Results.Created($"/api/customers/{result.Id}", result);
        })
        .WithName("CreateCustomer")
        .RequireRateLimiting("anti-spam-click");

        group.MapPut("/{id:guid}", async (Guid id, UpdateCustomerDto dto, ICustomerService customerService, CancellationToken ct) =>
        {
            var result = await customerService.UpdateCustomerAsync(id, dto, ct);
            return Results.Ok(result);
        })
        .WithName("UpdateCustomer");

        group.MapGet("/{id:guid}/timeline", async (Guid id, ICustomerService customerService, CancellationToken ct) =>
        {
            var result = await customerService.GetCustomerTimelineAsync(id, ct);
            return Results.Ok(result);
        })
        .WithName("GetCustomerTimeline");

        return app;
    }
}
