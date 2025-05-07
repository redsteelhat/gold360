import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Order } from './order.model';

@Table({
  tableName: 'order_items',
  timestamps: true,
  underscored: true
})
export class OrderItem extends Model {
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
    type: DataType.INTEGER,
    allowNull: false
  })
  productId!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false
  })
  productName!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true
  })
  sku?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1
  })
  quantity!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false
  })
  unitPrice!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  })
  discount!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false
  })
  subtotal!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  })
  tax!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false
  })
  total!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  notes?: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true
  })
  customizations?: object;

  @BelongsTo(() => Order)
  order!: Order;
}

export default OrderItem; 