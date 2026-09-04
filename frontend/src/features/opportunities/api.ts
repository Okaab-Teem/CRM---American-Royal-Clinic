import { api, useMocks } from "@/lib/api-client";
import { opportunities, stages, saveToStorage } from "@/features/mock/data";
import { filterAndPage } from "@/features/common/listing";
import type { Opportunity } from "@/types/api";
import type { PagedResult, QueryParams } from "@/types/common";

export async function getOpportunities(params: QueryParams = {}): Promise<PagedResult<Opportunity>> {
  if (useMocks) {
    return filterAndPage(opportunities, params, (opp, search) =>
      `${opp.name} ${opp.customerName} ${opp.stageName} ${opp.assignedUser?.firstName ?? ""} ${opp.contactName ?? ""}`.toLowerCase().includes(search),
    );
  }
  const response = await api.get<PagedResult<Opportunity>>("/opportunities", { params });
  return response.data;
}

export async function getOpportunity(id: string): Promise<Opportunity> {
  if (useMocks) {
    const opportunity = opportunities.find((item) => item.id === id);
    if (!opportunity) throw new Error("Opportunity not found.");
    return opportunity;
  }
  const response = await api.get<Opportunity>(`/opportunities/${id}`);
  return response.data;
}

export async function createOpportunity(input: Partial<Opportunity>): Promise<Opportunity> {
  if (useMocks) {
    const stage = stages.find((s) => s.id === input.pipelineStageId) ?? stages[0];
    const newOpp: Opportunity = {
      id: `opp-${Date.now()}`,
      name: input.name ?? "New Deal",
      customerId: input.customerId ?? "cust-acme",
      customerName: input.customerName ?? "Acme Manufacturing",
      pipelineId: input.pipelineId ?? "pipe-enterprise-v2",
      pipelineName: input.pipelineName ?? "Enterprise Software Pipeline v2",
      pipelineStageId: stage.id,
      stageName: stage.name,
      assignedUserId: input.assignedUserId ?? "u-sara",
      assignedUser: input.assignedUser ?? {
        id: "u-sara",
        firstName: "Sara",
        lastName: "Ahmed",
        email: "sara@flowcrm.local",
        role: "SalesRepresentative",
      },
      value: input.value ?? 50000,
      expectedCloseDate: input.expectedCloseDate ?? new Date(Date.now() + 45 * 86400000).toISOString(),
      probability: stage.probability,
      contactName: input.contactName ?? "General Inquiries",
      healthBadge: input.healthBadge ?? { type: "track", text: "🟢 On Track" },
      nextActivity: input.nextActivity ?? { text: "📞 Discovery Call: Next week", type: "call" },
      description: input.description ?? "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...input,
    } as Opportunity;

    opportunities.unshift(newOpp);
    saveToStorage("flowcrm.mock.opportunities", opportunities);
    return newOpp;
  }
  const response = await api.post<Opportunity>("/opportunities", input);
  return response.data;
}

export async function moveOpportunityStage(id: string, pipelineStageId: string): Promise<Opportunity> {
  if (useMocks) {
    const opportunity = opportunities.find((item) => item.id === id);
    if (!opportunity) throw new Error("Opportunity not found.");

    opportunity.pipelineStageId = pipelineStageId;
    const stage = stages.find((s) => s.id === pipelineStageId);
    if (stage) {
      opportunity.stageName = stage.name;
      opportunity.probability = stage.probability;
    } else if (pipelineStageId === "stage-lost") {
      opportunity.stageName = "Closed Lost";
      opportunity.probability = 0;
    }
    opportunity.updatedAt = new Date().toISOString();
    saveToStorage("flowcrm.mock.opportunities", opportunities);
    return opportunity;
  }
  const response = await api.patch<Opportunity>(`/opportunities/${id}/stage`, { pipelineStageId });
  return response.data;
}

export async function updateOpportunity(id: string, input: Partial<Opportunity>): Promise<Opportunity> {
  if (useMocks) {
    const opp = opportunities.find((item) => item.id === id);
    if (!opp) throw new Error("Opportunity not found.");
    Object.assign(opp, input, { updatedAt: new Date().toISOString() });
    saveToStorage("flowcrm.mock.opportunities", opportunities);
    return opp;
  }
  const response = await api.put<Opportunity>(`/opportunities/${id}`, input);
  return response.data;
}

export async function deleteOpportunity(id: string): Promise<void> {
  if (useMocks) {
    const index = opportunities.findIndex((item) => item.id === id);
    if (index >= 0) {
      opportunities.splice(index, 1);
      saveToStorage("flowcrm.mock.opportunities", opportunities);
    }
    return;
  }
  await api.delete(`/opportunities/${id}`);
}

