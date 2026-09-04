import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createOpportunity, deleteOpportunity, getOpportunities, getOpportunity, moveOpportunityStage, updateOpportunity } from "@/features/opportunities/api";
import type { Opportunity } from "@/types/api";
import type { QueryParams } from "@/types/common";

export function useOpportunities(params: QueryParams = {}) {
  return useQuery({ queryKey: ["opportunities", params], queryFn: () => getOpportunities(params) });
}

export function useOpportunity(id?: string) {
  return useQuery({ queryKey: ["opportunity", id], queryFn: () => getOpportunity(id!), enabled: Boolean(id) });
}

export function useCreateOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Opportunity>) => createOpportunity(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Opportunity> }) => updateOpportunity(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["opportunity", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useMoveOpportunityStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pipelineStageId }: { id: string; pipelineStageId: string }) => moveOpportunityStage(id, pipelineStageId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["opportunity", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOpportunity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
