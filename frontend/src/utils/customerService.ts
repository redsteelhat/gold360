import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Customer interface
export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  totalSpent: number;
  loyaltyPoints: number;
  lastPurchaseDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Get all customers
export const getAllCustomers = async (): Promise<Customer[]> => {
  try {
    const response = await axios.get(`${API_URL}/customers`);
    return response.data;
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
};

// Get customer by ID
export const getCustomerById = async (id: number | string): Promise<Customer> => {
  try {
    const response = await axios.get(`${API_URL}/customers/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching customer ${id}:`, error);
    throw error;
  }
};

// Create new customer
export const createCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalSpent' | 'loyaltyPoints'>): Promise<Customer> => {
  try {
    const response = await axios.post(`${API_URL}/customers`, customerData);
    return response.data;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
};

// Update customer
export const updateCustomer = async (id: number | string, customerData: Partial<Customer>): Promise<Customer> => {
  try {
    const response = await axios.put(`${API_URL}/customers/${id}`, customerData);
    return response.data;
  } catch (error) {
    console.error(`Error updating customer ${id}:`, error);
    throw error;
  }
};

// Delete customer
export const deleteCustomer = async (id: number | string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/customers/${id}`);
  } catch (error) {
    console.error(`Error deleting customer ${id}:`, error);
    throw error;
  }
};

export default {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
}; 