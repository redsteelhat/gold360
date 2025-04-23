import { Model, DataTypes, Sequelize, Optional, Op } from 'sequelize';
import sequelize from '../config/database';

// Define the attributes for the StockAdjustment model
interface StockAdjustmentAttributes {
  id: number;
  warehouseId: number;
  referenceNumber: string;
  adjustmentDate: Date;
  reason: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  initiatedById: number;
  approvedById?: number;
  approvedDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define which attributes are optional during creation
interface StockAdjustmentCreationAttributes extends Optional<StockAdjustmentAttributes, 'id' | 'adjustmentDate' | 'approvedById' | 'approvedDate' | 'notes' | 'createdAt' | 'updatedAt'> {}

class StockAdjustment extends Model<StockAdjustmentAttributes, StockAdjustmentCreationAttributes> implements StockAdjustmentAttributes {
  public id!: number;
  public warehouseId!: number;
  public referenceNumber!: string;
  public adjustmentDate!: Date;
  public reason!: string;
  public status!: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  public initiatedById!: number;
  public approvedById!: number;
  public approvedDate!: Date;
  public notes!: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Association methods
  public static associate(models: any) {
    StockAdjustment.belongsTo(models.Warehouse, {
      foreignKey: 'warehouseId',
      as: 'warehouse'
    });
    
    StockAdjustment.belongsTo(models.User, {
      foreignKey: 'initiatedById',
      as: 'initiatedBy'
    });
    
    StockAdjustment.belongsTo(models.User, {
      foreignKey: 'approvedById',
      as: 'approvedBy'
    });
    
    StockAdjustment.hasMany(models.AdjustmentItem, {
      foreignKey: 'adjustmentId',
      as: 'items'
    });
  }
}

export default function(sequelize: Sequelize): typeof StockAdjustment {
  StockAdjustment.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    warehouseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'warehouses',
        key: 'id'
      }
    },
    referenceNumber: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    adjustmentDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'COMPLETED', 'CANCELLED'),
      allowNull: false,
      defaultValue: 'PENDING'
    },
    initiatedById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approvedById: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approvedDate: {
      type: DataTypes.DATE,
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
    modelName: 'StockAdjustment',
    tableName: 'stock_adjustments',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (adjustment: StockAdjustment) => {
        try {
          // Generate a unique reference number
          const date = new Date();
          const year = date.getFullYear().toString().substr(-2);
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          
          // Count adjustments in the current month
          const count = await StockAdjustment.count({
            where: {
              createdAt: {
                [Op.gte]: new Date(date.getFullYear(), date.getMonth(), 1),
                [Op.lt]: new Date(date.getFullYear(), date.getMonth() + 1, 1)
              }
            }
          });
          
          adjustment.referenceNumber = `ADJ-${year}${month}-${(count + 1).toString().padStart(4, '0')}`;
        } catch (error) {
          console.error('Error in StockAdjustment beforeCreate hook:', error);
        }
      }
    }
  });

  return StockAdjustment;
} 