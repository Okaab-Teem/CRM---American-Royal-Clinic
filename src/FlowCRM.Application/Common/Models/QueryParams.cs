namespace FlowCRM.Application.Common.Models;

public sealed class QueryParams
{
    public string? Search { get; set; }
    public int? Page { get; set; }
    public int? PageSize { get; set; }
    public string? SortBy { get; set; }
    public string? SortDirection { get; set; }
    public string? Status { get; set; }
    public string? CustomerId { get; set; }
    public string? OpportunityId { get; set; }
    public string? AssignedUserId { get; set; }

    public int GetPage() => Page is > 0 ? Page.Value : 1;
    public int GetPageSize(int defaultSize = 10) => PageSize is > 0 ? PageSize.Value : defaultSize;
}
