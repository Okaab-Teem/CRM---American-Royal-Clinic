import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { convertLead, createLead, deleteLead, getLead, getLeads, updateLead } from "@/features/leads/api";
import type { Lead } from "@/types/api";
import type { QueryParams } from "@/types/common";

export function useLeads(params: QueryParams) {
  return useQuery({ queryKey: ["leads", params], queryFn: () => getLeads(params) });
}

export function useLead(id?: string) {
  return useQuery({ queryKey: ["lead", id], queryFn: () => getLead(id!), enabled: Boolean(id) });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Lead>) => createLead(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Lead> }) => updateLead(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead", variables.id] });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useConvertLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input?: { estimatedValue?: number; expectedCloseDate?: string; notes?: string };
    }) => convertLead(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
