import { secureApi } from './api';

export interface LoyaltyProgram {
  id: number;
  name: string;
  description?: string;
  pointsPerCurrency: number;
  minimumPointsForRedemption: number;
  pointValueInCurrency: number;
  expiryMonths: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyTransaction {
  id: number;
  customerId: number;
  points: number;
  transactionType: 'earn' | 'redeem' | 'expire' | 'adjust';
  referenceType: 'order' | 'promotion' | 'system' | 'support';
  referenceId?: number;
  description?: string;
  expiryDate?: string;
  isExpired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerLoyalty {
  customer: {
    id: number;
    name: string;
    email: string;
    segment: string;
    loyaltyPoints: number;
    totalSpent: number;
    lastPurchaseDate?: string;
  };
  loyalty: {
    tier: string;
    points: number;
    pointsValue: number;
    transactions: LoyaltyTransaction[];
    program: LoyaltyProgram;
  };
}

export interface LoyaltyTransactionInput {
  customerId: number;
  points: number;
  transactionType: 'earn' | 'redeem' | 'expire' | 'adjust';
  referenceType: 'order' | 'promotion' | 'system' | 'support';
  referenceId?: number;
  description?: string;
}

// Get all loyalty programs
export const getLoyaltyPrograms = async (): Promise<LoyaltyProgram[]> => {
  const response = await secureApi.get('/loyalty/programs');
  return response.data;
};

// Get loyalty program by ID
export const getLoyaltyProgramById = async (id: number): Promise<LoyaltyProgram> => {
  const response = await secureApi.get(`/loyalty/programs/${id}`);
  return response.data;
};

// Create a new loyalty program
export const createLoyaltyProgram = async (program: Omit<LoyaltyProgram, 'id' | 'createdAt' | 'updatedAt'>): Promise<LoyaltyProgram> => {
  const response = await secureApi.post('/loyalty/programs', program);
  return response.data;
};

// Update a loyalty program
export const updateLoyaltyProgram = async (id: number, program: Partial<LoyaltyProgram>): Promise<LoyaltyProgram> => {
  const response = await secureApi.put(`/loyalty/programs/${id}`, program);
  return response.data;
};

// Get customer loyalty information
export const getCustomerLoyalty = async (customerId: number): Promise<CustomerLoyalty> => {
  const response = await secureApi.get(`/loyalty/customer/${customerId}`);
  return response.data;
};

// Get customer loyalty transactions
export const getCustomerTransactions = async (customerId: number): Promise<LoyaltyTransaction[]> => {
  const response = await secureApi.get(`/loyalty/transactions/${customerId}`);
  return response.data;
};

// Create a loyalty transaction
export const createLoyaltyTransaction = async (transaction: LoyaltyTransactionInput): Promise<LoyaltyTransaction> => {
  const response = await secureApi.post('/loyalty/transactions', transaction);
  return response.data;
};

// Process expired points
export const processExpiredPoints = async (): Promise<{ processed: number }> => {
  const response = await secureApi.post('/loyalty/process-expired');
  return response.data;
}; 