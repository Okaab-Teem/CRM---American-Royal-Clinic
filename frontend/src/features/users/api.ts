import { api, useMocks } from "@/lib/api-client";
import { users as mockUsers } from "@/features/mock/data";
import type { CurrentUser, UserRole } from "@/types/common";

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  password?: string;
}

export async function getUsers(): Promise<CurrentUser[]> {
  if (useMocks) {
    return mockUsers;
  }
  const response = await api.get<CurrentUser[]>("/users");
  return response.data;
}

export async function getUser(id: string): Promise<CurrentUser> {
  if (useMocks) {
    const user = mockUsers.find((u) => u.id === id);
    if (!user) throw new Error("User not found.");
    return user;
  }
  const response = await api.get<CurrentUser>(`/users/${id}`);
  return response.data;
}

export async function createUser(input: CreateUserInput): Promise<CurrentUser> {
  if (useMocks) {
    const newUser: CurrentUser = {
      id: `u-${Date.now()}`,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      role: input.role,
      isActive: true,
      permissions: ["dashboard.view", "customer.view", "opportunity.view"],
    };
    mockUsers.push(newUser);
    return newUser;
  }
  const response = await api.post<CurrentUser>("/users", input);
  return response.data;
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<CurrentUser> {
  if (useMocks) {
    const userIndex = mockUsers.findIndex((u) => u.id === id);
    if (userIndex === -1) throw new Error("User not found.");
    const updated: CurrentUser = {
      ...mockUsers[userIndex],
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      role: input.role,
      isActive: input.isActive,
    };
    mockUsers[userIndex] = updated;
    return updated;
  }
  const response = await api.put<CurrentUser>(`/users/${id}`, input);
  return response.data;
}

export async function deleteUser(id: string): Promise<void> {
  if (useMocks) {
    const idx = mockUsers.findIndex((u) => u.id === id);
    if (idx !== -1) mockUsers.splice(idx, 1);
    return;
  }
  await api.delete(`/users/${id}`);
}
