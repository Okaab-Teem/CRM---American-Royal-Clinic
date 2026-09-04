import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { completeTask, createTask, getTasks, type CreateTaskInput } from "@/features/tasks/api";
import type { QueryParams } from "@/types/common";

export function useTasks(params: QueryParams = {}) {
  return useQuery({ queryKey: ["tasks", params], queryFn: () => getTasks(params) });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: completeTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
