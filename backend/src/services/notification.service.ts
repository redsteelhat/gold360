import axios from 'axios';
import nodemailer from 'nodemailer';
import { Twilio } from 'twilio';
import admin from 'firebase-admin';

// Ortam değişkenlerinden API anahtarlarını al
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || '';

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@gold360.com';

// Twilio istemcisi oluştur
const twilioClient = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Nodemailer transporter oluştur
const emailTransporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

// Firebase yapılandırma kontrolü
let firebaseInitialized = false;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    firebaseInitialized = true;
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

/**
 * WhatsApp ile mesaj gönderme
 */
export const sendWhatsAppMessage = async (to: string, message: string): Promise<any> => {
  try {
    // Telefon numarasını formatla (sadece rakamlar)
    const formattedNumber = to.replace(/\D/g, '');
    
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
      throw new Error('WhatsApp integration is not configured');
    }
    
    const result = await twilioClient.messages.create({
      body: message,
      from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:+${formattedNumber}`
    });
    
    return {
      success: true,
      messageId: result.sid,
      status: result.status
    };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
};

/**
 * SMS ile mesaj gönderme
 */
export const sendSMS = async (to: string, message: string): Promise<any> => {
  try {
    // Telefon numarasını formatla (sadece rakamlar)
    const formattedNumber = to.replace(/\D/g, '');
    
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      throw new Error('SMS integration is not configured');
    }
    
    const result = await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: `+${formattedNumber}`
    });
    
    return {
      success: true,
      messageId: result.sid,
      status: result.status
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
};

/**
 * E-posta gönderme
 */
export const sendEmail = async (to: string, subject: string, html: string, text?: string): Promise<any> => {
  try {
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      throw new Error('Email integration is not configured');
    }
    
    const result = await emailTransporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''), // HTML içeriğinden metin çıkar
      html
    });
    
    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Push bildirim gönderme (Firebase Cloud Messaging)
 */
export const sendPushNotification = async (token: string, title: string, body: string, data?: any): Promise<any> => {
  try {
    if (!firebaseInitialized) {
      throw new Error('Firebase Cloud Messaging is not configured');
    }
    
    const message = {
      token,
      notification: {
        title,
        body
      },
      data: data || {}
    };
    
    const result = await admin.messaging().send(message);
    
    return {
      success: true,
      messageId: result
    };
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
};

/**
 * Toplu bildirim gönderme (Birden çok alıcıya)
 */
export const sendBulkNotifications = async (
  recipients: Array<{type: 'email' | 'sms' | 'whatsapp' | 'push', target: string}>,
  content: {
    subject?: string,
    message: string,
    html?: string
  }
): Promise<any[]> => {
  const results = [];
  
  for (const recipient of recipients) {
    try {
      let result;
      
      switch (recipient.type) {
        case 'email':
          result = await sendEmail(
            recipient.target,
            content.subject || 'Gold360 Notification',
            content.html || `<p>${content.message}</p>`,
            content.message
          );
          break;
          
        case 'sms':
          result = await sendSMS(recipient.target, content.message);
          break;
          
        case 'whatsapp':
          result = await sendWhatsAppMessage(recipient.target, content.message);
          break;
          
        case 'push':
          result = await sendPushNotification(
            recipient.target,
            content.subject || 'Gold360 Notification',
            content.message
          );
          break;
          
        default:
          throw new Error(`Unknown notification type: ${recipient.type}`);
      }
      
      results.push({
        recipient,
        result,
        success: true
      });
    } catch (error: any) {
      results.push({
        recipient,
        error: error.message,
        success: false
      });
    }
  }
  
  return results;
};

export default {
  sendWhatsAppMessage,
  sendSMS,
  sendEmail,
  sendPushNotification,
  sendBulkNotifications
}; 