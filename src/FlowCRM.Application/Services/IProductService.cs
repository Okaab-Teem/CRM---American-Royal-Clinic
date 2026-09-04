using FlowCRM.Application.Common.Models;
using FlowCRM.Application.DTOs;

namespace FlowCRM.Application.Services;

public interface IProductService
{
    Task<PagedResult<ProductDto>> GetProductsAsync(QueryParams query, string? category = null, CancellationToken ct = default);
    Task<ProductDto> GetProductByIdAsync(Guid id, CancellationToken ct = default);
    Task<ProductDto> CreateProductAsync(CreateProductDto dto, CancellationToken ct = default);
    Task<ProductDto> UpdateProductAsync(Guid id, UpdateProductDto dto, CancellationToken ct = default);
    Task DeleteProductAsync(Guid id, CancellationToken ct = default);
}
