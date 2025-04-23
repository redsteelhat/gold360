import api from './api';

// Shipment tiplerini tanımlama
export interface ShipmentNotification {
  id: number;
  shipmentId: number;
  notificationType: 'sms' | 'email' | 'push';
  recipient: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  errorMessage?: string;
  sentAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shipment {
  id: number;
  orderId: number;
  carrierName: string;
  trackingNumber: string;
  trackingUrl?: string;
  status: 'pending' | 'processing' | 'shipped' | 'in_transit' | 'delivered' | 'failed' | 'returned';
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  shippingCost: number;
  shippingAddress: string;
  recipientName: string;
  recipientPhone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  Order?: {
    id: number;
    status: string;
    Customer?: {
      id: number;
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
    };
  };
  ShipmentNotifications?: ShipmentNotification[];
}

export interface ShipmentInput {
  orderId: number;
  carrierName: string;
  trackingNumber: string;
  trackingUrl?: string;
  status?: 'pending' | 'processing' | 'shipped' | 'in_transit' | 'delivered' | 'failed' | 'returned';
  estimatedDeliveryDate?: string;
  shippingCost?: number;
  shippingAddress: string;
  recipientName: string;
  recipientPhone?: string;
  notes?: string;
  sendNotification?: boolean;
}

export interface TrackingInfo {
  shipment: Shipment;
  externalTracking: {
    trackingNumber: string;
    carrier: string;
    status: string;
    estimatedDelivery?: string;
    lastUpdated: string;
    trackingEvents: {
      date: string;
      location: string;
      status: string;
      description: string;
    }[];
  } | null;
  error: string | null;
}

export interface ShipmentNotificationInput {
  shipmentId: number;
  notificationType: 'sms' | 'email' | 'push';
  recipient: string;
  message: string;
}

// Tüm shipmentları getir
export const getAllShipments = async (status?: string, orderId?: number): Promise<Shipment[]> => {
  try {
    let url = '/shipments';
    const params = new URLSearchParams();
    
    if (status) params.append('status', status);
    if (orderId) params.append('orderId', orderId.toString());
    
    if (params.toString()) url += `?${params.toString()}`;
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching shipments:', error);
    throw error;
  }
};

// ID'ye göre shipment getir
export const getShipmentById = async (id: number | string): Promise<Shipment> => {
  try {
    const response = await api.get(`/shipments/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching shipment ${id}:`, error);
    throw error;
  }
};

// Yeni shipment oluştur
export const createShipment = async (shipmentData: ShipmentInput): Promise<Shipment> => {
  try {
    const response = await api.post('/shipments', shipmentData);
    return response.data;
  } catch (error) {
    console.error('Error creating shipment:', error);
    throw error;
  }
};

// Shipment güncelle
export const updateShipment = async (id: number | string, shipmentData: Partial<ShipmentInput>): Promise<Shipment> => {
  try {
    const response = await api.put(`/shipments/${id}`, shipmentData);
    return response.data;
  } catch (error) {
    console.error(`Error updating shipment ${id}:`, error);
    throw error;
  }
};

// Takip numarasıyla shipment takip et
export const trackShipment = async (trackingNumber: string): Promise<TrackingInfo> => {
  try {
    const response = await api.get(`/shipments/track/${trackingNumber}`);
    return response.data;
  } catch (error) {
    console.error(`Error tracking shipment ${trackingNumber}:`, error);
    throw error;
  }
};

// Shipment bildirimleri getir
export const getShipmentNotifications = async (shipmentId: number | string): Promise<ShipmentNotification[]> => {
  try {
    const response = await api.get(`/shipments/notifications/${shipmentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching notifications for shipment ${shipmentId}:`, error);
    throw error;
  }
};

// Shipment bildirimi gönder
export const sendShipmentNotification = async (notification: ShipmentNotificationInput): Promise<ShipmentNotification> => {
  try {
    const response = await api.post('/shipments/notifications', notification);
    return response.data;
  } catch (error) {
    console.error('Error sending shipment notification:', error);
    throw error;
  }
};

// Bekleyen bildirimleri işle
export const processNotifications = async (): Promise<{
  message: string;
  results: {
    total: number;
    sent: number;
    failed: number;
  };
}> => {
  try {
    const response = await api.post('/shipments/process-notifications');
    return response.data;
  } catch (error) {
    console.error('Error processing notifications:', error);
    throw error;
  }
};

export default {
  getAllShipments,
  getShipmentById,
  createShipment,
  updateShipment,
  trackShipment,
  getShipmentNotifications,
  sendShipmentNotification,
  processNotifications,
}; 