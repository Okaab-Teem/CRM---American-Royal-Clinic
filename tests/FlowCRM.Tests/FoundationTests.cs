using FlowCRM.Api.Contracts.Errors;
using FlowCRM.Application.Exceptions;

namespace FlowCRM.Tests;

public sealed class FoundationTests
{
    [Fact]
    public void Error_response_keeps_contract_shape()
    {
        var response = new ErrorResponse(
            "VALIDATION_ERROR",
            "One or more validation errors occurred.",
            new Dictionary<string, string[]> { ["email"] = ["A valid email is required."] },
            "trace-1");

        Assert.Equal("VALIDATION_ERROR", response.Code);
        Assert.Equal("trace-1", response.TraceId);
        Assert.NotNull(response.Details);
    }

    [Fact]
    public void Validation_exception_uses_api_error_contract_values()
    {
        var details = new Dictionary<string, string[]>
        {
            ["email"] = ["A valid email is required."]
        };

        var exception = new ValidationException(details);

        Assert.Equal("VALIDATION_ERROR", exception.Code);
        Assert.Equal(400, exception.StatusCode);
        Assert.Same(details, exception.Details);
    }
}
