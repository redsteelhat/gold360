import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import Product from './Product';
import Warehouse from './Warehouse';

export interface StockAlertAttributes {
  id: number;
  productId: number;
  warehouseId: number;
  threshold: number;
  currentLevel: number;
  status: 'active' | 'resolved' | 'ignored';
  notificationSent: boolean;
  notificationDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StockAlertCreationAttributes extends Optional<StockAlertAttributes, 'id' | 'notificationSent' | 'notificationDate' | 'createdAt' | 'updatedAt'> {}

class StockAlert extends Model<StockAlertAttributes, StockAlertCreationAttributes> implements StockAlertAttributes {
  public id!: number;
  public productId!: number;
  public warehouseId!: number;
  public threshold!: number;
  public currentLevel!: number;
  public status!: 'active' | 'resolved' | 'ignored';
  public notificationSent!: boolean;
  public notificationDate?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

StockAlert.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
    },
    warehouseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'warehouses',
        key: 'id',
      },
    },
    threshold: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
    },
    currentLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'resolved', 'ignored'),
      allowNull: false,
      defaultValue: 'active',
    },
    notificationSent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    notificationDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'StockAlert',
    tableName: 'stock_alerts',
    timestamps: true,
  }
);

// Associations will be defined in the index.ts file

export default StockAlert; 