const ADMIN_SESSION_KEY = "foodie_admin_token";

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_SESSION_KEY);
}

export function clearAdminSession(): void {
  localStorage.removeItem(ADMIN_SESSION_KEY);
  localStorage.removeItem("foodie_admin_session");
}

export async function loginAdmin(email: string, password: string): Promise<boolean> {
  const response = await fetch("/api/auth/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (response.status === 401) return false;
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : "Admin login is unavailable. Please try again.";
    throw new Error(message);
  }

  const body: unknown = await response.json();
  if (!body || typeof body !== "object" || !("token" in body) || typeof body.token !== "string") {
    throw new Error("Admin login returned an invalid session.");
  }
  localStorage.setItem(ADMIN_SESSION_KEY, body.token);
  return true;
}

export async function verifyAdminSession(): Promise<boolean> {
  const token = getAdminToken();
  if (!token) return false;

  const response = await fetch("/api/auth/admin/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 401 || response.status === 403) {
    logoutAdmin();
    return false;
  }
  if (!response.ok) {
    throw new Error("Could not verify admin access. Please try again.");
  }
  return true;
}

export async function logoutAdmin(): Promise<void> {
  const token = getAdminToken();
  clearAdminSession();
  if (!token) return;

  const response = await fetch("/api/auth/admin/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok && response.status !== 401) {
    throw new Error("Could not end the admin session on the server.");
  }
}
