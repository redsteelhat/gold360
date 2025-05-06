import { Table, Column, Model, DataType, BelongsTo, HasMany, ForeignKey, BeforeCreate } from 'sequelize-typescript';
import { User } from './user.model';
import { OrderItem } from './orderItem.model';
import { Customer } from './customer.model';

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
  REFUNDED = 'refunded'
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
  DIGITAL_WALLET = 'digital_wallet'
}

@Table({
  tableName: 'orders',
  timestamps: true
})
export class Order extends Model {
  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false
  })
  orderNumber!: string;

  @ForeignKey(() => Customer)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  customerId!: number;

  @BelongsTo(() => Customer)
  customer!: Customer;

  @Column({
    type: DataType.ENUM(...Object.values(OrderStatus)),
    values: Object.values(OrderStatus),
    defaultValue: OrderStatus.PENDING,
    allowNull: false
  })
  status!: OrderStatus;

  @Column({
    type: DataType.ENUM(...Object.values(PaymentStatus)),
    values: Object.values(PaymentStatus),
    defaultValue: PaymentStatus.PENDING,
    allowNull: false
  })
  paymentStatus!: PaymentStatus;

  @Column({
    type: DataType.ENUM(...Object.values(PaymentMethod)),
    values: Object.values(PaymentMethod),
    defaultValue: PaymentMethod.CREDIT_CARD,
    allowNull: false
  })
  paymentMethod!: PaymentMethod;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  })
  subtotal!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  })
  taxAmount!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  })
  shippingAmount!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  })
  discountAmount!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  })
  totalAmount!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  notes?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  trackingNumber?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  shippingMethod?: string;

  @Column({
    type: DataType.JSONB,
    allowNull: false
  })
  shippingAddress!: object;

  @Column({
    type: DataType.JSONB,
    allowNull: false
  })
  billingAddress!: object;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  customerNotes?: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true
  })
  paymentDetails?: object;

  @HasMany(() => OrderItem)
  items!: OrderItem[];

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  processedBy?: number;

  @BelongsTo(() => User, 'processedBy')
  processor?: User;

  @BeforeCreate
  static generateOrderNumber(instance: Order) {
    const prefix = 'ORD';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    instance.orderNumber = `${prefix}-${timestamp}-${random}`;
  }
}

export default Order; 