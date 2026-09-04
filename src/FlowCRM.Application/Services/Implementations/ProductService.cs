using FlowCRM.Application.Common.Interfaces;
using FlowCRM.Application.Common.Models;
using FlowCRM.Application.DTOs;
using FlowCRM.Application.Exceptions;
using FlowCRM.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FlowCRM.Application.Services.Implementations;

public sealed class ProductService : IProductService
{
    private readonly IApplicationDbContext _context;

    public ProductService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<ProductDto>> GetProductsAsync(QueryParams query, string? category = null, CancellationToken ct = default)
    {
        var dbQuery = _context.Products.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            dbQuery = dbQuery.Where(p => p.Category == category);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim().ToLower();
            dbQuery = dbQuery.Where(p =>
                p.Name.ToLower().Contains(term) ||
                p.Sku.ToLower().Contains(term) ||
                (p.FlavorOrSize != null && p.FlavorOrSize.ToLower().Contains(term)) ||
                (p.Description != null && p.Description.ToLower().Contains(term)));
        }

        var total = await dbQuery.CountAsync(ct);
        var page = query.GetPage();
        var pageSize = query.GetPageSize();

        var items = await dbQuery
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResult<ProductDto>
        {
            Items = items.Select(MapToDto).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<ProductDto> GetProductByIdAsync(Guid id, CancellationToken ct = default)
    {
        var product = await _context.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id, ct);
        if (product == null)
        {
            throw new NotFoundException($"Product '{id}' was not found.");
        }

        return MapToDto(product);
    }

    public async Task<ProductDto> CreateProductAsync(CreateProductDto dto, CancellationToken ct = default)
    {
        var normalizedSku = dto.Sku.Trim().ToUpperInvariant();
        var skuExists = await _context.Products.AnyAsync(p => p.Sku == normalizedSku, ct);
        if (skuExists)
        {
            throw new ConflictException($"A supplement product with SKU '{normalizedSku}' already exists.");
        }

        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = dto.Name.Trim(),
            Category = dto.Category.Trim(),
            Sku = normalizedSku,
            FlavorOrSize = dto.FlavorOrSize?.Trim(),
            UnitPrice = dto.UnitPrice,
            CostPrice = dto.CostPrice,
            StockQuantity = dto.StockQuantity,
            LowStockThreshold = dto.LowStockThreshold > 0 ? dto.LowStockThreshold : 10,
            Description = dto.Description?.Trim(),
            IsActive = true
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync(ct);

        return MapToDto(product);
    }

    public async Task<ProductDto> UpdateProductAsync(Guid id, UpdateProductDto dto, CancellationToken ct = default)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (product == null)
        {
            throw new NotFoundException($"Product '{id}' was not found.");
        }

        var normalizedSku = dto.Sku.Trim().ToUpperInvariant();
        if (product.Sku != normalizedSku)
        {
            var skuExists = await _context.Products.AnyAsync(p => p.Sku == normalizedSku && p.Id != id, ct);
            if (skuExists)
            {
                throw new ConflictException($"A supplement product with SKU '{normalizedSku}' already exists.");
            }
        }

        product.Name = dto.Name.Trim();
        product.Category = dto.Category.Trim();
        product.Sku = normalizedSku;
        product.FlavorOrSize = dto.FlavorOrSize?.Trim();
        product.UnitPrice = dto.UnitPrice;
        product.CostPrice = dto.CostPrice;
        product.StockQuantity = dto.StockQuantity;
        product.LowStockThreshold = dto.LowStockThreshold;
        product.Description = dto.Description?.Trim();
        product.IsActive = dto.IsActive;

        await _context.SaveChangesAsync(ct);

        return MapToDto(product);
    }

    public async Task DeleteProductAsync(Guid id, CancellationToken ct = default)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (product == null)
        {
            throw new NotFoundException($"Product '{id}' was not found.");
        }

        _context.Products.Remove(product);
        await _context.SaveChangesAsync(ct);
    }

    private static ProductDto MapToDto(Product p) => new(
        p.Id.ToString(),
        p.Name,
        p.Category,
        p.Sku,
        p.FlavorOrSize,
        p.UnitPrice,
        p.CostPrice,
        p.StockQuantity,
        p.LowStockThreshold,
        p.Description,
        p.IsActive,
        p.CreatedAt,
        p.UpdatedAt
    );
}
