import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createActivity, getActivities, type CreateActivityInput } from "@/features/activities/api";
import type { QueryParams } from "@/types/common";

export function useActivities(params: QueryParams = {}) {
  return useQuery({ queryKey: ["activities", params], queryFn: () => getActivities(params) });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateActivityInput) => createActivity(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      if (variables.customerId) {
        queryClient.invalidateQueries({ queryKey: ["customerTimeline", variables.customerId] });
      }
    },
  });
}
