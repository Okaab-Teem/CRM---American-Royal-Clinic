using FlowCRM.Domain.Common;

namespace FlowCRM.Domain.Entities;

public sealed class Product : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = "Protein";
    public string Sku { get; set; } = string.Empty;
    public string? FlavorOrSize { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal CostPrice { get; set; }
    public int StockQuantity { get; set; }
    public int LowStockThreshold { get; set; } = 10;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}
