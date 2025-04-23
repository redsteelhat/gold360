import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import sequelize from '../config/database';

interface StockTransactionAttributes {
  id: number;
  inventoryId: number;
  quantity: number;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN';
  referenceType?: 'ORDER' | 'PURCHASE' | 'TRANSFER' | 'MANUAL';
  referenceId?: number;
  transactionDate: Date;
  performedById: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface StockTransactionCreationAttributes extends Optional<StockTransactionAttributes, 'id' | 'transactionDate' | 'notes' | 'createdAt' | 'updatedAt'> {}

class StockTransaction extends Model<StockTransactionAttributes, StockTransactionCreationAttributes> implements StockTransactionAttributes {
  public id!: number;
  public inventoryId!: number;
  public quantity!: number;
  public type!: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN';
  public referenceType!: 'ORDER' | 'PURCHASE' | 'TRANSFER' | 'MANUAL';
  public referenceId!: number;
  public transactionDate!: Date;
  public performedById!: number;
  public notes!: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Association methods
  public static associate(models: any) {
    StockTransaction.belongsTo(models.Inventory, {
      foreignKey: 'inventoryId',
      as: 'inventory'
    });
    
    StockTransaction.belongsTo(models.User, {
      foreignKey: 'performedById',
      as: 'performedBy'
    });
  }
}

export default function(sequelize: Sequelize): typeof StockTransaction {
  StockTransaction.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    inventoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'inventories',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notZero(value: number) {
          if (value === 0) {
            throw new Error('Quantity cannot be zero');
          }
        }
      }
    },
    type: {
      type: DataTypes.ENUM('IN', 'OUT', 'ADJUSTMENT', 'RETURN'),
      allowNull: false
    },
    referenceType: {
      type: DataTypes.ENUM('ORDER', 'PURCHASE', 'TRANSFER', 'MANUAL'),
      allowNull: true
    },
    referenceId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    transactionDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    performedById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
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
    modelName: 'StockTransaction',
    tableName: 'stock_transactions',
    timestamps: true,
    underscored: true,
    hooks: {
      afterCreate: async (transaction: StockTransaction) => {
        try {
          // Update inventory quantity based on transaction type
          const inventory = await sequelize.models.Inventory.findByPk(transaction.inventoryId);
          if (inventory) {
            let newQuantity = inventory.get('quantity') as number;
            
            if (transaction.type === 'IN' || transaction.type === 'RETURN') {
              newQuantity += transaction.quantity;
            } else if (transaction.type === 'OUT') {
              newQuantity -= transaction.quantity;
            } else if (transaction.type === 'ADJUSTMENT') {
              // For adjustment, quantity should be the new value, not the delta
              newQuantity = transaction.quantity;
            }
            
            await inventory.update({ quantity: newQuantity });
          }
        } catch (error) {
          console.error('Error in StockTransaction afterCreate hook:', error);
        }
      }
    }
  });

  return StockTransaction;
} 