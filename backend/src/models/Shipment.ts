import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ShipmentAttributes {
  id: number;
  orderId: number;
  carrierName: string; // Aras, MNG, UPS, etc.
  trackingNumber: string;
  trackingUrl?: string;
  status: 'pending' | 'processing' | 'shipped' | 'in_transit' | 'delivered' | 'failed' | 'returned';
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  shippingCost: number;
  shippingAddress: string;
  recipientName: string;
  recipientPhone?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ShipmentCreationAttributes extends Optional<ShipmentAttributes, 'id' | 'trackingUrl' | 'estimatedDeliveryDate' | 'actualDeliveryDate' | 'recipientPhone' | 'notes' | 'createdAt' | 'updatedAt'> {}

class Shipment extends Model<ShipmentAttributes, ShipmentCreationAttributes> implements ShipmentAttributes {
  public id!: number;
  public orderId!: number;
  public carrierName!: string;
  public trackingNumber!: string;
  public trackingUrl?: string;
  public status!: 'pending' | 'processing' | 'shipped' | 'in_transit' | 'delivered' | 'failed' | 'returned';
  public estimatedDeliveryDate?: Date;
  public actualDeliveryDate?: Date;
  public shippingCost!: number;
  public shippingAddress!: string;
  public recipientName!: string;
  public recipientPhone?: string;
  public notes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Shipment.init(
  {
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
    carrierName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    trackingNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    trackingUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'shipped', 'in_transit', 'delivered', 'failed', 'returned'),
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
      type: DataTypes.STRING,
      allowNull: false,
    },
    recipientPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Shipment',
    tableName: 'shipments',
    timestamps: true,
  }
);

export default Shipment; 