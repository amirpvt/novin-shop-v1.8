const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
const TOKEN_KEY = "novin_auth_tokens";

export type AuthTokens = {
  access: string;
  refresh: string;
};

export const tokenStore = {
  get(): AuthTokens | null {
    try {
      const raw = localStorage.getItem(TOKEN_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.access && !parsed?.refresh) return null;
      return parsed;
    } catch {
      return null;
    }
  },

  set(tokens: AuthTokens) {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  },

  clear() {
    localStorage.removeItem(TOKEN_KEY);
  },
};

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const tokens = tokenStore.get();
  if (!tokens?.refresh) return null;

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: tokens.refresh }),
    })
      .then(async (res) => {
        if (!res.ok) {
          tokenStore.clear();
          window.dispatchEvent(new Event("novin_auth_expired"));
          return null;
        }

        const data = await res.json();
        if (!data?.access) {
          tokenStore.clear();
          window.dispatchEvent(new Event("novin_auth_expired"));
          return null;
        }

        const nextTokens = {
          access: data.access,
          refresh: data.refresh || tokens.refresh,
        };
        tokenStore.set(nextTokens);
        return nextTokens.access;
      })
      .catch(() => {
        tokenStore.clear();
        window.dispatchEvent(new Event("novin_auth_expired"));
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function apiFetchWithAuthRefresh(path: string, options: RequestInit = {}): Promise<Response> {
  const makeHeaders = (access?: string) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (access) headers.Authorization = `Bearer ${access}`;
    return headers;
  };

  const tokens = tokenStore.get();
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

  let res = await fetch(url, {
    ...options,
    headers: makeHeaders(tokens?.access),
  });

  if (res.status !== 401 || !tokens?.refresh) {
    return res;
  }

  const newAccess = await refreshAccessToken();
  if (!newAccess) return res;

  res = await fetch(url, {
    ...options,
    headers: makeHeaders(newAccess),
  });

  return res;
}
