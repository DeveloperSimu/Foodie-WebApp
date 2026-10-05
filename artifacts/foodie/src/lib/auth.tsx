import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@workspace/api-client-react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { clearAdminSession } from "@/lib/admin-auth";

const LOCAL_AUTH_KEY = "foodie_local_auth";
const LOCAL_USERS_KEY = "foodie_local_users";
const LOCAL_DISABLED_USERS_KEY = "foodie_local_disabled_users";

type LocalAuth = {
  token: string;
  user: User;
  password: string;
};

function readLocalAuth(): LocalAuth | null {
  const stored = localStorage.getItem(LOCAL_AUTH_KEY);
  if (!stored) return null;
  try {
    const parsed: unknown = JSON.parse(stored);
    if (
      parsed &&
      typeof parsed === "object" &&
      "token" in parsed &&
      "user" in parsed &&
      "password" in parsed &&
      typeof parsed.token === "string" &&
      typeof parsed.password === "string"
    ) {
      return parsed as LocalAuth;
    }
  } catch {
    localStorage.removeItem(LOCAL_AUTH_KEY);
  }
  return null;
}

export function createLocalAuth(
  name: string,
  email: string,
  password: string,
  role: User["role"],
  avatarUrl?: string,
): LocalAuth {
  const user: User = {
    id: Date.now(),
    name,
    email,
    role,
    avatarUrl: avatarUrl || null,
    bio: null,
    createdAt: new Date().toISOString(),
  };
  const auth = { token: `local-${user.id}`, user, password };
  localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(auth));
  const users = getLocalUsers();
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify([user, ...users.filter((item) => item.id !== user.id)]));
  return auth;
}

export function getLocalUsers(): User[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed as User[] : [];
  } catch {
    return [];
  }
}

export function isLocalUserDisabled(userId: number): boolean {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(LOCAL_DISABLED_USERS_KEY) || "[]");
    return Array.isArray(parsed) && parsed.includes(userId);
  } catch {
    return false;
  }
}

export function setLocalUserDisabled(userId: number, disabled: boolean): void {
  const current = (() => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(LOCAL_DISABLED_USERS_KEY) || "[]");
      return Array.isArray(parsed) ? parsed.filter((id): id is number => typeof id === "number") : [];
    } catch {
      return [];
    }
  })();
  const next = disabled
    ? [...new Set([...current, userId])]
    : current.filter((id) => id !== userId);
  localStorage.setItem(LOCAL_DISABLED_USERS_KEY, JSON.stringify(next));
}

export function getLocalAuth(email: string, password: string): LocalAuth | null {
  const auth = readLocalAuth();
  return auth && !isLocalUserDisabled(auth.user.id) && auth.user.email === email && auth.password === password ? auth : null;
}

export function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    const responseData = "data" in error ? error.data : undefined;
    const status = getErrorStatus(error);
    if (status !== undefined && status >= 500) {
      return "Authentication service is unavailable. Please try again shortly.";
    }
    if (
      responseData &&
      typeof responseData === "object" &&
      "error" in responseData &&
      typeof responseData.error === "string"
    ) {
      return responseData.error;
    }
    return error.message;
  }
  return fallback;
}

function getErrorStatus(error: unknown): number | undefined {
  if (error && typeof error === "object" && "status" in error) {
    const status = error.status;
    return typeof status === "number" ? status : undefined;
  }
  return undefined;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<Pick<User, "name" | "avatarUrl" | "bio">>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("foodie_token"));
  const localAuth = readLocalAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("foodie_token"));
  }, []);

  const { data: user, isLoading: isUserLoading, error: userError } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
      initialData: token === localAuth?.token ? localAuth.user : undefined,
    }
  });

  useEffect(() => {
    const status = getErrorStatus(userError);
    if (status === 401 || status === 403 || status === 404) {
      logout();
    }
  }, [userError]);

  const login = (newToken: string, userObj: User) => {
    clearAdminSession();
    localStorage.setItem("foodie_token", newToken);
    setToken(newToken);
    queryClient.setQueryData(getGetMeQueryKey(), userObj);
    setLocation("/");
  };

  const logout = () => {
    localStorage.removeItem("foodie_token");
    setToken(null);
    queryClient.setQueryData(getGetMeQueryKey(), null);
    queryClient.clear();
    setLocation("/login");
  };

  const updateUser = (updates: Partial<Pick<User, "name" | "avatarUrl" | "bio">>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    const local = readLocalAuth();
    if (local && local.token === token) {
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify({ ...local, user: updatedUser }));
    }
    queryClient.setQueryData(getGetMeQueryKey(), updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading: !!token && isUserLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
