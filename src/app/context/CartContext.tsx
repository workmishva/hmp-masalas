import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useAuth } from './AuthContext';
import { fetchCart, updateCartApi } from '../services/cartApi';

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: 'veg' | 'non-veg';
  featured?: boolean;
  taxPercent?: number;
}

interface CartItem extends Product {
  quantity: number;
  weightId: string;
  cartId: string;
  weightPrice: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, weightId: string, weightPrice: number) => void;
  removeFromCart: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const isInitialLoad = useRef(true);

  // Load cart from backend when user changes (login/switch)
  useEffect(() => {
    if (user?.uid) {
      isInitialLoad.current = true;
      fetchCart(user)
        .then((fetchedItems) => {
          // Re-hydrate the items cartId
          const hydrated = fetchedItems.map((item: any) => ({
            ...item,
            cartId: `${item.id}-${item.weightId}`,
          }));
          setItems(hydrated);
        })
        .catch((e) => {
          console.error('Failed to load cart from backend', e);
          setItems([]);
        })
        .finally(() => {
          isInitialLoad.current = false;
        });
    } else {
      setItems([]); // No user = empty cart
    }
    setIsCartOpen(false);
  }, [user?.uid]);

  // Persist cart to backend whenever items change (skip initial load)
  useEffect(() => {
    if (user?.uid && !isInitialLoad.current) {
      updateCartApi(user, items).catch((e) => {
        console.error('Failed to sync cart to backend', e);
      });
    }
  }, [items, user]);

  const addToCart = (product: Product, weightId: string, weightPrice: number) => {
    setItems((prev) => {
      const cartId = `${product.id}-${weightId}`;
      const existing = prev.find((item) => item.cartId === cartId);
      if (existing) {
        return prev.map((item) =>
          item.cartId === cartId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, weightId, cartId, weightPrice }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (cartId: string) => {
    setItems((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const updateQuantity = (cartId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.cartId === cartId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, isCartOpen, setIsCartOpen }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
