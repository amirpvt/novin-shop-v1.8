// @ts-nocheck
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
    category,
    brand,
    searchTerm,
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

  const { getRetailCount, clearRetailCart, addRetailItem } = useRetailCart();
  const { getWholesaleCount, clearWholesaleRequest } = useWholesaleRequest();

  const { products, loading: productsLoading } = useProducts();
  const { orders, wholesaleRequests, createOrder, addWholesaleOrder } = useOrders();

  const { toast, showToast } = useToast();
  const { user, login, logout } = useAuth();

  const [authOpen, setAuthOpen] = useState(false);

  const handleLogin = (newUser: any) => {
    login(newUser);
    showToast(`خوش آمدید، ${newUser.name || newUser.username}`);
    if (newUser.role === "admin" || newUser.role === "superadmin") {
      goAdmin();
    }
  };

  const handleLogout = () => {
    logout();
    showToast("از حساب خارج شدید");
    if (page === "admin") goHome();
  };

  const handleRetailCheckout = async () => {
    if (!user) {
      showToast("برای ثبت سفارش ابتدا وارد شوید");
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
        phone: user?.phone || "09120000000",
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
      showToast("برای ثبت درخواست عمده ابتدا وارد شوید");
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
  const scrollToContact = () => { document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }); };

  if (page === "admin") {
    return <AdminPanel products={products} orders={orders} onUpdateProducts={handleUpdateProducts as any} onUpdateOrders={handleUpdateOrders as any} onBack={goHome} />;
  }

  return (
    <div className="min-h-screen bg-cream-50 font-sans text-stone-800">
      <ScrollToTop />
      <Navbar
        siteName={siteName}
        user={user as any}
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
        onMyOrders={() => { window.location.href = "/my-orders"; }}
      />

      {/* فاصله اصلی برای تمام صفحات - بدون تغییر */}
      <div className="h-[108px] lg:h-[148px]" />

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

      <Footer id="contact" siteName={siteName} onOrder={goWholesaleRequest} onShop={() => goShop(null)} onAbout={goAbout} onContact={scrollToContact} />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onLogin={handleLogin} />

      {toast && (
        <div className="fixed bottom-8 left-1/2 z-[150] -translate-x-1/2 rounded-2xl bg-stone-900 px-6 py-3.5 text-sm font-bold text-white shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}
