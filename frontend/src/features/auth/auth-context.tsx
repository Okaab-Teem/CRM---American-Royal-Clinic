import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { getCurrentUser, login as loginRequest, type LoginInput } from "@/features/auth/api";
import type { CurrentUser } from "@/types/common";

interface AuthContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<CurrentUser | null>(() => {
    const stored = localStorage.getItem("flowcrm.user");
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(Boolean(localStorage.getItem("flowcrm.token")));

  useEffect(() => {
    if (!localStorage.getItem("flowcrm.token")) return;
    getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
        localStorage.setItem("flowcrm.user", JSON.stringify(currentUser));
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const result = await loginRequest(input);
    localStorage.setItem("flowcrm.token", result.token);
    localStorage.setItem("flowcrm.user", JSON.stringify(result.user));
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("flowcrm.token");
    localStorage.removeItem("flowcrm.user");
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, isLoading, login, logout }), [user, isLoading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
