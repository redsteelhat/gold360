import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Order } from './order.model';
import { Product } from './product.model';

@Table({
  tableName: 'order_items',
  timestamps: true,
})
export class OrderItem extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @ForeignKey(() => Order)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  orderId!: number;

  @BelongsTo(() => Order)
  order!: Order;

  @ForeignKey(() => Product)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  productId!: number;

  @BelongsTo(() => Product)
  product!: Product;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
  })
  quantity!: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
  })
  unitPrice!: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: true,
  })
  discountedPrice?: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
  })
  subtotal!: number;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  productData?: object;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes?: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isRefunded!: boolean;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: true,
  })
  refundAmount?: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  refundedAt?: Date;

  // Helper method to calculate subtotal
  calculateSubtotal(): number {
    const price = this.discountedPrice || this.unitPrice;
    return price * this.quantity;
  }
} 