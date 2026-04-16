import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from './CartContext';

export interface OrderItem {
  id: string; // original product id
  name: string;
  weightId: string;
  weightPrice: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  createdAt: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
}

interface OrderContextType {
  orders: Order[];
  addOrder: (items: any[], totalAmount: number) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  pendingCount: number;
}

const OrderContext = createContext<OrderContextType | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('storeOrders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('storeOrders', JSON.stringify(orders));
  }, [orders]);

  const addOrder = (cartItems: any[], totalAmount: number) => {
    const newOrder: Order = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        weightId: item.weightId,
        weightPrice: item.weightPrice,
        quantity: item.quantity,
        image: item.image
      })),
      totalAmount,
      status: 'pending',
    };
    setOrders(prev => [newOrder, ...prev]);
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status } : order
    ));
  };

  const pendingCount = orders.filter(o => o.status === 'pending').length;

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateOrderStatus, pendingCount }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}
