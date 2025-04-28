import { sendEmail, sendSMS, sendWhatsAppMessage, sendPushNotification } from '../../../services/notification.service';

// Mock dependencies
jest.mock('nodemailer');
jest.mock('twilio');
jest.mock('firebase-admin');

describe('Notification Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should return mock response when email config is missing', async () => {
      const result = await sendEmail('test@example.com', 'Test Subject', '<p>Test Content</p>');
      
      expect(result).toEqual({
        success: false,
        error: 'Email integration is not configured properly',
        isMock: true
      });
    });
  });

  describe('sendSMS', () => {
    it('should return mock response when SMS config is missing', async () => {
      const result = await sendSMS('5551234567', 'Test SMS message');
      
      expect(result).toEqual({
        success: false,
        error: 'SMS integration is not configured properly',
        isMock: true
      });
    });
  });

  describe('sendWhatsAppMessage', () => {
    it('should return mock response when WhatsApp config is missing', async () => {
      const result = await sendWhatsAppMessage('5551234567', 'Test WhatsApp message');
      
      expect(result).toEqual({
        success: false,
        error: 'WhatsApp integration is not configured properly',
        isMock: true
      });
    });
  });

  describe('sendPushNotification', () => {
    it('should return mock response when Firebase config is missing', async () => {
      const result = await sendPushNotification('device-token', 'Test Title', 'Test Body');
      
      expect(result).toEqual({
        success: false,
        error: 'Firebase Cloud Messaging is not configured properly',
        isMock: true
      });
    });
  });
}); 