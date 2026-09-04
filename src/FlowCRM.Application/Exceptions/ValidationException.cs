namespace FlowCRM.Application.Exceptions;

public sealed class ValidationException : AppException
{
    public ValidationException(IDictionary<string, string[]> details)
        : base("VALIDATION_ERROR", "One or more validation errors occurred.", 400)
    {
        Details = details;
    }

    public IDictionary<string, string[]> Details { get; }
}
