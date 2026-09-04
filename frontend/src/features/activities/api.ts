import { api, useMocks } from "@/lib/api-client";
import { activities } from "@/features/mock/data";
import { filterAndPage } from "@/features/common/listing";
import type { Activity, ActivityType } from "@/types/api";
import type { PagedResult, QueryParams } from "@/types/common";

export interface CreateActivityInput {
  type: ActivityType;
  subject: string;
  description?: string;
  activityDate?: string;
  customerId?: string;
  opportunityId?: string;
}

export async function getActivities(params: QueryParams = {}): Promise<PagedResult<Activity>> {
  if (useMocks) {
    return filterAndPage(activities, params, (activity, search) =>
      `${activity.type} ${activity.subject} ${activity.customerName ?? ""} ${activity.opportunityName ?? ""}`.toLowerCase().includes(search),
    );
  }
  const response = await api.get<PagedResult<Activity>>("/activities", { params });
  return response.data;
}

export async function createActivity(input: CreateActivityInput): Promise<Activity> {
  if (useMocks) {
    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      type: input.type,
      subject: input.subject,
      description: input.description,
      activityDate: input.activityDate ?? new Date().toISOString(),
      user: { id: "usr-admin", firstName: "Admin", lastName: "User", email: "admin@flowcrm.local", role: "Admin" },
      customerId: input.customerId,
      opportunityId: input.opportunityId,
    };
    activities.unshift(newActivity);
    return newActivity;
  }
  const response = await api.post<Activity>("/activities", input);
  return response.data;
}
