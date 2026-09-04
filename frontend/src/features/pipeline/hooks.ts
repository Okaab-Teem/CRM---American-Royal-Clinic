import { useQuery } from "@tanstack/react-query";
import { getPipelineStages } from "@/features/pipeline/api";

export function usePipelineStages(pipelineId?: string) {
  return useQuery({ queryKey: ["pipeline-stages", pipelineId], queryFn: () => getPipelineStages(pipelineId) });
}
