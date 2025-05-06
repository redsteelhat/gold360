import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { Optional } from 'sequelize';

interface WarehouseAttributes {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  contactPerson: string;
  contactPhone: string;
  isActive: boolean;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface WarehouseCreationAttributes extends Optional<WarehouseAttributes, 'id' | 'createdAt' | 'updatedAt' | 'description'> {}

@Table({
  tableName: 'warehouses',
  timestamps: true,
})
export class Warehouse extends Model<WarehouseAttributes, WarehouseCreationAttributes> implements WarehouseAttributes {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  address!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  city!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  state!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  country!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  zipCode!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  contactPerson!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  contactPhone!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  isActive!: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

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
} 