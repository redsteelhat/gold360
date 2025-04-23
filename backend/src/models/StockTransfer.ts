import { Model, DataTypes, Sequelize, Optional, Op } from 'sequelize';
import sequelize from '../config/database';

interface StockTransferAttributes {
  id: number;
  sourceWarehouseId: number;
  destinationWarehouseId: number;
  referenceNumber: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  initiatedDate: Date;
  completedDate?: Date;
  shippingMethod?: string;
  trackingNumber?: string;
  estimatedArrival?: Date;
  notes?: string;
  initiatedById: number;
  completedById?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface StockTransferCreationAttributes extends Optional<StockTransferAttributes, 'id' | 'referenceNumber' | 'initiatedDate' | 'completedDate' | 'shippingMethod' | 'trackingNumber' | 'estimatedArrival' | 'notes' | 'completedById' | 'createdAt' | 'updatedAt'> {}

class StockTransfer extends Model<StockTransferAttributes, StockTransferCreationAttributes> implements StockTransferAttributes {
  public id!: number;
  public sourceWarehouseId!: number;
  public destinationWarehouseId!: number;
  public referenceNumber!: string;
  public status!: 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  public initiatedDate!: Date;
  public completedDate!: Date;
  public shippingMethod!: string;
  public trackingNumber!: string;
  public estimatedArrival!: Date;
  public notes!: string;
  public initiatedById!: number;
  public completedById!: number;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Association methods
  public static associate(models: any) {
    StockTransfer.belongsTo(models.Warehouse, {
      foreignKey: 'sourceWarehouseId',
      as: 'sourceWarehouse'
    });
    
    StockTransfer.belongsTo(models.Warehouse, {
      foreignKey: 'destinationWarehouseId',
      as: 'destinationWarehouse'
    });
    
    StockTransfer.belongsTo(models.User, {
      foreignKey: 'initiatedById',
      as: 'initiatedBy'
    });
    
    StockTransfer.belongsTo(models.User, {
      foreignKey: 'completedById',
      as: 'completedBy'
    });
    
    StockTransfer.hasMany(models.TransferItem, {
      foreignKey: 'transferId',
      as: 'items'
    });
  }
}

export default function(sequelize: Sequelize): typeof StockTransfer {
  StockTransfer.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sourceWarehouseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'warehouses',
        key: 'id'
      }
    },
    destinationWarehouseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'warehouses',
        key: 'id'
      }
    },
    referenceNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'),
      allowNull: false,
      defaultValue: 'PENDING'
    },
    initiatedDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    completedDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    shippingMethod: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    trackingNumber: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    estimatedArrival: {
      type: DataTypes.DATE,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    initiatedById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    completedById: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
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
    modelName: 'StockTransfer',
    tableName: 'stock_transfers',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (transfer: StockTransfer) => {
        // Generate a unique reference number
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const count = await StockTransfer.count({
          where: {
            createdAt: {
              [Op.gte]: new Date(date.getFullYear(), date.getMonth(), 1),
              [Op.lt]: new Date(date.getFullYear(), date.getMonth() + 1, 1)
            }
          }
        });
        
        transfer.referenceNumber = `TRF-${year}${month}-${(count + 1).toString().padStart(4, '0')}`;
      }
    }
  });

  return StockTransfer;
} 