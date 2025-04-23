import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Product interface
export interface Product {
  id: number;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  category?: string;
  imageUrl?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// Get all products
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const response = await axios.get(`${API_URL}/products`);
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Get product by ID
export const getProductById = async (id: number | string): Promise<Product> => {
  try {
    const response = await axios.get(`${API_URL}/products/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    throw error;
  }
};

// Create new product
export const createProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
  try {
    const response = await axios.post(`${API_URL}/products`, productData);
    return response.data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

// Update product
export const updateProduct = async (id: number | string, productData: Partial<Product>): Promise<Product> => {
  try {
    const response = await axios.put(`${API_URL}/products/${id}`, productData);
    return response.data;
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    throw error;
  }
};

// Delete product
export const deleteProduct = async (id: number | string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/products/${id}`);
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    throw error;
  }
};

// Update product stock
export const updateProductStock = async (id: number | string, quantity: number): Promise<Product> => {
  try {
    const response = await axios.patch(`${API_URL}/products/${id}/stock`, { quantity });
    return response.data;
  } catch (error) {
    console.error(`Error updating product stock for ${id}:`, error);
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
}; 