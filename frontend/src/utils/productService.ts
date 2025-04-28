import axios from 'axios';
import { secureApi } from './api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Product interface
export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  weight: number;
  goldKarat: string;
  isFeatured?: boolean;
  stockAlert?: number;
  compareAtPrice?: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// Get all products
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const response = await secureApi.get('/products');
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Get product by ID
export const getProductById = async (id: number | string): Promise<Product> => {
  try {
    const response = await secureApi.get(`/products/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    throw error;
  }
};

// Create new product
export const createProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
  try {
    const response = await secureApi.post('/products', productData);
    return response.data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

// Update product
export const updateProduct = async (id: number | string, productData: Partial<Product>): Promise<Product> => {
  try {
    const response = await secureApi.put(`/products/${id}`, productData);
    return response.data;
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    throw error;
  }
};

// Delete product
export const deleteProduct = async (id: number | string): Promise<void> => {
  try {
    await secureApi.delete(`/products/${id}`);
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    throw error;
  }
};

// Update product stock
export const updateProductStock = async (id: number | string, quantity: number): Promise<Product> => {
  try {
    const response = await secureApi.patch(`/products/${id}/stock`, { quantity });
    return response.data;
  } catch (error) {
    console.error(`Error updating product stock for ${id}:`, error);
    throw error;
  }
};

// Get featured products
export const getFeaturedProducts = async (): Promise<Product[]> => {
  try {
    const response = await secureApi.get('/products/featured');
    return response.data;
  } catch (error) {
    console.error('Error fetching featured products:', error);
    throw error;
  }
};

// Get low stock products
export const getLowStockProducts = async (): Promise<Product[]> => {
  try {
    const response = await secureApi.get('/products/low-stock');
    return response.data;
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    throw error;
  }
};

export default {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  getFeaturedProducts,
  getLowStockProducts
}; 