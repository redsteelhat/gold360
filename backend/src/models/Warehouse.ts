import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import sequelize from '../config/database';

interface WarehouseAttributes {
  id: number;
  name: string;
  location: string;
  address: string;
  capacity: number;
  isActive: boolean;
  contactPerson?: string;
  contactPhone?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface WarehouseCreationAttributes extends Optional<WarehouseAttributes, 'id' | 'capacity' | 'isActive' | 'contactPerson' | 'contactPhone' | 'notes' | 'createdAt' | 'updatedAt'> {}

class Warehouse extends Model<WarehouseAttributes, WarehouseCreationAttributes> implements WarehouseAttributes {
  public id!: number;
  public name!: string;
  public location!: string;
  public address!: string;
  public capacity!: number;
  public isActive!: boolean;
  public contactPerson!: string;
  public contactPhone!: string;
  public notes!: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Association methods
  public static associate(models: any) {
    Warehouse.hasMany(models.Inventory, {
      foreignKey: 'warehouseId',
      as: 'inventories'
    });
    
    Warehouse.hasMany(models.StockTransfer, {
      foreignKey: 'sourceWarehouseId',
      as: 'outgoingTransfers'
    });
    
    Warehouse.hasMany(models.StockTransfer, {
      foreignKey: 'destinationWarehouseId',
      as: 'incomingTransfers'
    });
  }
}

export default function(sequelize: Sequelize): typeof Warehouse {
  Warehouse.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    contactPerson: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    contactPhone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Warehouse',
    tableName: 'warehouses',
    timestamps: true,
    underscored: true
  });

  return Warehouse;
} 