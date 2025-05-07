import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { Order } from './order.model';

// Customer type enum
export enum CustomerType {
  INDIVIDUAL = 'individual',
  BUSINESS = 'business'
}

// Customer loyalty tier enum
export enum CustomerLoyaltyTier {
  STANDARD = 'standard',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum'
}

// Address type enum
export enum AddressType {
  BILLING = 'billing',
  SHIPPING = 'shipping',
  BOTH = 'both'
}

// Customer address interface
export interface CustomerAddress {
  type: AddressType;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
}

@Table({
  tableName: 'customers',
  timestamps: true,
  underscored: true
})
export class Customer extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id!: number;

  @Column({
    type: DataType.ENUM(...Object.values(CustomerType)),
    allowNull: false,
    defaultValue: CustomerType.INDIVIDUAL
  })
  type!: CustomerType;

  @Column({
    type: DataType.STRING(100),
    allowNull: false
  })
  firstName!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false
  })
  lastName!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    unique: true
  })
  email!: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true
  })
  phoneNumber?: string;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: []
  })
  addresses!: CustomerAddress[];

  @Column({
    type: DataType.JSONB,
    allowNull: true
  })
  preferences?: object;

  @Column({
    type: DataType.STRING(50),
    allowNull: true
  })
  taxId?: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true
  })
  companyName?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  notes?: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true
  })
  isActive!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true
  })
  marketingConsent!: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0
  })
  loyaltyPoints!: number;

  @Column({
    type: DataType.ENUM(...Object.values(CustomerLoyaltyTier)),
    allowNull: false,
    defaultValue: CustomerLoyaltyTier.STANDARD
  })
  loyaltyTier!: CustomerLoyaltyTier;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  })
  lifetimeValue!: number;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  lastPurchaseDate?: Date;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  })
  totalPurchases!: number;

  @HasMany(() => Order)
  orders!: Order[];

  // Helper to get full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

export default Customer; 