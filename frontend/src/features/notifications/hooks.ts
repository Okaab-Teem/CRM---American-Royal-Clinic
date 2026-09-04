import { useQuery } from "@tanstack/react-query";
import { api, useMocks } from "@/lib/api-client";
import { notifications } from "@/features/mock/data";
import type { Notification } from "@/types/api";

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (useMocks) return notifications;
      const response = await api.get<Notification[]>("/notifications");
      return response.data;
    },
  });
}
