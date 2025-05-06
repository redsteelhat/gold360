import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import Order from './order.model';

// Define the attributes of the Shipping model
interface ShippingAttributes {
  id: number;
  orderId: number;
  carrier: string; // Shipping carrier (Aras, Yurtiçi, UPS, etc.)
  trackingNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'returned' | 'failed';
  estimatedDeliveryDate: Date | null;
  actualDeliveryDate: Date | null;
  shippingCost: number;
  shippingAddress: string;
  recipientName: string;
  recipientPhone: string;
  notes: string | null;
  packageWeight: number | null; // in kg
  packageDimensions: string | null; // format: "LxWxH" in cm
  createdAt: Date;
  updatedAt: Date;
}

// Define which attributes are optional for creating a new Shipping instance
interface ShippingCreationAttributes extends Optional<ShippingAttributes, 'id' | 'estimatedDeliveryDate' | 'actualDeliveryDate' | 'notes' | 'packageWeight' | 'packageDimensions' | 'createdAt' | 'updatedAt'> {}

// Define the Shipping model class
class Shipping extends Model<ShippingAttributes, ShippingCreationAttributes> implements ShippingAttributes {
  public id!: number;
  public orderId!: number;
  public carrier!: string;
  public trackingNumber!: string;
  public status!: 'pending' | 'processing' | 'shipped' | 'delivered' | 'returned' | 'failed';
  public estimatedDeliveryDate!: Date | null;
  public actualDeliveryDate!: Date | null;
  public shippingCost!: number;
  public shippingAddress!: string;
  public recipientName!: string;
  public recipientPhone!: string;
  public notes!: string | null;
  public packageWeight!: number | null;
  public packageDimensions!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the Shipping model with its attributes and options
Shipping.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id',
    },
  },
  carrier: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  trackingNumber: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'returned', 'failed'),
    allowNull: false,
    defaultValue: 'pending',
  },
  estimatedDeliveryDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  actualDeliveryDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  shippingCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  shippingAddress: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  recipientName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  recipientPhone: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  packageWeight: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  packageDimensions: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  tableName: 'shipping',
  timestamps: true,
});

// Define associations
Shipping.belongsTo(Order, { foreignKey: 'orderId' });
Order.hasOne(Shipping, { foreignKey: 'orderId' });

export default Shipping; 