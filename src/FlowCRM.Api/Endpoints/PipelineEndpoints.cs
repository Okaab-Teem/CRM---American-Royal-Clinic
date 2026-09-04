using FlowCRM.Application.Services;

namespace FlowCRM.Api.Endpoints;

public static class PipelineEndpoints
{
    public static IEndpointRouteBuilder MapPipelineEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/pipelines").WithTags("Pipelines").RequireAuthorization();

        group.MapGet("/{pipelineId}/stages", async (string pipelineId, IOpportunityService oppService, CancellationToken ct) =>
        {
            Guid? pipeGuid = Guid.TryParse(pipelineId, out var g) ? g : null;
            var result = await oppService.GetPipelineStagesAsync(pipeGuid, ct);
            return Results.Ok(result);
        })
        .WithName("GetPipelineStages");

        return app;
    }
}
