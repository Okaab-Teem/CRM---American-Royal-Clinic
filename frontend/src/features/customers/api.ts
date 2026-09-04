import { api, useMocks } from "@/lib/api-client";
import { activities, customers, opportunities, tasks } from "@/features/mock/data";
import { filterAndPage } from "@/features/common/listing";
import type { Activity, Customer, Opportunity, Task } from "@/types/api";
import type { PagedResult, QueryParams } from "@/types/common";

export interface CustomerInput {
  companyName: string;
  industry?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  assignedUserId?: string;
  status?: string;
}

export async function getCustomers(params: QueryParams = {}): Promise<PagedResult<Customer>> {
  if (useMocks) {
    return filterAndPage(customers, params, (customer, search) =>
      `${customer.companyName} ${customer.industry ?? ""} ${customer.email ?? ""}`.toLowerCase().includes(search),
    );
  }
  const response = await api.get<PagedResult<Customer>>("/customers", { params });
  return response.data;
}

export async function getCustomer(id: string): Promise<Customer> {
  if (useMocks) {
    const customer = customers.find((item) => item.id === id);
    if (!customer) throw new Error("Customer not found.");
    return customer;
  }
  const response = await api.get<Customer>(`/customers/${id}`);
  return response.data;
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  if (useMocks) {
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      companyName: input.companyName,
      industry: input.industry,
      email: input.email,
      phone: input.phone,
      website: input.website,
      address: input.address,
      assignedUserId: input.assignedUserId,
      status: input.status ?? "Active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    customers.unshift(newCustomer);
    return newCustomer;
  }
  const response = await api.post<Customer>("/customers", input);
  return response.data;
}

export async function updateCustomer(id: string, input: CustomerInput): Promise<Customer> {
  if (useMocks) {
    const index = customers.findIndex((item) => item.id === id);
    if (index !== -1) {
      customers[index] = {
        ...customers[index],
        ...input,
        updatedAt: new Date().toISOString(),
      };
      return customers[index];
    }
    throw new Error("Customer not found.");
  }
  const response = await api.put<Customer>(`/customers/${id}`, input);
  return response.data;
}

export async function getCustomerTimeline(id: string): Promise<Activity[]> {
  if (useMocks) return activities.filter((item) => item.customerId === id);
  const response = await api.get<Activity[]>(`/customers/${id}/timeline`);
  return response.data;
}

export function getMockCustomerRelated(id: string): { opportunities: Opportunity[]; tasks: Task[] } {
  return {
    opportunities: opportunities.filter((item) => item.customerId === id),
    tasks: tasks.filter((item) => item.customerId === id),
  };
}
