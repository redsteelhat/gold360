import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { Warehouse } from './warehouse.model';
import { User } from './user.model';

export enum TransferStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

interface StockTransferAttributes {
  id: number;
  sourceWarehouseId: number;
  destinationWarehouseId: number;
  status: TransferStatus;
  notes?: string;
  requestedBy: number;
  approvedBy?: number;
  requestedDate: Date;
  approvedDate?: Date;
  completedDate?: Date;
  transferCode: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface StockTransferCreationAttributes extends Optional<StockTransferAttributes, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'approvedBy' | 'approvedDate' | 'completedDate'> {}

@Table({
  tableName: 'stock_transfers',
  timestamps: true,
})
export class StockTransfer extends Model<StockTransferAttributes, StockTransferCreationAttributes> implements StockTransferAttributes {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @ForeignKey(() => Warehouse)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  sourceWarehouseId!: number;

  @ForeignKey(() => Warehouse)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  destinationWarehouseId!: number;

  @Column({
    type: DataType.ENUM,
    values: Object.values(TransferStatus),
    allowNull: false,
    defaultValue: TransferStatus.DRAFT,
  })
  status!: TransferStatus;

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
  requestedBy!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  approvedBy?: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  requestedDate!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  approvedDate?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  completedDate?: Date;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  transferCode!: string;

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
  @BelongsTo(() => Warehouse, 'sourceWarehouseId')
  sourceWarehouse!: Warehouse;

  @BelongsTo(() => Warehouse, 'destinationWarehouseId')
  destinationWarehouse!: Warehouse;

  @BelongsTo(() => User, 'requestedBy')
  requester!: User;

  @BelongsTo(() => User, 'approvedBy')
  approver!: User;
} 