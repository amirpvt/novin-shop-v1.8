/**
 * dashboard_routes.tsx - روت‌های جدید کاملا جدا از روت‌های اصلی سایت
 * همه زیر /dashboard/* و با RoleGuard محافظت می‌شوند
 * مسیرهای عمومی سایت (/, /shop, /about, /login قدیمی) تحت تاثیر نیستند
 */
import { Routes, Route, Navigate } from "react-router-dom";
import RoleGuard from "../components/RoleGuard";
import DashboardLayout from "../components/DashboardLayout";

// Owner pages
import OwnerDashboard from "../pages/OwnerDashboard";
import OwnerPricing from "../pages/OwnerPricing";
import OwnerCommissions from "../pages/OwnerCommissions";
import OwnerOrdersManagement from "../pages/OwnerOrdersManagement";
import OwnerUsers from "../pages/OwnerUsers";

// Admin pages
import AdminStoreDashboard from "../pages/AdminStoreDashboard";

// Visitor pages
import VisitorDashboard from "../pages/VisitorDashboard";
import VisitorOrderCreate from "../pages/VisitorOrderCreate";
import VisitorCustomers from "../pages/VisitorCustomers";

// Customer pages
import CustomerDashboard from "../pages/CustomerDashboard";
import MyOrders from "../pages/MyOrders";

// برای گزارش بدهکاران و ویزیتورها از همان OwnerDashboard یا کامپوننت جدا استفاده می‌کنیم
// فعلا از OwnerDashboard برای همه گزارش‌ها استفاده می‌کنیم - می‌توان جدا کرد

import VisitorReportWithOrders from "../pages/OwnerVisitorReport";
import CustomerOrdersPro from "../pages/CustomerOrdersPro";

export default function DashboardRoutes() {
  return (
    <Routes>
      {/* Redirect /dashboard to role-based home */}
      <Route path="/" element={<Navigate to="/dashboard/redirect" replace />} />

      {/* Auto redirect based on role */}
      <Route
        path="/redirect"
        element={
          <RoleGuard allowedRoles={["manager", "admin", "visitor", "customer"]}>
            <RedirectByRole />
          </RoleGuard>
        }
      />

      {/* ─── Owner / Manager ─────────────────────────────────────────── */}
      <Route
        path="/manager"
        element={
          <RoleGuard allowedRoles={["manager"]}>
            <DashboardLayout role="manager">
              <OwnerDashboard />
            </DashboardLayout>
          </RoleGuard>
        }
      />
      <Route
        path="/manager/pricing"
        element={
          <RoleGuard allowedRoles={["manager"]}>
            <DashboardLayout role="manager">
              <OwnerPricing />
            </DashboardLayout>
          </RoleGuard>
        }
      />
      <Route
        path="/manager/orders"
        element={
          <RoleGuard allowedRoles={["manager"]}>
            <DashboardLayout role="manager">
              <OwnerOrdersManagement />
            </DashboardLayout>
          </RoleGuard>
        }
      />
      <Route
        path="/manager/commissions"
        element={
          <RoleGuard allowedRoles={["manager"]}>
            <DashboardLayout role="manager">
              <OwnerCommissions />
            </DashboardLayout>
          </RoleGuard>
        }
      />
      <Route
        path="/manager/users"
        element={
          <RoleGuard allowedRoles={["manager"]}>
            <DashboardLayout role="manager">
              <OwnerUsers />
            </DashboardLayout>
          </RoleGuard>
        }
      />
      <Route
        path="/manager/visitors"
        element={
          <RoleGuard allowedRoles={["manager"]}>
            <DashboardLayout role="manager">
              <OwnerDashboard />
            </DashboardLayout>
          </RoleGuard>
        }
      />
      <Route
        path="/manager/debtors"
        element={
          <RoleGuard allowedRoles={["manager"]}>
            <DashboardLayout role="manager">
              <OwnerDashboard />
            </DashboardLayout>
          </RoleGuard>
        }
      />

      {/* ─── Admin Store ─────────────────────────────────────────────── */}
      <Route
        path="/admin"
        element={
          <RoleGuard allowedRoles={["admin", "manager"]}>
            <DashboardLayout role="admin">
              <AdminStoreDashboard />
            </DashboardLayout>
          </RoleGuard>
        }
      />
      <Route
        path="/admin/orders/new"
        element={
          <RoleGuard allowedRoles={["admin", "manager"]}>
            <DashboardLayout role="admin">
              <AdminStoreDashboard />
            </DashboardLayout>
          </RoleGuard>
        }
      />
      <Route
        path="/admin/orders/pending"
        element={
          <RoleGuard allowedRoles={["admin", "manager"]}>
            <DashboardLayout role="admin">
              <AdminStoreDashboard />
            </DashboardLayout>
          </RoleGuard>
        }
      />
      <Route
        path="/admin/stock"
        element={
          <RoleGuard allowedRoles={["admin", "manager"]}>
            <DashboardLayout role="admin">
              <AdminStoreDashboard />
            </DashboardLayout>
          </RoleGuard>
        }
      />

      {/* ─── Visitor ─────────────────────────────────────────────────── */}
      <Route
        path="/visitor/today"
        element={
          <RoleGuard allowedRoles={["visitor", "manager"]}>
            <DashboardLayout role="visitor">
              <VisitorDashboard />
            </DashboardLayout>
          </RoleGuard>
        }
      />
      <Route
        path="/visitor/customers"
        element={
          <RoleGuard allowedRoles={["visitor", "manager"]}>
            <DashboardLayout role="visitor">
              <VisitorCustomers />
            </DashboardLayout>
          </RoleGuard>
        }
      />
      <Route
        path="/visitor/order"
        element={
          <RoleGuard allowedRoles={["visitor", "manager"]}>
            <DashboardLayout role="visitor">
              <VisitorOrderCreate />
            </DashboardLayout>
          </RoleGuard>
        }
      />
      <Route
        path="/visitor/cash"
        element={
          <RoleGuard allowedRoles={["visitor", "manager"]}>
            <DashboardLayout role="visitor">
              <VisitorDashboard />
            </DashboardLayout>
          </RoleGuard>
        }
      />
      <Route
        path="/visitor/commission"
        element={
          <RoleGuard allowedRoles={["visitor", "manager"]}>
            <DashboardLayout role="visitor">
              <VisitorDashboard />
            </DashboardLayout>
          </RoleGuard>
        }
      />
      {/* Alias */}
      <Route
        path="/visitor"
        element={
          <RoleGuard allowedRoles={["visitor"]}>
            <DashboardLayout role="visitor">
              <VisitorDashboard />
            </DashboardLayout>
          </RoleGuard>
        }
      />
      <Route 
        path="/dashboard/manager/visitors-report" 
        element={<VisitorReportWithOrders />} />
      <Route 
        path="/customer-orders-pro" 
        element={<CustomerOrdersPro />} />
      {/* ─── Customer ────────────────────────────────────────────────── */}
      <Route
        path="/customer/prices"
        element={
          <RoleGuard allowedRoles={["customer", "visitor", "admin", "manager"]}>
            <DashboardLayout role="customer">
              <CustomerDashboard />
            </DashboardLayout>
          </RoleGuard>
        }
      />
      <Route
        path="/customer/orders"
        element={
          <RoleGuard allowedRoles={["customer"]}>
            <DashboardLayout role="customer">
              <MyOrders />
            </DashboardLayout>
          </RoleGuard>
        }
      />
      <Route
        path="/customer/track"
        element={
          <RoleGuard allowedRoles={["customer"]}>
            <DashboardLayout role="customer">
              <MyOrders />
            </DashboardLayout>
          </RoleGuard>
        }
      />
      {/* Alias */}
      <Route
        path="/customer"
        element={
          <RoleGuard allowedRoles={["customer"]}>
            <DashboardLayout role="customer">
              <CustomerDashboard />
            </DashboardLayout>
          </RoleGuard>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<div className="p-8 text-center">داشبورد پیدا نشد - <a href="/" className="text-paprika-600 underline">بازگشت به سایت اصلی</a></div>} />
    </Routes>
  );
}

function RedirectByRole() {
  // خواندن نقش از localStorage و ریدایرکت
  try {
    const raw = localStorage.getItem("novin_user_profile");
    if (!raw) {
      // اگر پروفایل نداریم، سعی کن از توکن حدس بزنی
      return <Navigate to="/login" replace />;
    }
    const user = JSON.parse(raw);
    const role = user.role || user.customer?.role || (user.is_superuser ? "manager" : user.is_staff ? "admin" : "customer");

    if (role === "manager" || role === "superadmin") return <Navigate to="/dashboard/manager" replace />;
    if (role === "admin") return <Navigate to="/dashboard/admin" replace />;
    if (role === "visitor") return <Navigate to="/dashboard/visitor/today" replace />;
    return <Navigate to="/dashboard/customer/prices" replace />;
  } catch {
    return <Navigate to="/" replace />;
  }
}
