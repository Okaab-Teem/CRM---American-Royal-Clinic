namespace FlowCRM.Application.Exceptions;

public sealed class NotFoundException : AppException
{
    public NotFoundException(string message)
        : base("NOT_FOUND", message, 404)
    {
    }
}
