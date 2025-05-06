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

// Register models
const models = [
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
  // Add more models as they are created
];

// Initialize models with sequelize
sequelize.addModels(models);

// Define relationships between models
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
  // Export more models as they are created
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
  // Export more models as they are created
}; 