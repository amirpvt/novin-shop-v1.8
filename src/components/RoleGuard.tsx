/**
 * RoleGuard.tsx - محافظت از مسیرها بر اساس نقش
 * فقط فایل‌های داخل src/dashboard/ را چک می‌کند، مسیرهای عمومی سایت تحت تاثیر نیست
 */
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

type Role = "manager" | "admin" | "visitor" | "customer";

interface Props {
  children: React.ReactNode;
  allowedRoles: Role[];
  redirectTo?: string;
}

function getUserRole(): Role | null {
  try {
    // سعی کن از localStorage پروفایل را بخوانی
    const raw = localStorage.getItem("novin_auth_tokens");
    const userRaw = localStorage.getItem("novin_user_profile") || localStorage.getItem("novin_auth_user");
    
    // اگر توکن ندارید، لاگین نکرده
    if (!raw) return null;

    // از JWT payload نقش را بخوان (اگر در توکن ذخیره شده) یا از پروفایل
    if (userRaw) {
      const user = JSON.parse(userRaw);
      // اگر API ما role را برگردانده
      if (user.role) return user.role as Role;
      if (user.customer && user.customer.role) return user.customer.role as Role;
      if (user.is_superuser || user.role === "superadmin") return "manager";
      if (user.is_staff) return "admin";
    }

    // fallback: از customer_profile در localStorage یا API
    // برای سادگی، اگر کاربر لاگین است ولی نقش نداریم، customer حساب کن
    // در واقع باید از /api/auth/profile/ نقش را بگیری
    return "customer";
  } catch {
    return null;
  }
}

export default function RoleGuard({ children, allowedRoles, redirectTo = "/login" }: Props) {
  const [role, setRole] = useState<Role | null | "loading">("loading");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const check = async () => {
      try {
        const raw = localStorage.getItem("novin_auth_tokens");
        if (!raw) {
          setIsAuthenticated(false);
          setRole(null);
          return;
        }
        const tokens = JSON.parse(raw);
        if (!tokens.access) {
          setIsAuthenticated(false);
          setRole(null);
          return;
        }
        setIsAuthenticated(true);

        // سعی کن پروفایل را از API بگیری تا نقش دقیق باشد
        const base = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
        const res = await fetch(`${base}/auth/profile/`, {
          headers: { Authorization: `Bearer ${tokens.access}` },
        });
        if (res.ok) {
          const data = await res.json();
          // data.role یا data.customer.role
          const r = data.role || data.customer?.role || (data.is_superuser ? "manager" : data.is_staff ? "admin" : "customer");
          // نگاشت superadmin -> manager, old roles -> new roles
          let mapped: Role = "customer";
          if (r === "superadmin" || r === "manager") mapped = "manager";
          else if (r === "admin") mapped = "admin";
          else if (r === "visitor") mapped = "visitor";
          else mapped = "customer";

          localStorage.setItem("novin_user_profile", JSON.stringify(data));
          setRole(mapped);
        } else {
          // اگر API فیل شد، از local fallback
          setRole(getUserRole());
        }
      } catch {
        setRole(getUserRole());
      }
    };
    check();
  }, []);

  if (role === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-paprika-600 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-sm text-stone-500">در حال بررسی دسترسی...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !role) {
    return <Navigate to={redirectTo} replace />;
  }

  if (!allowedRoles.includes(role as Role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50 p-4">
        <div className="bg-white rounded-3xl p-8 border shadow-xl text-center max-w-md">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-xl font-bold">دسترسی غیرمجاز</h2>
          <p className="text-sm text-stone-500 mt-2">
            نقش شما <span className="font-bold text-paprika-600">{role}</span> است و به این بخش دسترسی ندارید.
            <br />
            بخش مجاز: {allowedRoles.join(", ")}
          </p>
          <button onClick={() => window.history.back()} className="mt-6 bg-stone-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold">
            بازگشت
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
