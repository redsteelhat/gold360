import axios from 'axios';
import { secureApi } from './api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Order tiplerini tanımlama
export interface OrderItem {
  id?: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  product?: {
    id: number;
    name: string;
    sku: string;
    price: number;
  };
}

export interface Order {
  id: number;
  customerId: number;
  orderDate: string;
  deliveryDate?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  orderItems?: OrderItem[];
  shippingAddress?: string;
  billingAddress?: string;
  shippingMethod?: string;
  customer?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export interface OrderInput {
  customerId: number;
  items: {
    productId: number;
    quantity: number;
  }[];
  paymentMethod: 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash' | 'paypal';
  shippingMethod: string;
  shippingAddress: string;
  billingAddress: string;
  notes?: string;
}

export interface OrderCreateData {
  customerId: number;
  orderDate: Date;
  deliveryDate?: Date;
  status: string;
  totalAmount: number;
  paymentStatus: string;
  notes?: string;
  orderItems: OrderItem[];
}

// Tüm siparişleri getir
export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const response = await secureApi.get('/orders');
    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

// ID'ye göre sipariş getir
export const getOrderById = async (id: number | string): Promise<Order> => {
  try {
    const response = await secureApi.get(`/orders/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching order ${id}:`, error);
    throw error;
  }
};

// Yeni sipariş oluştur
export const createOrder = async (orderData: OrderInput): Promise<Order> => {
  try {
    const response = await secureApi.post('/orders', orderData);
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Sipariş güncelle
export const updateOrder = async (id: number | string, orderData: Partial<OrderCreateData>): Promise<Order> => {
  try {
    const response = await secureApi.put(`/orders/${id}`, orderData);
    return response.data;
  } catch (error) {
    console.error(`Error updating order ${id}:`, error);
    throw error;
  }
};

// Sipariş durumunu güncelle
export const updateOrderStatus = async (id: number | string, status: string): Promise<Order> => {
  try {
    const response = await secureApi.patch(`/orders/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error(`Error updating order ${id} status:`, error);
    throw error;
  }
};

// Teslimat tarihini güncelle
export const updateDeliveryDate = async (id: number | string, deliveryDate: string): Promise<Order> => {
  try {
    const response = await secureApi.patch(`/orders/${id}/delivery`, { deliveryDate });
    return response.data;
  } catch (error) {
    console.error(`Error updating delivery date for order ${id}:`, error);
    throw error;
  }
};

// Sipariş iptal et
export const cancelOrder = async (id: number | string): Promise<Order> => {
  try {
    const response = await secureApi.post(`/orders/${id}/cancel`);
    return response.data;
  } catch (error) {
    console.error(`Error cancelling order ${id}:`, error);
    throw error;
  }
};

// Sipariş ödeme durumunu güncelle
export const updateOrderPaymentStatus = async (id: number | string, paymentStatus: string): Promise<Order> => {
  try {
    const response = await secureApi.patch(`/orders/${id}/payment-status`, { paymentStatus });
    return response.data;
  } catch (error) {
    console.error(`Error updating order ${id} payment status:`, error);
    throw error;
  }
};

// Sipariş sil
export const deleteOrder = async (id: number | string): Promise<void> => {
  try {
    await secureApi.delete(`/orders/${id}`);
  } catch (error) {
    console.error(`Error deleting order ${id}:`, error);
    throw error;
  }
};

export default {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  updateDeliveryDate,
  cancelOrder,
  updateOrderPaymentStatus,
  deleteOrder,
}; 