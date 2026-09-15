import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import AppRouter from "./router/AppRouter";
import Navbar from "./components/Navbar";
import AuthModal from "./components/AuthModal";
import Footer from "./components/Footer";
import AdminPanel from "./pages/AdminPanel";
import { siteName } from "./data";
import { useRetailCart } from "./context/RetailCartContext";
import { useToast } from "./hooks/useToast";
import { useAuth } from "./hooks/useAuth";
import { useProducts } from "./hooks/useProducts";
import { useNavigation } from "./hooks/useNavigation";
import { useOrders } from "./hooks/useOrders";
import { ordersApi, wholesaleApi } from "./api/client";

const PENDING_WHOLESALE_CHECKOUT_KEY = "novin_pending_wholesale_checkout";

type AuthCheckoutTarget = "retail" | "wholesale" | null;

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [pathname]);
  return null;
}

export default function App() {
  const {
    page,
    lastOrderNumber,
    goHome,
    goShop,
    goAbout,
    goContact,
    goRetailCart,
    goWholesaleRequest,
    goProductDetails,
    handleSearch,
  } = useNavigation();

  const location = useLocation();

  // پنل‌های داخلی داشبورد: هدر اصلی سایت (Navbar) نمایش داده نمی‌شود
  const isDashboardPanel = location.pathname.startsWith("/dashboard/manager") || location.pathname.startsWith("/dashboard/visitor");

  const { getRetailCount, addRetailItem } = useRetailCart();

  const { products, loading: productsLoading } = useProducts();
  const { orders } = useOrders();

  const { toast, showToast } = useToast();
  const { user, login, logout } = useAuth();

  const [authOpen, setAuthOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState("login");
  const [authCheckoutTarget, setAuthCheckoutTarget] = useState<AuthCheckoutTarget>(null);

  // ✅ لاگین خودکار بر اساس نقش
  const handleLogin = async (newUser: any) => {
    login(newUser);
    showToast(`خوش آمدید، ${newUser.name || newUser.username}`);

    // بستن مودال ورود
    setAuthOpen(false);

    if (newUser.role === "manager" || newUser.role === "superadmin") {
      window.location.href = "/dashboard/manager";
      return;
    }
    if (newUser.role === "admin") {
      window.location.href = "/admin";
      return;
    }
    if (newUser.role === "visitor") {
      window.location.href = "/dashboard/visitor/today";
      return;
    }

    if (authCheckoutTarget === "wholesale") {
      const saved = localStorage.getItem(PENDING_WHOLESALE_CHECKOUT_KEY);
      if (saved) {
        try {
          const pending = JSON.parse(saved);
          if (pending?.formData && Array.isArray(pending.items) && pending.items.length > 0) {
            localStorage.removeItem(PENDING_WHOLESALE_CHECKOUT_KEY);
            setAuthCheckoutTarget(null);
            await startWholesalePayment(pending.formData, pending.items);
            return;
          }
        } catch (err: any) {
          showToast(err.message || "ثبت‌نام انجام شد، اما ثبت درخواست عمده با خطا روبرو شد");
          goWholesaleRequest();
          return;
        }
      }
      goWholesaleRequest();
      return;
    }

    if (authCheckoutTarget === "retail") {
      setAuthCheckoutTarget(null);
      try {
        await startRetailPayment(newUser);
      } catch (err: any) {
        showToast(err.message || "ثبت‌نام انجام شد، اما ایجاد پرداخت سفارش جزئی با خطا روبرو شد");
        goRetailCart();
      }
      return;
    }

    goHome();
  };

  const startRetailPayment = async (checkoutUser: any = user) => {
    const cartItems = JSON.parse(localStorage.getItem("novin_shopping_cart") || "[]");
    if (cartItems.length === 0) {
      showToast("سبد خرید خالی است");
      return;
    }
    const payment = await ordersApi.createRetailPayment({
      name: checkoutUser?.name || checkoutUser?.username || "مشتری",
      phone: checkoutUser?.phone || checkoutUser?.customer?.phone || "",
      address: checkoutUser?.customer?.address || "",
      items: cartItems.map((item: any) => ({ product_id: Number(item.id), quantity: item.qty })),
      callback_url: `${window.location.origin}/payment/verify?type=retail`,
    });
    window.location.href = payment.payment_url;
  };

  const startWholesalePayment = async (formData: any, items: any[]) => {
    const payment = await wholesaleApi.createPayment({
      company_name: formData.companyName,
      contact_person: formData.contactPerson,
      phone: formData.phone,
      address: formData.address || "",
      description: formData.description || "",
      items: items.map((item: any) => ({ product_id: item.id, quantity: item.quantity, notes: item.notes || "" })),
      callback_url: `${window.location.origin}/payment/verify?type=wholesale`,
    });
    window.location.href = payment.payment_url;
  };

  const handleLogout = async () => {
    await logout();
    showToast("از حساب خارج شدید");
    window.location.href = "/";
  };

  const handleRetailCheckout = async () => {
    if (!user) {
      showToast("برای ثبت سفارش ابتدا ثبت‌نام کنید و آدرس تحویل را وارد کنید");
      setAuthInitialTab("register");
      setAuthCheckoutTarget("retail");
      setAuthOpen(true);
      return;
    }
    try {
      await startRetailPayment(user);
    } catch (err: any) {
      showToast(err.message || "خطا در ایجاد پرداخت سفارش جزئی");
    }
  };

  const handleWholesaleSubmit = async (formData: any, items: any[]) => {
    if (!user) {
      showToast("برای ثبت درخواست عمده ابتدا ثبت‌نام کنید و آدرس را وارد کنید");
      setAuthInitialTab("register");
      setAuthCheckoutTarget("wholesale");
      localStorage.setItem(PENDING_WHOLESALE_CHECKOUT_KEY, JSON.stringify({ formData, items }));
      setAuthOpen(true);
      return;
    }
    try {
      await startWholesalePayment(formData, items);
    } catch (err: any) {
      showToast(err.message || "خطا در ایجاد پرداخت درخواست عمده");
    }
  };

  const handleUpdateProducts = () => { showToast("کاتالوگ بروز شد"); };
  const handleUpdateOrders = () => { showToast("وضعیت سفارش بروز شد"); };

  if (page === "admin") {
    return <AdminPanel products={products} orders={orders} onUpdateProducts={handleUpdateProducts as any} onUpdateOrders={handleUpdateOrders as any} onBack={goHome} />;
  }

  return (
    <div className="min-h-screen bg-cream-50 font-sans text-stone-800">
      <ScrollToTop />
      {!isDashboardPanel && (
        <Navbar
          siteName={siteName}
          user={user as any}
          currentPage={page}
          cartCount={getRetailCount()}
          onHome={goHome}
          onShop={() => goShop(null)}
          onOrder={goWholesaleRequest}
          onAbout={goAbout}
          onContact={goContact}
          onOpenAuth={() => { setAuthInitialTab("login"); setAuthCheckoutTarget(null); setAuthOpen(true); }}
          onLogout={handleLogout}
          onOpenCart={goRetailCart}
          onSearch={handleSearch}
          onMyOrders={() => { window.location.href = "/my-orders"; }}
        />
      )}

      {/* فضای خالی جبرانیِ نوبار ثابت - فقط وقتی نوبار هست */}
      {!isDashboardPanel && <div className="h-[88px] lg:h-[108px]" />}

      <AppRouter
        products={products}
        productsLoading={productsLoading}
        category={null}
        brand={null}
        searchTerm=""
        lastOrderNumber={lastOrderNumber}
        goShop={goShop}
        goWholesaleRequest={goWholesaleRequest}
        goProductDetails={goProductDetails}
        onAddToCart={addRetailItem}
        handleRetailCheckout={handleRetailCheckout}
        handleWholesaleSubmit={handleWholesaleSubmit}
      />

      <Footer id="contact" siteName={siteName} onOrder={goWholesaleRequest} onShop={() => goShop(null)} onAbout={goAbout} onContact={goContact} />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onLogin={handleLogin} initialTab={authInitialTab as any} checkoutMode={authCheckoutTarget !== null} />

      {toast && (
        <div className="fixed bottom-8 left-1/2 z-[150] -translate-x-1/2 rounded-2xl bg-stone-900 px-6 py-3.5 text-sm font-bold text-white shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}
