import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface CustomerAttributes {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: Date;
  gender?: 'male' | 'female' | 'other';
  notes?: string;
  segment?: 'vip' | 'regular' | 'new';
  loyaltyPoints: number;
  totalSpent: number;
  lastPurchaseDate?: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CustomerCreationAttributes extends Optional<CustomerAttributes, 'id' | 'phone' | 'birthDate' | 'gender' | 'notes' | 'segment' | 'loyaltyPoints' | 'totalSpent' | 'lastPurchaseDate' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class Customer extends Model<CustomerAttributes, CustomerCreationAttributes> implements CustomerAttributes {
  public id!: number;
  public userId!: number;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public phone?: string;
  public birthDate?: Date;
  public gender?: 'male' | 'female' | 'other';
  public notes?: string;
  public segment!: 'vip' | 'regular' | 'new';
  public loyaltyPoints!: number;
  public totalSpent!: number;
  public lastPurchaseDate?: Date;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Virtual fields
  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

Customer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    birthDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    segment: {
      type: DataTypes.ENUM('vip', 'regular', 'new'),
      allowNull: false,
      defaultValue: 'new',
    },
    loyaltyPoints: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    totalSpent: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    lastPurchaseDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Customer',
    tableName: 'customers',
    timestamps: true,
  }
);

export default Customer; 