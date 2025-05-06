import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { Product } from './product.model';

// Interface for Inventory attributes
interface InventoryAttributes {
  id: number;
  productId: number;
  warehouseId: number;
  quantity: number;
  minimumStockLevel: number;
  reservedQuantity: number;
  lastUpdated: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for Inventory creation attributes
interface InventoryCreationAttributes extends Optional<InventoryAttributes, 'id' | 'createdAt' | 'updatedAt' | 'reservedQuantity' | 'lastUpdated'> {}

// Inventory model
class Inventory extends Model<InventoryAttributes, InventoryCreationAttributes> implements InventoryAttributes {
  public id!: number;
  public productId!: number;
  public warehouseId!: number;
  public quantity!: number;
  public minimumStockLevel!: number;
  public reservedQuantity!: number;
  public lastUpdated!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Inventory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Products',
        key: 'id',
      },
    },
    warehouseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    minimumStockLevel: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 5,
    },
    reservedQuantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    lastUpdated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'Inventory',
    timestamps: true,
  }
);

// Define associations
Inventory.belongsTo(Product, { foreignKey: 'productId' });

export default Inventory; 