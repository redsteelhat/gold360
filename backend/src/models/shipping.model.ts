import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Order } from './order.model';

export enum ShippingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing', 
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  RETURNED = 'returned',
  FAILED = 'failed'
}

@Table({
  tableName: 'shipping',
  timestamps: true,
  underscored: true
})
export class Shipping extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id!: number;

  @ForeignKey(() => Order)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  orderId!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false
  })
  carrier!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false
  })
  trackingNumber!: string;

  @Column({
    type: DataType.ENUM(...Object.values(ShippingStatus)),
    allowNull: false,
    defaultValue: ShippingStatus.PENDING
  })
  status!: ShippingStatus;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  estimatedDeliveryDate!: Date | null;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  actualDeliveryDate!: Date | null;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  })
  shippingCost!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false
  })
  shippingAddress!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false
  })
  recipientName!: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false
  })
  recipientPhone!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  notes!: string | null;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true
  })
  packageWeight!: number | null;

  @Column({
    type: DataType.STRING(30),
    allowNull: true
  })
  packageDimensions!: string | null;

  @BelongsTo(() => Order)
  order!: Order;
}

export default Shipping; 