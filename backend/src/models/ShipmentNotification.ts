import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ShipmentNotificationAttributes {
  id: number;
  shipmentId: number;
  notificationType: 'sms' | 'email' | 'push';
  recipient: string; // Phone number or email address
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  errorMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ShipmentNotificationCreationAttributes extends Optional<ShipmentNotificationAttributes, 'id' | 'errorMessage' | 'sentAt' | 'deliveredAt' | 'createdAt' | 'updatedAt'> {}

class ShipmentNotification extends Model<ShipmentNotificationAttributes, ShipmentNotificationCreationAttributes> implements ShipmentNotificationAttributes {
  public id!: number;
  public shipmentId!: number;
  public notificationType!: 'sms' | 'email' | 'push';
  public recipient!: string;
  public message!: string;
  public status!: 'pending' | 'sent' | 'delivered' | 'failed';
  public errorMessage?: string;
  public sentAt?: Date;
  public deliveredAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ShipmentNotification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    shipmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'shipments',
        key: 'id',
      },
    },
    notificationType: {
      type: DataTypes.ENUM('sms', 'email', 'push'),
      allowNull: false,
    },
    recipient: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'delivered', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'ShipmentNotification',
    tableName: 'shipment_notifications',
    timestamps: true,
  }
);

export default ShipmentNotification; 