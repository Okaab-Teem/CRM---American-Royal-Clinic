namespace FlowCRM.Application.Exceptions;

public sealed class ConflictException : AppException
{
    public ConflictException(string message)
        : base("CONFLICT", message, 409)
    {
    }
}
