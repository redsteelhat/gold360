import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { Product } from './product.model';
import { StockTransfer } from './stockTransfer.model';

export enum TransferItemStatus {
  PENDING = 'pending',
  TRANSFERRED = 'transferred',
  RECEIVED = 'received',
  CANCELLED = 'cancelled'
}

interface TransferItemAttributes {
  id: number;
  transferId: number;
  productId: number;
  quantity: number;
  status: TransferItemStatus;
  notes?: string;
  receivedQuantity?: number;
  receivedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TransferItemCreationAttributes extends Optional<TransferItemAttributes, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'receivedQuantity' | 'receivedAt'> {}

@Table({
  tableName: 'transfer_items',
  timestamps: true,
})
export class TransferItem extends Model<TransferItemAttributes, TransferItemCreationAttributes> implements TransferItemAttributes {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @ForeignKey(() => StockTransfer)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  transferId!: number;

  @ForeignKey(() => Product)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  productId!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  quantity!: number;

  @Column({
    type: DataType.ENUM,
    values: Object.values(TransferItemStatus),
    allowNull: false,
    defaultValue: TransferItemStatus.PENDING,
  })
  status!: TransferItemStatus;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes?: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    comment: 'The actual quantity received, which might differ from requested'
  })
  receivedQuantity?: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  receivedAt?: Date;

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
  @BelongsTo(() => StockTransfer)
  transfer!: StockTransfer;

  @BelongsTo(() => Product)
  product!: Product;
} 