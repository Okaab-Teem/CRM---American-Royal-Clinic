using FlowCRM.Domain.Common;

namespace FlowCRM.Domain.Entities;

public sealed class PipelineStage : Entity
{
    public Guid PipelineId { get; set; }
    public Pipeline? Pipeline { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Order { get; set; }
    public int Probability { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
