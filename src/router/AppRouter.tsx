import { Routes, Route } from "react-router-dom";

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
  productsLoading: boolean;

  category: string | null;
  brand: string | null;
  searchTerm: string;

  lastOrderNumber: string;

  goShop: (
    category?: string | null,
    brand?: string | null
  ) => void;

  goWholesaleRequest: () => void;

  goProductDetails: (product: Product) => void;

  onAddToCart: (product: Product) => void;

  handleRetailCheckout: () => void;

  handleWholesaleSubmit: (
    formData: any,
    items: any[]
  ) => void;
}

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
}: AppRouterProps) {
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
            loading={productsLoading}
            initialCategoryId={category}
            initialBrandName={brand}
            initialSearch={searchTerm}
            onProductClick={goProductDetails}
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
            onCheckout={handleRetailCheckout}
          />
        }
      />

      <Route
        path="/wholesale"
        element={
          <WholesaleRequest
            products={products}
            onBack={() => window.history.back()}
            onSubmit={handleWholesaleSubmit}
          />
        }
      />

      <Route
        path="/about"
        element={<AboutPage />}
      />

      <Route
        path="/success"
        element={
          <OrderSuccess
            orderNumber={lastOrderNumber}
          />
        }
      />
    </Routes>
  );
}