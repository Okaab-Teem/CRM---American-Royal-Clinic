using FlowCRM.Application.Common.Models;
using FlowCRM.Application.DTOs;
using FlowCRM.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace FlowCRM.Api.Endpoints;

public static class ProductEndpoints
{
    public static IEndpointRouteBuilder MapProductEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/products").WithTags("Products").RequireAuthorization();

        group.MapGet("/", async ([AsParameters] QueryParams query, [FromQuery] string? category, IProductService productService, CancellationToken ct) =>
        {
            var result = await productService.GetProductsAsync(query, category, ct);
            return Results.Ok(result);
        })
        .WithName("GetProducts");

        group.MapGet("/{id:guid}", async (Guid id, IProductService productService, CancellationToken ct) =>
        {
            var result = await productService.GetProductByIdAsync(id, ct);
            return Results.Ok(result);
        })
        .WithName("GetProductById");

        group.MapPost("/", async (CreateProductDto dto, IProductService productService, CancellationToken ct) =>
        {
            var result = await productService.CreateProductAsync(dto, ct);
            return Results.Created($"/api/products/{result.Id}", result);
        })
        .WithName("CreateProduct")
        .RequireRateLimiting("anti-spam-click")
        .RequireAuthorization("RequireManagerOrAdmin");

        group.MapPut("/{id:guid}", async (Guid id, UpdateProductDto dto, IProductService productService, CancellationToken ct) =>
        {
            var result = await productService.UpdateProductAsync(id, dto, ct);
            return Results.Ok(result);
        })
        .WithName("UpdateProduct")
        .RequireAuthorization("RequireManagerOrAdmin");

        group.MapDelete("/{id:guid}", async (Guid id, IProductService productService, CancellationToken ct) =>
        {
            await productService.DeleteProductAsync(id, ct);
            return Results.NoContent();
        })
        .WithName("DeleteProduct")
        .RequireAuthorization("RequireManagerOrAdmin");

        return app;
    }
}
