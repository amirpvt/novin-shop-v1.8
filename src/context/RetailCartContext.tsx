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
  const [retailCart, setRetailCart] = useState<CartItem[]>(() => getStoredCart());
  const [cartLoaded, setCartLoaded] = useState(false);

  useEffect(() => {
    setRetailCart(getStoredCart());
    setCartLoaded(true);
  }, []);

  useEffect(() => {
    if (cartLoaded) saveStoredCart(retailCart);
  }, [retailCart, cartLoaded]);

  const getEffectivePrice = (product: Product) => {
    const discount = Number(product.discount_price || 0);
    const price = Number(product.price || 0);
    return discount > 0 && discount < price ? discount : price;
  };

  const addRetailItem = (product: Product) => {
    setRetailCart((prev) => {
      const effectivePrice = getEffectivePrice(product);
      const originalPrice = Number(product.price || 0);
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                price: effectivePrice,
                original_price: originalPrice,
                discount_price: product.discount_price ?? null,
                discount_percent: product.discount_percent,
                qty: item.qty + 1,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          ...product,
          price: effectivePrice,
          original_price: originalPrice,
          discount_price: product.discount_price ?? null,
          discount_percent: product.discount_percent,
          qty: 1,
        },
      ];
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
        getRetailTotal: () => retailCart.reduce((total, item) => {
          const discount = Number(item.discount_price || 0);
          const price = Number(item.price || 0);
          const effective = discount > 0 && discount < price ? discount : price;
          return total + effective * item.qty;
        }, 0),
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
