import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import sequelize from '../config/database';

interface InventoryAttributes {
  id: number;
  productId: number;
  warehouseId: number;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  alertThreshold: number;
  lastStockCheck: Date;
  shelfLocation: string;
  barcode?: string;
  rfidTag?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface InventoryCreationAttributes extends Optional<InventoryAttributes, 'id' | 'minQuantity' | 'maxQuantity' | 'alertThreshold' | 'lastStockCheck' | 'shelfLocation' | 'barcode' | 'rfidTag' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class Inventory extends Model<InventoryAttributes, InventoryCreationAttributes> implements InventoryAttributes {
  public id!: number;
  public productId!: number;
  public warehouseId!: number;
  public quantity!: number;
  public minQuantity!: number;
  public maxQuantity!: number;
  public alertThreshold!: number;
  public lastStockCheck!: Date;
  public shelfLocation!: string;
  public barcode!: string;
  public rfidTag!: string;
  public isActive!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Association methods
  public static associate(models: any) {
    Inventory.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product'
    });
    
    Inventory.belongsTo(models.Warehouse, {
      foreignKey: 'warehouseId',
      as: 'warehouse'
    });
    
    Inventory.hasMany(models.StockTransaction, {
      foreignKey: 'inventoryId',
      as: 'transactions'
    });
  }
}

export default function(sequelize: Sequelize): typeof Inventory {
  Inventory.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    warehouseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'warehouses',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    minQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    maxQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1000,
      validate: {
        min: 0
      }
    },
    alertThreshold: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      validate: {
        min: 0
      }
    },
    lastStockCheck: {
      type: DataTypes.DATE,
      allowNull: true
    },
    shelfLocation: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    barcode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    rfidTag: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
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
    modelName: 'Inventory',
    tableName: 'inventories',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['product_id', 'warehouse_id']
      }
    ]
  });

  return Inventory;
} 