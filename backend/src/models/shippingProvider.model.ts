import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'shipping_providers',
  timestamps: true,
  underscored: true
})
export class ShippingProvider extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    unique: true
  })
  name!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true
  })
  apiKey!: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true
  })
  apiSecret!: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true
  })
  baseUrl!: string | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true
  })
  isActive!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false
  })
  defaultProvider!: boolean;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {}
  })
  supportedFeatures!: object;

  @Column({
    type: DataType.STRING(50),
    allowNull: true
  })
  accountNumber!: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true
  })
  contactEmail!: string | null;

  @Column({
    type: DataType.STRING(20),
    allowNull: true
  })
  contactPhone!: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  notes!: string | null;
}

export default ShippingProvider; 