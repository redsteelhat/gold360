import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface PromotionAttributes {
  id: number;
  name: string;
  description?: string;
  type: 'discount' | 'bonus_points' | 'free_product' | 'free_shipping' | 'buy_x_get_y';
  value: number; // Discount percentage, bonus points, etc.
  minimumPurchase?: number; // Minimum purchase amount
  code?: string; // Promotion code (if applicable)
  productId?: number; // Target product (if applicable)
  categoryId?: number; // Target category (if applicable)
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  maxUsage?: number; // Maximum number of times the promotion can be used
  currentUsage: number; // Current number of times the promotion has been used
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PromotionCreationAttributes extends Optional<PromotionAttributes, 'id' | 'description' | 'minimumPurchase' | 'code' | 'productId' | 'categoryId' | 'maxUsage' | 'currentUsage' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class Promotion extends Model<PromotionAttributes, PromotionCreationAttributes> implements PromotionAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public type!: 'discount' | 'bonus_points' | 'free_product' | 'free_shipping' | 'buy_x_get_y';
  public value!: number;
  public minimumPurchase?: number;
  public code?: string;
  public productId?: number;
  public categoryId?: number;
  public startDate!: Date;
  public endDate!: Date;
  public isActive!: boolean;
  public maxUsage?: number;
  public currentUsage!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Virtual fields
  public get isExpired(): boolean {
    return this.endDate < new Date();
  }
}

Promotion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('discount', 'bonus_points', 'free_product', 'free_shipping', 'buy_x_get_y'),
      allowNull: false,
    },
    value: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    minimumPurchase: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'products',
        key: 'id',
      },
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    maxUsage: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    currentUsage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'Promotion',
    tableName: 'promotions',
    timestamps: true,
  }
);

export default Promotion; 