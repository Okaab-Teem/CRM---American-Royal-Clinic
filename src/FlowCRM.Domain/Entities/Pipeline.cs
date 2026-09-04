using FlowCRM.Domain.Common;

namespace FlowCRM.Domain.Entities;

public sealed class Pipeline : Entity
{
    public string Name { get; set; } = string.Empty;
    public bool IsDefault { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<PipelineStage> Stages { get; set; } = new List<PipelineStage>();
}
