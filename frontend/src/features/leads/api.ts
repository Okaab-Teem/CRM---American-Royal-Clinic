import { api, useMocks } from "@/lib/api-client";
import { customers, leads, opportunities, saveToStorage } from "@/features/mock/data";
import { filterAndPage } from "@/features/common/listing";
import type { Lead } from "@/types/api";
import type { PagedResult, QueryParams } from "@/types/common";

export async function getLeads(params: QueryParams = {}): Promise<PagedResult<Lead>> {
  if (useMocks) {
    return filterAndPage(leads, params, (lead, search) =>
      `${lead.firstName} ${lead.lastName} ${lead.companyName} ${lead.email ?? ""}`.toLowerCase().includes(search),
    );
  }
  const response = await api.get<PagedResult<Lead>>("/leads", { params });
  return response.data;
}

export async function getLead(id: string): Promise<Lead> {
  if (useMocks) {
    const lead = leads.find((item) => item.id === id);
    if (!lead) throw new Error("Lead not found.");
    return lead;
  }
  const response = await api.get<Lead>(`/leads/${id}`);
  return response.data;
}

export async function createLead(input: Partial<Lead>): Promise<Lead> {
  if (useMocks) {
    const newLead: Lead = {
      id: crypto.randomUUID(),
      firstName: input.firstName ?? "",
      lastName: input.lastName ?? "",
      companyName: input.companyName ?? "",
      status: input.status ?? "New",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...input,
    } as Lead;
    leads.unshift(newLead);
    saveToStorage("flowcrm.mock.leads", leads);
    return newLead;
  }
  const response = await api.post<Lead>("/leads", input);
  return response.data;
}

export async function updateLead(id: string, input: Partial<Lead>): Promise<Lead> {
  if (useMocks) {
    const index = leads.findIndex((item) => item.id === id);
    if (index >= 0) {
      leads[index] = { ...leads[index], ...input, updatedAt: new Date().toISOString() };
      saveToStorage("flowcrm.mock.leads", leads);
      return leads[index];
    }
    throw new Error("Lead not found.");
  }
  const response = await api.put<Lead>(`/leads/${id}`, input);
  return response.data;
}

export async function deleteLead(id: string): Promise<void> {
  if (useMocks) {
    const index = leads.findIndex((item) => item.id === id);
    if (index >= 0) {
      leads.splice(index, 1);
      saveToStorage("flowcrm.mock.leads", leads);
    }
    return;
  }
  await api.delete(`/leads/${id}`);
}

export async function convertLead(
  id: string,
  input?: { estimatedValue?: number; expectedCloseDate?: string; notes?: string },
): Promise<{ customerId: string; opportunityId: string }> {
  if (useMocks) {
    const lead = leads.find((item) => item.id === id);
    if (!lead) throw new Error("Lead not found.");

    lead.status = "Converted";
    lead.updatedAt = new Date().toISOString();

    // Find existing customer or create a new one for this company
    let customer = customers.find((c) => c.companyName.toLowerCase() === lead.companyName.toLowerCase());
    if (!customer) {
      const cleanId = lead.id.replace("lead-", "");
      customer = {
        id: `cust-${cleanId}`,
        companyName: lead.companyName,
        industry: "Logistics",
        email: lead.email ?? "",
        phone: lead.phone ?? "",
        status: "Active",
        assignedUserId: lead.assignedUserId,
        assignedUser: lead.assignedUser,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      customers.unshift(customer);
    } else {
      customer.status = "Active";
      customer.updatedAt = new Date().toISOString();
    }

    const fallbackUser = lead.assignedUser ?? {
      id: lead.assignedUserId ?? "u-admin",
      firstName: "Flow",
      lastName: "Admin",
      email: "admin@flowcrm.local",
      role: "Admin",
    };

    // Create or find opportunity for this customer
    const cleanId = lead.id.replace("lead-", "");
    const oppId = `opp-${cleanId}`;
    let opp = opportunities.find((o) => o.id === oppId || o.customerId === customer!.id);
    if (!opp) {
      const newOpp = {
        id: oppId,
        name: `${lead.companyName} - Deal`,
        customerId: customer.id,
        customerName: customer.companyName,
        leadId: lead.id,
        pipelineId: "pipe-default",
        pipelineName: "Default Sales Pipeline",
        pipelineStageId: "stage-qualified",
        stageName: "Qualified",
        assignedUserId: fallbackUser.id,
        assignedUser: fallbackUser,
        value: input?.estimatedValue ?? lead.estimatedValue ?? 0,
        expectedCloseDate: input?.expectedCloseDate ?? new Date(Date.now() + 30 * 86400000).toISOString(),
        probability: 40,
        description: input?.notes ?? `Converted from lead ${lead.firstName} ${lead.lastName}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      opportunities.unshift(newOpp);
      opp = newOpp;
    }

    saveToStorage("flowcrm.mock.leads", leads);
    saveToStorage("flowcrm.mock.customers", customers);
    saveToStorage("flowcrm.mock.opportunities", opportunities);

    return { customerId: customer.id, opportunityId: opp.id };
  }
  const response = await api.post<{ customerId: string; opportunityId: string }>(`/leads/${id}/convert`, input ?? {});
  return response.data;
}
