import api, { secureApi } from './api';

// Customer interface
export interface Customer {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  notes?: string;
  segment: string;
  status: 'active' | 'inactive';
  loyaltyPoints: number;
  totalSpent: number;
  lastPurchaseDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Get all customers
export const getAllCustomers = async (search?: string, segment?: string): Promise<Customer[]> => {
  try {
    let url = '/customers';
    const params = new URLSearchParams();
    
    if (search) params.append('search', search);
    if (segment) params.append('segment', segment);
    
    if (params.toString()) url += `?${params.toString()}`;
    
    const response = await secureApi.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
};

// Kullanılabilir benzersiz bir userId bulmak için yardımcı fonksiyon
const findAvailableUserId = async (): Promise<number> => {
  try {
    // Tüm müşterileri al ve kullanılan userId'leri topla
    const customers = await getAllCustomers();
    const usedIds = new Set(customers.map(customer => customer.userId));
    
    // 1000-9999 aralığında rastgele ID'ler üret ve kullanılmayanı bul
    let candidateId = Math.floor(Math.random() * 9000) + 1000;
    let maxAttempts = 50; // Sonsuz döngü ihtimaline karşı maksimum deneme sayısı
    
    while (usedIds.has(candidateId) && maxAttempts > 0) {
      candidateId = Math.floor(Math.random() * 9000) + 1000;
      maxAttempts--;
    }
    
    // Eğer tüm deneme sayılarını tükettiysen, daha geniş bir aralıktan seç
    if (maxAttempts === 0) {
      candidateId = Math.floor(Math.random() * 90000) + 10000;
      
      // Güvenlik için, bu ID de kullanımdaysa, timestamp tabanlı bir ID oluştur
      if (usedIds.has(candidateId)) {
        candidateId = Math.floor(Date.now() / 1000);
      }
    }
    
    return candidateId;
  } catch (error) {
    console.error('Error finding available userId:', error);
    // Herhangi bir hata durumunda, timestamp bazlı bir ID döndür
    return Math.floor(Date.now() / 1000);
  }
};

// Get customer by ID
export const getCustomerById = async (id: number | string): Promise<Customer> => {
  try {
    const response = await secureApi.get(`/customers/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching customer ${id}:`, error);
    throw error;
  }
};

// Get customer orders
export const getCustomerOrders = async (id: number | string): Promise<any[]> => {
  try {
    const response = await secureApi.get(`/customers/${id}/orders`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching orders for customer ${id}:`, error);
    throw error;
  }
};

// Create new customer
export const createCustomer = async (customerData: Omit<Customer, 'id' | 'segment' | 'loyaltyPoints' | 'totalSpent' | 'lastPurchaseDate' | 'isActive' | 'createdAt' | 'updatedAt'> | Omit<Customer, 'id' | 'userId' | 'segment' | 'loyaltyPoints' | 'totalSpent' | 'lastPurchaseDate' | 'isActive' | 'createdAt' | 'updatedAt'>): Promise<Customer> => {
  try {
    let finalData = { ...customerData };
    
    // Eğer kullanıcı ID alanı yoksa, mevcut ID'leri kontrol ederek benzersiz bir ID bul
    if (!('userId' in finalData)) {
      const availableUserId = await findAvailableUserId();
      finalData = { ...finalData, userId: availableUserId };
    }
    
    const response = await secureApi.post('/customers', finalData);
    return response.data;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
};

// Update customer
export const updateCustomer = async (id: number | string, customerData: Partial<Customer>): Promise<Customer> => {
  try {
    const response = await secureApi.put(`/customers/${id}`, customerData);
    return response.data;
  } catch (error) {
    console.error(`Error updating customer ${id}:`, error);
    throw error;
  }
};

// Delete customer
export const deleteCustomer = async (id: number | string): Promise<{ message: string }> => {
  try {
    const response = await secureApi.delete(`/customers/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting customer ${id}:`, error);
    throw error;
  }
};

// Send message to customer
export const sendCustomerMessage = async (id: number | string, messageData: {
  channels?: ('email' | 'sms' | 'whatsapp' | 'push')[];
  channel?: 'email' | 'sms' | 'whatsapp' | 'push';
  subject?: string;
  message: string;
  html?: string;
}): Promise<{ success: boolean; result: any }> => {
  try {
    const response = await secureApi.post(`/customers/${id}/send-message`, messageData);
    return response.data;
  } catch (error) {
    console.error(`Error sending message to customer ${id}:`, error);
    throw error;
  }
};

// Send bulk message to customers
export const sendBulkCustomerMessage = async (messageData: {
  customerIds?: number[];
  segment?: 'all' | 'vip' | 'regular' | 'new';
  channel: 'email' | 'sms' | 'whatsapp';
  subject?: string;
  message: string;
  html?: string;
}): Promise<{ success: boolean; totalCustomers: number; sentCount: number; failedCount: number; results: any[] }> => {
  try {
    const response = await secureApi.post('/customers/bulk-message', messageData);
    return response.data;
  } catch (error) {
    console.error('Error sending bulk message:', error);
    throw error;
  }
};

export default {
  getAllCustomers,
  getCustomerById,
  getCustomerOrders,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  sendCustomerMessage,
  sendBulkCustomerMessage
}; 