import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { type Product } from '../data';

const WHOLESALE_CART_STORAGE_KEY = 'novin_wholesale_request_cart';

export interface WholesaleItem {
  id: number;
  name: string;
  unit: string;
  image: string;
  quantity: number;
  notes?: string;
  wholesale_option_id?: number | null;
  wholesale_option_label?: string;
  wholesale_unit_price?: number;
}

interface WholesaleRequestContextType {
  wholesaleItems: WholesaleItem[];
  addWholesaleItem: (product: Product) => void;
  removeWholesaleItem: (productId: number) => void;
  updateWholesaleQuantity: (productId: number, qty: number) => void;
  updateWholesaleNotes: (productId: number, notes: string) => void;
  updateWholesaleOption: (productId: number, optionId: number | null, label?: string, unitPrice?: number) => void;
  clearWholesaleRequest: () => void;
  getWholesaleCount: () => number;
}

const WholesaleRequestContext = createContext<WholesaleRequestContextType | undefined>(undefined);

export function WholesaleRequestProvider({ children }: { children: ReactNode }) {
  const [wholesaleItems, setWholesaleItems] = useState<WholesaleItem[]>(() => {
    try {
      const saved = localStorage.getItem(WHOLESALE_CART_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(WHOLESALE_CART_STORAGE_KEY, JSON.stringify(wholesaleItems));
    } catch {
      // اگر مرورگر اجازه ذخیره نداد، سبد در حافظه صفحه باقی می‌ماند.
    }
  }, [wholesaleItems]);

  const addWholesaleItem = (product: Product) => {
    setWholesaleItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) return prev;
      const options = ((product as any).wholesale_options || []).filter((o: any) => o.is_active !== false && Number(o.unit_price || 0) > 0);
      const firstOption = options[0];
      return [...prev, { 
        id: product.id, 
        name: product.name, 
        unit: product.unit, 
        image: product.image, 
        quantity: (product as any).wholesale_min_quantity || 10,
        wholesale_option_id: firstOption?.id ?? null,
        wholesale_option_label: firstOption?.label || "",
        wholesale_unit_price: firstOption ? Number(firstOption.unit_price || 0) : Number((product as any).wholesale_price || product.price || 0),
      }];
    });
  };

  const removeWholesaleItem = (productId: number) => {
    setWholesaleItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateWholesaleQuantity = (productId: number, qty: number) => {
    setWholesaleItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity: Math.max(1, qty) } : item))
    );
  };

  const updateWholesaleNotes = (productId: number, notes: string) => {
    setWholesaleItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, notes } : item))
    );
  };

  const updateWholesaleOption = (productId: number, optionId: number | null, label = "", unitPrice = 0) => {
    setWholesaleItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, wholesale_option_id: optionId, wholesale_option_label: label, wholesale_unit_price: unitPrice } : item))
    );
  };

  const clearWholesaleRequest = () => {
    setWholesaleItems([]);
    try {
      localStorage.removeItem(WHOLESALE_CART_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <WholesaleRequestContext.Provider
      value={{
        wholesaleItems,
        addWholesaleItem,
        removeWholesaleItem,
        updateWholesaleQuantity,
        updateWholesaleNotes,
        updateWholesaleOption,
        clearWholesaleRequest,
        getWholesaleCount: () => wholesaleItems.length,
      }}
    >
      {children}
    </WholesaleRequestContext.Provider>
  );
}

export function useWholesaleRequest() {
  const context = useContext(WholesaleRequestContext);
  if (context === undefined) throw new Error('useWholesaleRequest must be used within a WholesaleRequestProvider');
  return context;
}
