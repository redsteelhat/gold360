import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { Product } from './product.model';
import { Warehouse } from './warehouse.model';

export enum AlertStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  IGNORED = 'ignored'
}

export enum AlertType {
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  OVERSTOCK = 'overstock'
}

interface StockAlertAttributes {
  id: number;
  productId: number;
  warehouseId: number;
  type: AlertType;
  status: AlertStatus;
  threshold: number;
  currentQuantity: number;
  message: string;
  resolvedAt?: Date;
  resolvedBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface StockAlertCreationAttributes extends Optional<StockAlertAttributes, 'id' | 'createdAt' | 'updatedAt' | 'resolvedAt' | 'resolvedBy'> {}

@Table({
  tableName: 'stock_alerts',
  timestamps: true,
})
export class StockAlert extends Model<StockAlertAttributes, StockAlertCreationAttributes> implements StockAlertAttributes {
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
    type: DataType.ENUM,
    values: Object.values(AlertType),
    allowNull: false,
    defaultValue: AlertType.LOW_STOCK,
  })
  type!: AlertType;

  @Column({
    type: DataType.ENUM,
    values: Object.values(AlertStatus),
    allowNull: false,
    defaultValue: AlertStatus.ACTIVE,
  })
  status!: AlertStatus;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    comment: 'The threshold value that triggered the alert'
  })
  threshold!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    comment: 'The current quantity at the time of alert'
  })
  currentQuantity!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  message!: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  resolvedAt?: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  resolvedBy?: number;

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
} 