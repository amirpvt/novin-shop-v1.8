// @ts-nocheck
import { Routes, Route } from "react-router-dom";
import Banner from "../components/Banner";
import Brands from "../components/Brands";
import Categories from "../components/Categories";
import Shop from "../pages/Shop";
import AboutPage from "../pages/AboutPage";
import ContactPage from "../pages/ContactPage";
import RetailCart from "../pages/RetailCart";
import WholesaleRequest from "../pages/WholesaleRequest";
import ProductDetails from "../pages/ProductDetails";
import OrderSuccess from "../pages/OrderSuccess";
import PaymentVerify from "../pages/PaymentVerify";
import OrderTracking from "../pages/OrderTracking";
import MyOrders from "../pages/MyOrders";
import NotFound from "../pages/NotFound";
import DashboardRoutes from "./dashboard_routes";

export default function AppRouter({
  products,
  productsLoading,
  category,
  brand,
  searchTerm,
  lastOrderNumber,
  goShop,
  goWholesaleRequest,
  goProductDetails,
  onAddToCart,
  handleRetailCheckout,
  handleWholesaleSubmit,
}: any) {
  return (
    <Routes>
      <Route path="/" element={<><Banner onProducts={() => goShop()} onOrder={goWholesaleRequest} /><Brands onSelect={(b: any) => goShop(null, b)} /><Categories onSelect={(c: any) => goShop(c)} /></>} />
      <Route path="/shop" element={<Shop products={products} loading={productsLoading} initialCategoryId={category} initialBrandName={brand} initialSearch={searchTerm} onProductClick={goProductDetails} />} />
      <Route path="/product/:id" element={<ProductDetails products={products} />} />
      <Route path="/cart" element={<RetailCart onCheckout={handleRetailCheckout} onBack={() => window.history.back()} />} />
      <Route path="/wholesale" element={<WholesaleRequest products={products} onBack={() => window.history.back()} onSubmit={handleWholesaleSubmit} />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/success" element={<OrderSuccess orderNumber={lastOrderNumber} onBack={() => window.history.back()} />} />
      <Route path="/order-success/:orderNumber" element={<OrderSuccess orderNumber={lastOrderNumber} onBack={() => window.history.back()} />} />
      {/* Payment */}
      <Route path="/payment/verify" element={<PaymentVerify />} />
      <Route path="/payment-mock" element={<PaymentVerify />} />
      {/* Tracking */}
      <Route path="/track" element={<OrderTracking />} />
      <Route path="/order-tracking" element={<OrderTracking />} />
      <Route path="/orders/track" element={<OrderTracking />} />
      {/* 🆕 My Orders - داشبورد سفارشات من */}
      <Route path="/my-orders" element={<MyOrders />} />
      <Route path="/orders" element={<MyOrders />} />
      {/* 🆕 صفحه Not found*/}
      <Route path="*" element={<NotFound />} />
      <Route path="/dashboard/*" element={<DashboardRoutes />} />
    </Routes>
  );
}
