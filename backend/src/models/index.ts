import sequelize from '../config/database';
import { User } from './user.model';
import { Product } from './product.model';
import { Warehouse } from './warehouse.model';
import { StockTransaction } from './stockTransaction.model';
import { StockAlert } from './stockAlert.model';
import { StockTransfer } from './stockTransfer.model';
import { TransferItem } from './transferItem.model';
import { Order } from './order.model';
import { OrderItem } from './orderItem.model';
import { Customer } from './customer.model';
import { DataPrivacy } from './dataPrivacy.model';
import { DataAccessLog } from './dataAccessLog.model';
import { DataRequest } from './dataRequest.model';
import { DataBreachLog } from './dataBreachLog.model';
import { MarketingCampaign } from './marketingCampaign.model';
import { MarketingCampaignRecipient } from './marketingCampaignRecipient.model';
import { MarketingTemplate } from './marketingTemplate.model';
import { SocialMediaAccount } from './socialMediaAccount.model';
import { SocialMediaPost } from './socialMediaPost.model';
import { Task, associateTask } from './task.model';
import { Shift, associateShift } from './shift.model';
import { Note, associateNote } from './note.model';

// Associate models
export const associateModels = () => {
  // Call association methods from model files
  associateTask();
  associateShift();
  associateNote();
  // Add other association calls as needed
};

// Export models
export {
  sequelize,
  User,
  Product,
  Warehouse,
  StockTransaction,
  StockAlert,
  StockTransfer,
  TransferItem,
  Order,
  OrderItem,
  Customer,
  DataPrivacy,
  DataAccessLog,
  DataRequest,
  DataBreachLog,
  MarketingCampaign,
  MarketingCampaignRecipient,
  MarketingTemplate,
  SocialMediaAccount,
  SocialMediaPost,
  Task,
  Shift,
  Note,
};

export default {
  sequelize,
  User,
  Product,
  Warehouse,
  StockTransaction,
  StockAlert,
  StockTransfer,
  TransferItem,
  Order,
  OrderItem,
  Customer,
  DataPrivacy,
  DataAccessLog,
  DataRequest,
  DataBreachLog,
  MarketingCampaign,
  MarketingCampaignRecipient,
  MarketingTemplate,
  SocialMediaAccount,
  SocialMediaPost,
  Task,
  Shift,
  Note,
}; 