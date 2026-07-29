/**
 * useAuth - JWT Real API (Phase 2)
 * جایگزین: src/hooks/useAuth.ts
 *
 * این هوک با بک‌اند JWT شما کار می‌کند.
 * سازگار با App.tsx قدیمی هم هست: login می‌تواند User object یا username/password بگیرد.
 */
import { useCallback, useEffect, useState } from "react";
import { authApi, type ApiUser } from "../api/client";

export type User = ApiUser | {
  name: string;
  phone: string;
  role: "customer" | "admin" | "superadmin";
};

export function useAuth() {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tokens = localStorage.getItem("novin_auth_tokens");
    if (!tokens) {
      setLoading(false);
      return;
    }
    authApi
      .getProfile()
      .then((u) => setUser(u))
      .catch(() => {
        localStorage.removeItem("novin_auth_tokens");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // login واقعی با username/password
  const loginReal = useCallback(async (username: string, password: string) => {
    setError(null);
    try {
      const { user: u } = await authApi.login(username, password);
      setUser(u);
      return u;
    } catch (e: any) {
      setError(e.message || "خطا در ورود");
      throw e;
    }
  }, []);

  // برای سازگاری با App.tsx قدیمی که login(newUser) صدا می‌زند
  const loginCompat = useCallback((newUser: any) => {
    // اگر آبجکت User ارسال شد، مستقیم set کن (fallback قدیمی)
    if (newUser && typeof newUser === "object" && newUser.username === undefined && newUser.name) {
      // تبدیل فرمت قدیمی storage به فرمت جدید برای نمایش
      setUser(newUser as any);
      return newUser;
    }
    // اگر username/password ارسال شد، در AuthModal قبلاً لاگین شده، اینجا فقط set
    if (newUser && newUser.id) {
      setUser(newUser);
      return newUser;
    }
    return newUser;
  }, []);

  const login = useCallback(async (a: any, b?: any) => {
    // اگر دو آرگومان string بود → لاگین واقعی
    if (typeof a === "string" && typeof b === "string") {
      return loginReal(a, b);
    }
    // اگر یک آبجکت User بود → حالت سازگاری
    return loginCompat(a);
  }, [loginReal, loginCompat]);

  const register = useCallback(async (payload: {
    username: string;
    password: string;
    password2: string;
    phone: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  }) => {
    setError(null);
    try {
      const { user: u } = await authApi.register(payload);
      setUser(u);
      return u;
    } catch (e: any) {
      setError(e.message || "خطا در ثبت‌نام");
      throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  return {
    user,
    loading,
    error,
    login,
    loginReal,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin" || user?.role === "superadmin",
  };
}
