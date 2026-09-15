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
}

interface WholesaleRequestContextType {
  wholesaleItems: WholesaleItem[];
  addWholesaleItem: (product: Product) => void;
  removeWholesaleItem: (productId: number) => void;
  updateWholesaleQuantity: (productId: number, qty: number) => void;
  updateWholesaleNotes: (productId: number, notes: string) => void;
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
      return [...prev, { 
        id: product.id, 
        name: product.name, 
        unit: product.unit, 
        image: product.image, 
        quantity: 10 // Default wholesale min
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
