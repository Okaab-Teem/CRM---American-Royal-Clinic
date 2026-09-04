import { api, useMocks } from "@/lib/api-client";
import { stages } from "@/features/mock/data";
import type { PipelineStage } from "@/types/api";

export async function getPipelineStages(pipelineId = "pipe-default"): Promise<PipelineStage[]> {
  if (useMocks) return stages;
  const response = await api.get<PipelineStage[]>(`/pipelines/${pipelineId}/stages`);
  return response.data;
}
