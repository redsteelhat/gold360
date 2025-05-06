import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define the attributes of the ShippingProvider model
interface ShippingProviderAttributes {
  id: number;
  name: string; // Provider name (Aras, Yurtiçi, UPS, etc.)
  apiKey: string | null;
  apiSecret: string | null;
  baseUrl: string | null;
  isActive: boolean;
  defaultProvider: boolean;
  supportedFeatures: string; // JSON string of supported features
  accountNumber: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Define which attributes are optional for creating a new ShippingProvider instance
interface ShippingProviderCreationAttributes extends Optional<ShippingProviderAttributes, 'id' | 'apiKey' | 'apiSecret' | 'baseUrl' | 'isActive' | 'defaultProvider' | 'accountNumber' | 'contactEmail' | 'contactPhone' | 'notes' | 'createdAt' | 'updatedAt'> {}

// Define the ShippingProvider model class
class ShippingProvider extends Model<ShippingProviderAttributes, ShippingProviderCreationAttributes> implements ShippingProviderAttributes {
  public id!: number;
  public name!: string;
  public apiKey!: string | null;
  public apiSecret!: string | null;
  public baseUrl!: string | null;
  public isActive!: boolean;
  public defaultProvider!: boolean;
  public supportedFeatures!: string;
  public accountNumber!: string | null;
  public contactEmail!: string | null;
  public contactPhone!: string | null;
  public notes!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the ShippingProvider model with its attributes and options
ShippingProvider.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  apiKey: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  apiSecret: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  baseUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  defaultProvider: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  supportedFeatures: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '{}',
    get() {
      const rawValue = this.getDataValue('supportedFeatures');
      return rawValue ? JSON.parse(rawValue) : {};
    },
    set(value: object) {
      this.setDataValue('supportedFeatures', JSON.stringify(value));
    },
  },
  accountNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  contactEmail: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  contactPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
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
  tableName: 'shipping_providers',
  timestamps: true,
});

export default ShippingProvider; 