namespace FlowCRM.Api.Contracts.Errors;

public sealed record ErrorResponse(
    string Code,
    string Message,
    object? Details,
    string TraceId);
