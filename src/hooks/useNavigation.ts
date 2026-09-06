import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useCallback, useMemo } from "react";

export type Page =
  | "home"
  | "shop"
  | "retail-cart"
  | "wholesale-request"
  | "admin"
  | "about"
  | "contact"
  | "order-success"
  | "product-details";

export function useNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = useMemo<Page>(() => {
    const path = location.pathname;
    if (path === "/") return "home";
    if (path === "/shop") return "shop";
    if (path === "/cart") return "retail-cart";
    if (path === "/wholesale") return "wholesale-request";
    if (path === "/admin") return "admin";
    if (path === "/about") return "about";
    if (path === "/contact") return "contact";
    if (path === "/success") return "order-success";
    if (path.startsWith("/product/")) return "product-details";
    if (path.startsWith("/my-orders")) return "home";
    if (path.startsWith("/track")) return "home";
    return "home";
  }, [location.pathname]);

  const category = searchParams.get("category");
  const brand = searchParams.get("brand");
  const searchTerm = searchParams.get("search") || "";
  const lastOrderNumber = searchParams.get("order") || "";

  const goHome = useCallback(() => { navigate("/"); }, [navigate]);

  const goShop = useCallback(
    (cat: string | null = null, br: string | null = null) => {
      const params = new URLSearchParams();
      if (cat) params.set("category", cat);
      if (br) params.set("brand", br);
      navigate(`/shop?${params.toString()}`);
    },
    [navigate]
  );

  const goAdmin = useCallback(() => { navigate("/admin"); }, [navigate]);
  const goAbout = useCallback(() => { navigate("/about"); }, [navigate]);
  const goContact = useCallback(() => { navigate("/contact"); }, [navigate]);
  const goRetailCart = useCallback(() => { navigate("/cart"); }, [navigate]);
  const goWholesaleRequest = useCallback(() => { navigate("/wholesale"); }, [navigate]);

  // ✅ FIX: اگر product object دادند، id اش را بگیر - این باگ باعث می‌شد صفحه محصول باز نشود
  const goProductDetails = useCallback(
    (product: any) => {
      const id = typeof product === "object" ? product.id : product;
      navigate(`/product/${id}`);
    },
    [navigate]
  );

  const goOrderSuccess = useCallback(
    (orderNumber: string) => {
      navigate(`/success?order=${encodeURIComponent(orderNumber)}`);
    },
    [navigate]
  );

  const handleSearch = useCallback(
    (query: string) => {
      if (query.trim()) {
        navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
      } else {
        navigate("/shop");
      }
    },
    [navigate]
  );

  const setPage = useCallback(
    (newPage: Page) => {
      switch (newPage) {
        case "home": goHome(); break;
        case "shop": goShop(); break;
        case "retail-cart": goRetailCart(); break;
        case "wholesale-request": goWholesaleRequest(); break;
        case "admin": goAdmin(); break;
        case "about": goAbout(); break;
        case "contact": goContact(); break;
        case "order-success": goOrderSuccess(lastOrderNumber || "ORD-00000000"); break;
        default: goHome();
      }
    },
    [goHome, goShop, goRetailCart, goWholesaleRequest, goAdmin, goAbout, goContact, goOrderSuccess, lastOrderNumber]
  );

  return {
    page,
    category,
    brand,
    searchTerm,
    lastOrderNumber,
    setPage,
    goHome,
    goShop,
    goAdmin,
    goAbout,
    goContact,
    goRetailCart,
    goWholesaleRequest,
    goProductDetails,
    goOrderSuccess,
    handleSearch,
  };
}
