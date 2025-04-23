import sequelize from '../config/database';
import UserModel from './User';
import ProductModel from './Product';
import CustomerModel from './Customer';
import OrderModel from './Order';
import OrderItemModel from './OrderItem';
import StockTransferModel from './StockTransfer';
import { TransferItem as TransferItemModel } from './TransferItem';
import WarehouseModel from './Warehouse';
import InventoryModel from './Inventory';
import StockTransactionModel from './StockTransaction';
import StockAdjustmentModel from './StockAdjustment';
import AdjustmentItemModel from './AdjustmentItem';
import StockAlertModel from './StockAlert';
import LoyaltyProgramModel from './LoyaltyProgram';
import LoyaltyTransactionModel from './LoyaltyTransaction';
import PromotionModel from './Promotion';
import ShipmentModel from './Shipment';
import ShipmentNotificationModel from './ShipmentNotification';

// Initialize models
const User = UserModel;
const Product = ProductModel;
const Customer = CustomerModel;
const Order = OrderModel(sequelize);
const OrderItem = OrderItemModel(sequelize);
const Warehouse = WarehouseModel(sequelize);
const Inventory = InventoryModel(sequelize);
const StockTransaction = StockTransactionModel(sequelize);
const StockTransfer = StockTransferModel(sequelize);
const TransferItem = TransferItemModel;
const StockAdjustment = StockAdjustmentModel(sequelize);
const AdjustmentItem = AdjustmentItemModel;
const StockAlert = StockAlertModel;
const LoyaltyProgram = LoyaltyProgramModel;
const LoyaltyTransaction = LoyaltyTransactionModel;
const Promotion = PromotionModel;
const Shipment = ShipmentModel;
const ShipmentNotification = ShipmentNotificationModel;

// Setup associations (only for models that support it)
Order.associate({ Customer, OrderItem });
OrderItem.associate({ Order, Product });
Warehouse.associate({ Inventory, StockTransfer });
Inventory.associate({ Product, Warehouse, StockTransaction });
StockTransaction.associate({ Inventory, User });
StockTransfer.associate({ User, TransferItem, Warehouse });
TransferItem.associate({ StockTransfer, Product });
StockAdjustment.associate({ Warehouse, User, AdjustmentItem });
AdjustmentItem.associate({ StockAdjustment, Product });

// StockAlert associations
StockAlert.belongsTo(Product, { foreignKey: 'productId' });
StockAlert.belongsTo(Warehouse, { foreignKey: 'warehouseId' });
Product.hasMany(StockAlert, { foreignKey: 'productId' });
Warehouse.hasMany(StockAlert, { foreignKey: 'warehouseId' });

// Loyalty associations
Customer.hasMany(LoyaltyTransaction, { foreignKey: 'customerId' });
LoyaltyTransaction.belongsTo(Customer, { foreignKey: 'customerId' });

// Promotion associations
Promotion.belongsTo(Product, { foreignKey: 'productId' });
Product.hasMany(Promotion, { foreignKey: 'productId' });

// Shipment associations
Shipment.belongsTo(Order, { foreignKey: 'orderId' });
Order.hasMany(Shipment, { foreignKey: 'orderId' });
ShipmentNotification.belongsTo(Shipment, { foreignKey: 'shipmentId' });
Shipment.hasMany(ShipmentNotification, { foreignKey: 'shipmentId' });

export {
  sequelize,
  User,
  Product,
  Customer,
  Order,
  OrderItem,
  Warehouse,
  Inventory,
  StockTransaction,
  StockTransfer,
  TransferItem,
  StockAdjustment,
  AdjustmentItem,
  StockAlert,
  LoyaltyProgram,
  LoyaltyTransaction,
  Promotion,
  Shipment,
  ShipmentNotification
}; 