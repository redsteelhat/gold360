import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface LoyaltyTransactionAttributes {
  id: number;
  customerId: number;
  points: number; // Can be positive (earned) or negative (redeemed)
  transactionType: 'earn' | 'redeem' | 'expire' | 'adjust';
  referenceType: 'order' | 'promotion' | 'system' | 'support';
  referenceId?: number; // ID of order, promotion, etc.
  description?: string;
  expiryDate?: Date;
  isExpired: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoyaltyTransactionCreationAttributes extends Optional<LoyaltyTransactionAttributes, 'id' | 'referenceId' | 'description' | 'expiryDate' | 'isExpired' | 'createdAt' | 'updatedAt'> {}

class LoyaltyTransaction extends Model<LoyaltyTransactionAttributes, LoyaltyTransactionCreationAttributes> implements LoyaltyTransactionAttributes {
  public id!: number;
  public customerId!: number;
  public points!: number;
  public transactionType!: 'earn' | 'redeem' | 'expire' | 'adjust';
  public referenceType!: 'order' | 'promotion' | 'system' | 'support';
  public referenceId?: number;
  public description?: string;
  public expiryDate?: Date;
  public isExpired!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

LoyaltyTransaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id',
      },
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    transactionType: {
      type: DataTypes.ENUM('earn', 'redeem', 'expire', 'adjust'),
      allowNull: false,
    },
    referenceType: {
      type: DataTypes.ENUM('order', 'promotion', 'system', 'support'),
      allowNull: false,
    },
    referenceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isExpired: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'LoyaltyTransaction',
    tableName: 'loyalty_transactions',
    timestamps: true,
  }
);

export default LoyaltyTransaction; 