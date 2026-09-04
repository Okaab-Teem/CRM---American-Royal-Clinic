using System.Text.Json;
using FlowCRM.Api.Contracts.Errors;
using FlowCRM.Application.Exceptions;

namespace FlowCRM.Api.Middleware;

public sealed class ExceptionHandlingMiddleware
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception exception)
        {
            await WriteErrorResponseAsync(context, exception);
        }
    }

    private async Task WriteErrorResponseAsync(HttpContext context, Exception exception)
    {
        var traceId = context.TraceIdentifier;
        var statusCode = StatusCodes.Status500InternalServerError;
        var code = "UNEXPECTED_ERROR";
        var message = "An unexpected error occurred.";
        object? details = null;

        if (exception is AppException appException)
        {
            statusCode = appException.StatusCode;
            code = appException.Code;
            message = appException.Message;
            details = exception is ValidationException validationException
                ? validationException.Details
                : null;
        }
        else
        {
            _logger.LogError(exception, "Unhandled exception for trace {TraceId}", traceId);
        }

        if (!context.Response.HasStarted)
        {
            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "application/json";

            var response = new ErrorResponse(code, message, details, traceId);
            await context.Response.WriteAsync(JsonSerializer.Serialize(response, JsonOptions));
        }
    }
}
