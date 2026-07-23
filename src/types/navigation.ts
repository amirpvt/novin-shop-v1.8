import type { Product } from "../data";

export type Page =
  | "home"
  | "shop"
  | "retail-cart"
  | "wholesale-request"
  | "admin"
  | "about"
  | "order-success"
  | "product-details";

export interface NavigationState {
  page: Page;
  category: string | null;
  brand: string | null;
  searchTerm: string;
  selectedProduct: Product | null;
  lastOrderNumber: string;
}