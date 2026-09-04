import { useAuth } from "@/features/auth/auth-context";

export function useCurrentUser() {
  return useAuth().user;
}
