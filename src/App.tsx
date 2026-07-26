import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

import AppRouter from "./router/AppRouter";

import Navbar from "./components/Navbar";
import AuthModal from "./components/AuthModal";
import Footer from "./components/Footer";

import AdminPanel from "./pages/AdminPanel";

import { siteName, type Product } from "./data";
import { useRetailCart } from "./context/RetailCartContext";
import { useWholesaleRequest } from "./context/WholesaleRequestContext";

import { useToast } from "./hooks/useToast";
import { useAuth } from "./hooks/useAuth";
import { useProducts } from "./hooks/useProducts";
import { useNavigation } from "./hooks/useNavigation";
import { type User, type StoredOrder } from "./storage";
import { useOrders } from "./hooks/useOrders";
import type { Order } from "./api/client";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);
  return null;
}

// ─── Map API order → shape used by AdminPanel ─────────────────────────
const STATUS_FA: Record<string, StoredOrder["status"]> = {
  PENDING: "جدید",
  CONFIRMED: "در حال پیگیری",
  PREPARING: "در حال پیگیری",
  SHIPPED: "در حال پیگیری",
  DELIVERED: "انجام شده",
  CANCELLED: "لغو شده",
};

function mapOrderToStored(o: Order): StoredOrder {
  return {
    id: String(o.id),
    customerName: o.name,
    customerPhone: o.phone,
    productName: o.items?.map((i) => `${i.product_name} ×${i.quantity}`).join("، ") || "",
    message: o.message || "",
    status: STATUS_FA[o.order_status] ?? "جدید",
    createdAt: new Date(o.created_at).toLocaleDateString("fa-IR"),
  };
}

export default function App() {
  const {
    page,

    lastOrderNumber,

    goHome,
    goShop,
    goAdmin,
    goAbout,
    goRetailCart,
    goWholesaleRequest,
    goProductDetails,
    goOrderSuccess,
    handleSearch,
  } = useNavigation();

  const { retailCart, getRetailCount, clearRetailCart } = useRetailCart();
  const { addWholesaleItem, clearWholesaleRequest } = useWholesaleRequest();

  const { products } = useProducts();
  const { orders, fetchOrders, createOrder, addWholesaleOrder } = useOrders();

  const { toast, showToast } = useToast();
  const { user, login, logout } = useAuth();

  const [authOpen, setAuthOpen] = useState(false);

  // Fetch orders for admin panel
  useEffect(() => {
    if (page === "admin" && user?.role === "admin") {
      fetchOrders();
    }
  }, [page, user, fetchOrders]);

  const handleLogin = (newUser: User) => {
    login(newUser);
    showToast(`خوش آمدید، ${newUser.name}`);
    if (newUser.role === "admin") {
      goAdmin();
    }
  };

  const handleLogout = () => {
    logout();
    showToast("از حساب کاربری خارج شدید");
    if (page === "admin") {
      goHome();
    }
  };

  const handleRetailCheckout = async () => {
    try {
      if (retailCart.length === 0) {
        showToast("سبد خرید خالی است");
        return;
      }

      const order = await createOrder({
        name: user?.name || "مهمان",
        phone: user?.phone || "",
        items: retailCart.map((item) => ({
          product_id: item.id,
          quantity: item.qty,
        })),
      });

      goOrderSuccess(order.order_number);
      clearRetailCart();
      showToast("سفارش شما با موفقیت ثبت شد");
    } catch {
      showToast("خطا در ثبت سفارش. لطفاً دوباره تلاش کنید.");
    }
  };

  const handleWholesaleSubmit = async (formData: any, items: any[]) => {
    try {
      await addWholesaleOrder(formData, items);
      clearWholesaleRequest();
      goHome();
      showToast("درخواست استعلام عمده شما ثبت شد و در پنل مدیریت قرار گرفت.");
    } catch {
      showToast("خطا در ثبت درخواست. لطفاً دوباره تلاش کنید.");
    }
  };

  const handleAddToWholesale = (product: Product) => {
    addWholesaleItem(product);
    showToast("به لیست استعلام عمده اضافه شد");
  };

  const handleUpdateProducts = () => {
    showToast("کاتالوگ بروزرسانی شد");
  };

  const handleUpdateOrders = () => {
    showToast("وضعیت سفارش بروزرسانی شد");
  };

  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  if (page === "admin") {
    return (
      <AdminPanel
        products={products}
        orders={orders.map(mapOrderToStored)}
        onUpdateProducts={handleUpdateProducts}
        onUpdateOrders={handleUpdateOrders}
        onBack={goHome}
      />
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 font-sans text-stone-800">
      <ScrollToTop />
      <Navbar
        siteName={siteName}
        user={user}
        currentPage={page}
        cartCount={getRetailCount()}
        onHome={goHome}
        onShop={() => goShop(null)}
        onOrder={goWholesaleRequest}
        onAbout={goAbout}
        onContact={scrollToContact}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenAdmin={goAdmin}
        onLogout={handleLogout}
        onOpenCart={goRetailCart}
        onSearch={handleSearch}
      />

      <main className="pt-36 lg:pt-52">
        <AppRouter
          products={products}
          lastOrderNumber={lastOrderNumber}
          goShop={goShop}
          goWholesaleRequest={goWholesaleRequest}
          goProductDetails={(product) => goProductDetails(product.id)}
          onWholesale={handleAddToWholesale}
          handleRetailCheckout={handleRetailCheckout}
          handleWholesaleSubmit={handleWholesaleSubmit}
        />
      </main>

      <Footer
        id="contact"
        siteName={siteName}
        onOrder={goWholesaleRequest}
        onShop={() => goShop(null)}
        onAbout={goAbout}
        onContact={scrollToContact}
      />

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onLogin={handleLogin}
      />

      {toast && (
        <div className="fixed bottom-8 left-1/2 z-[150] -translate-x-1/2 rounded-2xl bg-stone-900 px-6 py-3.5 text-sm font-bold text-white shadow-2xl animate-in slide-in-from-bottom-5">
          {toast}
        </div>
      )}
    </div>
  );
}
