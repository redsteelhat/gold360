import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { User } from './user.model';
import { OrderItem } from './orderItem.model';

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  COMPLETED = 'completed'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  BANK_TRANSFER = 'bank_transfer',
  CASH_ON_DELIVERY = 'cash_on_delivery',
  WALLET = 'wallet'
}

@Table({
  tableName: 'orders',
  timestamps: true,
})
export class Order extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  orderNumber!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  customerId!: number;

  @BelongsTo(() => User, 'customerId')
  customer!: User;

  @Column({
    type: DataType.ENUM,
    values: Object.values(OrderStatus),
    defaultValue: OrderStatus.PENDING,
    allowNull: false,
  })
  status!: OrderStatus;

  @Column({
    type: DataType.ENUM,
    values: Object.values(PaymentStatus),
    defaultValue: PaymentStatus.PENDING,
    allowNull: false,
  })
  paymentStatus!: PaymentStatus;

  @Column({
    type: DataType.ENUM,
    values: Object.values(PaymentMethod),
    defaultValue: PaymentMethod.CREDIT_CARD,
    allowNull: false,
  })
  paymentMethod!: PaymentMethod;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
  })
  subtotal!: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
  })
  tax!: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
  })
  shippingCost!: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
  })
  discount!: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
  })
  total!: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  couponCode?: string;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
  })
  shippingAddress!: object;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
  })
  billingAddress!: object;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  customerNotes?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  adminNotes?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  trackingNumber?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  shippingCarrier?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  shippedAt?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  deliveredAt?: Date;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  paymentDetails?: object;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  invoiceNumber?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  invoiceDate?: Date;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isGift!: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  giftMessage?: string;

  @HasMany(() => OrderItem)
  items!: OrderItem[];

  // Helper method to calculate total
  calculateTotal(): number {
    return (this.subtotal + this.tax + this.shippingCost) - this.discount;
  }
} 