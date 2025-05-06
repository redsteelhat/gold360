import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, Default } from 'sequelize-typescript';
import { User } from './user.model';
import { Order } from './order.model';

export enum CustomerType {
  INDIVIDUAL = 'individual',
  BUSINESS = 'business'
}

export enum CustomerLoyaltyTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum'
}

export interface CustomerAddress {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

@Table({
  tableName: 'customers',
  timestamps: true,
  paranoid: true
})
export class Customer extends Model {
  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  userId!: number;

  @BelongsTo(() => User)
  user!: User;

  @Column({
    type: DataType.ENUM(...Object.values(CustomerType)),
    defaultValue: CustomerType.INDIVIDUAL,
    allowNull: false
  })
  type!: CustomerType;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  companyName?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  taxId?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  phoneNumber?: string;

  @Column({
    type: DataType.ENUM(...Object.values(CustomerLoyaltyTier)),
    defaultValue: CustomerLoyaltyTier.BRONZE,
    allowNull: false
  })
  loyaltyTier!: CustomerLoyaltyTier;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  loyaltyPoints!: number;

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
  preferences?: any;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  notes?: string;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false
  })
  marketingConsent!: boolean;

  @Default(new Date())
  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  lastContactDate!: Date;

  @Default(0)
  @Column({
    type: DataType.FLOAT,
    allowNull: false
  })
  lifetimeValue!: number;

  @HasMany(() => Order)
  orders!: Order[];
} 