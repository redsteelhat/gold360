import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { Product } from './product.model';
import { Warehouse } from './warehouse.model';
import { User } from './user.model';

export enum TransactionType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  TRANSFER = 'transfer',
  ADJUSTMENT = 'adjustment',
  RETURN = 'return',
  INITIAL = 'initial'
}

interface StockTransactionAttributes {
  id: number;
  productId: number;
  warehouseId: number;
  quantity: number;
  type: TransactionType;
  referenceId?: string;
  notes?: string;
  performedBy: number;
  previousQuantity: number;
  newQuantity: number;
  unitCost?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface StockTransactionCreationAttributes extends Optional<StockTransactionAttributes, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'referenceId' | 'unitCost'> {}

@Table({
  tableName: 'stock_transactions',
  timestamps: true,
})
export class StockTransaction extends Model<StockTransactionAttributes, StockTransactionCreationAttributes> implements StockTransactionAttributes {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @ForeignKey(() => Product)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  productId!: number;

  @ForeignKey(() => Warehouse)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  warehouseId!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  quantity!: number;

  @Column({
    type: DataType.ENUM,
    values: Object.values(TransactionType),
    allowNull: false,
  })
  type!: TransactionType;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'Reference to external ID like order number, transfer ID, etc.'
  })
  referenceId?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  performedBy!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Quantity before transaction'
  })
  previousQuantity!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Quantity after transaction'
  })
  newQuantity!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Cost per unit'
  })
  unitCost?: number;

  // Timestamps
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  createdAt!: Date;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  updatedAt!: Date;

  // Associations
  @BelongsTo(() => Product)
  product!: Product;

  @BelongsTo(() => Warehouse)
  warehouse!: Warehouse;

  @BelongsTo(() => User, 'performedBy')
  performer!: User;
} 