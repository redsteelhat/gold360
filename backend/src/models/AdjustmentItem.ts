import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import sequelize from '../config/database';

// Interface for AdjustmentItem attributes
export interface AdjustmentItemAttributes {
  id: number;
  adjustmentId: number;
  productId: number;
  quantity: number;
  currentStock: number;
  newStock: number;
  unitCost: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

// Interface for creation attributes - all the fields that can be optional when creating
export interface AdjustmentItemCreationAttributes extends Optional<AdjustmentItemAttributes, 
  'id' | 'status' | 'createdAt' | 'updatedAt'> {}

// AdjustmentItem model class definition
class AdjustmentItem extends Model<AdjustmentItemAttributes, AdjustmentItemCreationAttributes> 
  implements AdjustmentItemAttributes {
  public id!: number;
  public adjustmentId!: number;
  public productId!: number;
  public quantity!: number;
  public currentStock!: number;
  public newStock!: number;
  public unitCost!: number;
  public reason!: string;
  public status!: 'pending' | 'approved' | 'rejected';
  public createdAt!: Date;
  public updatedAt!: Date;

  // Association methods
  public static associate(models: { StockAdjustment: any; Product: any }): void {
    // Define associations
    AdjustmentItem.belongsTo(models.StockAdjustment, {
      foreignKey: 'adjustmentId',
      as: 'adjustment'
    });

    AdjustmentItem.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product'
    });
  }
}

// Initialize the model
AdjustmentItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    adjustmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'stock_adjustments',
        key: 'id'
      }
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        notNull: { msg: 'Quantity is required' },
      }
    },
    currentStock: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    newStock: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    unitCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
      allowNull: false
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
  },
  {
    sequelize,
    modelName: 'AdjustmentItem',
    tableName: 'adjustment_items',
    timestamps: true,
    underscored: true,
    hooks: {
      // Hook to update adjustment status when all items are processed
      afterUpdate: async (item: AdjustmentItem) => {
        if (item.status === 'approved' || item.status === 'rejected') {
          const allItems = await AdjustmentItem.findAll({
            where: { adjustmentId: item.adjustmentId }
          });
          
          const allProcessed = allItems.every(i => 
            i.status === 'approved' || i.status === 'rejected'
          );
          
          if (allProcessed) {
            const StockAdjustment = sequelize.models.StockAdjustment;
            await StockAdjustment.update(
              { status: 'completed' },
              { where: { id: item.adjustmentId } }
            );
          }
        }
      }
    }
  }
);

export default AdjustmentItem; 