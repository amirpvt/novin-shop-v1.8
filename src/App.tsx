import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import AppRouter from "./router/AppRouter";
import Navbar from "./components/Navbar";
import AuthModal from "./components/AuthModal";
import Footer from "./components/Footer";
import AdminPanel from "./pages/AdminPanel";
import { siteName } from "./data";
import { useRetailCart } from "./context/RetailCartContext";
import { useWholesaleRequest } from "./context/WholesaleRequestContext";
import { useToast } from "./hooks/useToast";
import { useAuth } from "./hooks/useAuth";
import { useProducts } from "./hooks/useProducts";
import { useNavigation } from "./hooks/useNavigation";
import { useOrders } from "./hooks/useOrders";

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
    goOrderSuccess,
    handleSearch,
  } = useNavigation();

  const location = useLocation();

  // پنل‌های داخلی داشبورد: هدر اصلی سایت (Navbar) نمایش داده نمی‌شود
  const isDashboardPanel = location.pathname.startsWith("/dashboard/manager") || location.pathname.startsWith("/dashboard/visitor");

  const { getRetailCount, clearRetailCart, addRetailItem } = useRetailCart();
  const { clearWholesaleRequest } = useWholesaleRequest();

  const { products, loading: productsLoading } = useProducts();
  const { orders, createOrder, addWholesaleOrder } = useOrders();

  const { toast, showToast } = useToast();
  const { user, login, logout } = useAuth();

  const [authOpen, setAuthOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState("login");
  const [authCheckoutMode, setAuthCheckoutMode] = useState(false);

  // ✅ لاگین خودکار بر اساس نقش - فقط همین بخش تغییر کرده
  const handleLogin = (newUser: any) => {
    login(newUser);
    showToast(`خوش آمدید، ${newUser.name || newUser.username}`);

    // بستن مودال ورود
    setAuthOpen(false);

    // ریدایرکت خودکار بر اساس نقش
    setTimeout(() => {
      if (newUser.role === "manager" || newUser.role === "superadmin") {
        // مدیرکل -> /dashboard/manager
        window.location.href = "/dashboard/manager";
      } else if (newUser.role === "admin") {
        // ادمین فروشگاه -> /admin
        window.location.href = "/admin";
      } else if (newUser.role === "visitor") {
        // ویزیتور -> /dashboard/visitor/today (یا /visitor)
        window.location.href = "/dashboard/visitor/today";
      } else {
        // مشتری: اگر ثبت‌نام برای خرید بوده، بعد از ثبت‌نام به سبد خرید برگردد
        window.location.href = authCheckoutMode ? "/cart" : "/";
      }
    }, 300);
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
      setAuthCheckoutMode(true);
      setAuthOpen(true);
      return;
    }
    try {
      const cartItems = JSON.parse(localStorage.getItem("novin_shopping_cart") || "[]");
      if (cartItems.length === 0) {
        showToast("سبد خرید خالی است");
        return;
      }
      const order = await createOrder({
        name: user?.name || user?.username || "مهمان",
        phone: user?.phone || user?.customer?.phone || "09120000000",
        address: user?.customer?.address || "",
        items: cartItems.map((item: any) => ({ 

          product_id: Number(item.id),
          quantity: item.qty,
        })),
      });
      goOrderSuccess(order.order_number);
      clearRetailCart();
      showToast("سفارش شما با موفقیت ثبت شد");
    } catch (err: any) {
      showToast(err.message || "خطا در ثبت سفارش");
    }
  };

  const handleWholesaleSubmit = async (formData: any, items: any[]) => {
    if (!user) {
      showToast("برای ثبت درخواست عمده ابتدا ثبت‌نام کنید و آدرس را وارد کنید");
      setAuthInitialTab("register");
      setAuthCheckoutMode(true);
      setAuthOpen(true);
      return;
    }
    try {
      await addWholesaleOrder(formData, items);
      clearWholesaleRequest();
      goHome();
      showToast("درخواست عمده شما ثبت شد");
    } catch (err: any) {
      showToast(err.message || "خطا در ثبت درخواست");
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
          onOpenAuth={() => { setAuthInitialTab("login"); setAuthCheckoutMode(false); setAuthOpen(true); }}
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

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onLogin={handleLogin} initialTab={authInitialTab as any} checkoutMode={authCheckoutMode} />

      {toast && (
        <div className="fixed bottom-8 left-1/2 z-[150] -translate-x-1/2 rounded-2xl bg-stone-900 px-6 py-3.5 text-sm font-bold text-white shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}
