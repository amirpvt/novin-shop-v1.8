import { Routes, Route, useNavigate } from "react-router-dom";

import Banner from "../components/Banner";
import Brands from "../components/Brands";
import Categories from "../components/Categories";

import Shop from "../pages/Shop";
import AboutPage from "../pages/AboutPage";
import RetailCart from "../pages/RetailCart";
import WholesaleRequest from "../pages/WholesaleRequest";
import ProductDetails from "../pages/ProductDetails";
import OrderSuccess from "../pages/OrderSuccess";

import type { Product } from "../data";

interface AppRouterProps {
  products: Product[];

  lastOrderNumber: string;

  goShop: (category?: string | null, brand?: string | null) => void;
  goWholesaleRequest: () => void;
  goProductDetails: (product: Product) => void;

  onWholesale: (product: Product) => void;

  handleRetailCheckout: () => void;
  handleWholesaleSubmit: (formData: any, items: any[]) => void;
}

export default function AppRouter({
  products,

  lastOrderNumber,

  goShop,
  goWholesaleRequest,
  goProductDetails,

  onWholesale,

  handleRetailCheckout,
  handleWholesaleSubmit,
}: AppRouterProps) {
  const navigate = useNavigate();
  const goBack = () => navigate(-1);
  const goHome = () => navigate("/");

  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <Banner
              onProducts={() => goShop()}
              onOrder={goWholesaleRequest}
            />

            <Brands
              onSelect={(brand) => goShop(null, brand)}
            />

            <Categories
              onSelect={(category) => goShop(category)}
            />
          </>
        }
      />

      <Route
        path="/shop"
        element={
          <Shop
            products={products}
            onProductClick={goProductDetails}
            onWholesale={onWholesale}
          />
        }
      />

      <Route
        path="/product/:id"
        element={
          <ProductDetails
            products={products}
          />
        }
      />

      <Route
        path="/cart"
        element={
          <RetailCart
            onBack={() => goShop()}
            onCheckout={handleRetailCheckout}
          />
        }
      />

      <Route
        path="/wholesale"
        element={
          <WholesaleRequest
            products={products}
            onBack={goBack}
            onSubmit={handleWholesaleSubmit}
          />
        }
      />

      <Route
        path="/about"
        element={
          <AboutPage
            onBack={goHome}
            onShop={() => goShop()}
            onOrder={goWholesaleRequest}
          />
        }
      />

      <Route
        path="/success"
        element={
          <OrderSuccess
            orderNumber={lastOrderNumber}
            onBack={goHome}
          />
        }
      />
    </Routes>
  );
}
