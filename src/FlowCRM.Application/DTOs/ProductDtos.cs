namespace FlowCRM.Application.DTOs;

public sealed record ProductDto(
    string Id,
    string Name,
    string Category,
    string Sku,
    string? FlavorOrSize,
    decimal UnitPrice,
    decimal CostPrice,
    int StockQuantity,
    int LowStockThreshold,
    string? Description,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public sealed record CreateProductDto(
    string Name,
    string Category,
    string Sku,
    string? FlavorOrSize,
    decimal UnitPrice,
    decimal CostPrice,
    int StockQuantity,
    int LowStockThreshold,
    string? Description
);

public sealed record UpdateProductDto(
    string Name,
    string Category,
    string Sku,
    string? FlavorOrSize,
    decimal UnitPrice,
    decimal CostPrice,
    int StockQuantity,
    int LowStockThreshold,
    string? Description,
    bool IsActive
);
