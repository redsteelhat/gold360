import { secureApi } from './api';

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  description?: string;
}

export interface Warehouse {
  id: number;
  name: string;
  location: string;
  address?: string;
}

export interface InventoryItem {
  id: number;
  productId: number;
  product?: Product;
  warehouseId: number;
  warehouse?: Warehouse;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  alertThreshold: number;
  shelfLocation: string;
  barcode?: string;
  rfidTag?: string;
  lastStockCheck?: string;
  isActive: boolean;
}

export interface StockTransaction {
  id: number;
  inventoryId: number;
  quantity: number;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN';
  referenceType?: 'ORDER' | 'PURCHASE' | 'TRANSFER' | 'MANUAL';
  referenceId?: number;
  transactionDate: string;
  performedById: number;
  notes?: string;
}

export interface InventoryAdjustment {
  quantity: number;
  adjustmentType: 'add' | 'subtract' | 'set';
  reason?: string;
  userId: number;
}

export interface StockCheckItem {
  inventoryId: number;
  quantity: number;
  notes?: string;
}

export interface StockCheckRequest {
  items: StockCheckItem[];
  userId: number;
}

// Get all inventory items with optional filters
export const getAllInventory = async (filters?: {
  warehouseId?: number;
  productId?: number;
  lowStock?: boolean;
}): Promise<InventoryItem[]> => {
  const queryParams = new URLSearchParams();
  
  if (filters?.warehouseId) {
    queryParams.append('warehouseId', filters.warehouseId.toString());
  }
  
  if (filters?.productId) {
    queryParams.append('productId', filters.productId.toString());
  }
  
  if (filters?.lowStock) {
    queryParams.append('lowStock', 'true');
  }
  
  const queryString = queryParams.toString();
  const url = queryString ? `/inventory?${queryString}` : '/inventory';
  
  const response = await secureApi.get(url);
  return response.data;
};

// Get inventory item by ID
export const getInventoryById = async (id: number): Promise<InventoryItem> => {
  const response = await secureApi.get(`/inventory/${id}`);
  return response.data;
};

// Create a new inventory item
export const createInventoryItem = async (item: Partial<InventoryItem> & { userId: number }): Promise<InventoryItem> => {
  const response = await secureApi.post('/inventory', item);
  return response.data;
};

// Update an inventory item
export const updateInventoryItem = async (id: number, updates: Partial<InventoryItem>): Promise<InventoryItem> => {
  const response = await secureApi.put(`/inventory/${id}`, updates);
  return response.data;
};

// Delete an inventory item
export const deleteInventoryItem = async (id: number): Promise<void> => {
  await secureApi.delete(`/inventory/${id}`);
};

// Adjust inventory quantity
export const adjustInventory = async (id: number, adjustment: InventoryAdjustment): Promise<InventoryItem> => {
  const response = await secureApi.post(`/inventory/${id}/adjust`, adjustment);
  return response.data;
};

// Get inventory item by barcode
export const getInventoryByBarcode = async (barcode: string): Promise<InventoryItem> => {
  const response = await secureApi.get(`/inventory/barcode/${barcode}`);
  return response.data;
};

// Get inventory item by RFID tag
export const getInventoryByRfid = async (rfidTag: string): Promise<InventoryItem> => {
  const response = await secureApi.get(`/inventory/rfid/${rfidTag}`);
  return response.data;
};

// Log a stock check for multiple inventory items
export const logStockCheck = async (stockCheck: StockCheckRequest): Promise<any> => {
  const response = await secureApi.post('/inventory/log-stock-check', stockCheck);
  return response.data;
};

export default {
  getAllInventory,
  getInventoryById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  adjustInventory,
  getInventoryByBarcode,
  getInventoryByRfid,
  logStockCheck
}; 