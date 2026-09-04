import { api, useMocks } from "@/lib/api-client";
import { dashboard } from "@/features/mock/data";
import type { Dashboard } from "@/types/api";

export async function getDashboard(): Promise<Dashboard> {
  if (useMocks) return dashboard;
  const response = await api.get<Dashboard>("/reports/dashboard");
  return response.data;
}
