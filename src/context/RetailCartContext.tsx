import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { type Product } from '../data';
import { getStoredCart, saveStoredCart, type CartItem } from '../storage';

interface RetailCartContextType {
  retailCart: CartItem[];
  addRetailItem: (product: Product) => void;
  removeRetailItem: (productId: string) => void;
  increaseRetailQuantity: (productId: string) => void;
  decreaseRetailQuantity: (productId: string) => void;
  clearRetailCart: () => void;
  getRetailTotal: () => number;
  getRetailCount: () => number;
}

const RetailCartContext = createContext<RetailCartContextType | undefined>(undefined);

export function RetailCartProvider({ children }: { children: ReactNode }) {
  const [retailCart, setRetailCart] = useState<CartItem[]>([]);

  useEffect(() => {
    setRetailCart(getStoredCart());
  }, []);

  useEffect(() => {
    saveStoredCart(retailCart);
  }, [retailCart]);

  const addRetailItem = (product: Product) => {
    setRetailCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeRetailItem = (productId: string) => {
    setRetailCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const increaseRetailQuantity = (productId: string) => {
    setRetailCart((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, qty: item.qty + 1 } : item))
    );
  };

  const decreaseRetailQuantity = (productId: string) => {
    setRetailCart((prev) =>
      prev
        .map((item) => (item.id === productId ? { ...item, qty: item.qty - 1 } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const clearRetailCart = () => setRetailCart([]);

  return (
    <RetailCartContext.Provider
      value={{
        retailCart,
        addRetailItem,
        removeRetailItem,
        increaseRetailQuantity,
        decreaseRetailQuantity,
        clearRetailCart,
        getRetailTotal: () => retailCart.reduce((total, item) => total + item.price * item.qty, 0),
        getRetailCount: () => retailCart.reduce((count, item) => count + item.qty, 0),
      }}
    >
      {children}
    </RetailCartContext.Provider>
  );
}

export function useRetailCart() {
  const context = useContext(RetailCartContext);
  if (context === undefined) throw new Error('useRetailCart must be used within a RetailCartProvider');
  return context;
}
