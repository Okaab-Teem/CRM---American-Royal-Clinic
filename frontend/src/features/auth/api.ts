import { api, useMocks } from "@/lib/api-client";
import { users } from "@/features/mock/data";
import type { CurrentUser } from "@/types/common";

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: CurrentUser;
}

export async function login(input: LoginInput): Promise<LoginResult> {
  if (useMocks) {
    const user = users.find((item) => item.email.toLowerCase() === input.email.toLowerCase());
    if (!user || input.password.length < 1) throw new Error("Incorrect email or password.");
    return { token: `mock-token-${user.id}`, user };
  }
  const response = await api.post<LoginResult>("/auth/login", input);
  return response.data;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  if (useMocks) {
    const storedUser = localStorage.getItem("flowcrm.user");
    return storedUser ? JSON.parse(storedUser) : users[2];
  }
  const response = await api.get<CurrentUser>("/auth/me");
  return response.data;
}
