import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCustomer, getCustomer, getCustomerTimeline, getCustomers, updateCustomer, type CustomerInput } from "@/features/customers/api";
import type { QueryParams } from "@/types/common";

export function useCustomers(params: QueryParams = {}) {
  return useQuery({ queryKey: ["customers", params], queryFn: () => getCustomers(params) });
}

export function useCustomer(id?: string) {
  return useQuery({ queryKey: ["customer", id], queryFn: () => getCustomer(id!), enabled: Boolean(id) });
}

export function useCustomerTimeline(id?: string) {
  return useQuery({ queryKey: ["customer-timeline", id], queryFn: () => getCustomerTimeline(id!), enabled: Boolean(id) });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CustomerInput) => createCustomer(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CustomerInput }) => updateCustomer(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
