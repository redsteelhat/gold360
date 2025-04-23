import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface TransferItemAttributes {
  id: number;
  transferId: number;
  productId: number;
  quantity: number;
  unitCost: number;
  notes?: string;
  receivedQuantity?: number;
  status: 'pending' | 'in_transit' | 'partial' | 'completed' | 'cancelled';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TransferItemCreationAttributes extends Optional<TransferItemAttributes, 'id' | 'createdAt' | 'updatedAt' | 'receivedQuantity'> {}

export class TransferItem extends Model<TransferItemAttributes, TransferItemCreationAttributes> implements TransferItemAttributes {
  public id!: number;
  public transferId!: number;
  public productId!: number;
  public quantity!: number;
  public unitCost!: number;
  public notes?: string;
  public receivedQuantity?: number;
  public status!: 'pending' | 'in_transit' | 'partial' | 'completed' | 'cancelled';

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Define associations
  public static associate(models: any) {
    TransferItem.belongsTo(models.StockTransfer, { foreignKey: 'transferId', as: 'transfer' });
    TransferItem.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
  }
}

TransferItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    transferId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'stock_transfers',
        key: 'id',
      },
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    unitCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    receivedQuantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_transit', 'partial', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW'),
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW'),
    },
  },
  {
    sequelize,
    modelName: 'TransferItem',
    tableName: 'transfer_items',
    timestamps: true,
    underscored: true,
    hooks: {
      afterUpdate: async (item: TransferItem) => {
        // Update transfer status when all items are received
        if (item.status === 'completed' || item.status === 'partial') {
          // Imported models should be used through the index file, not directly
          const db = require('./index');
          const transfer = await db.StockTransfer.findByPk(item.transferId, {
            include: [{ model: db.TransferItem, as: 'items' }],
          });
          
          if (transfer && transfer.items) {
            const allCompleted = transfer.items.every((i: any) => i.status === 'completed');
            const anyPartial = transfer.items.some((i: any) => i.status === 'partial');
            
            // StockTransfer ve TransferItem arasındaki durum çevirisi
            let newTransferStatus = transfer.status; // Varsayılan olarak mevcut durumu koru
            
            if (allCompleted) {
              newTransferStatus = 'COMPLETED'; // Büyük harf kullan
              await transfer.update({ 
                status: newTransferStatus, 
                completedDate: new Date() 
              });
            } else if (anyPartial) {
              // Kısmi olan transferlerin durumu 'IN_TRANSIT' olarak kalmalı
              // Çünkü StockTransfer modelinde 'PARTIAL' enum değeri yok
              newTransferStatus = 'IN_TRANSIT'; // Büyük harf kullan
              await transfer.update({ status: newTransferStatus });
            }
          }
        }
      }
    }
  }
);

export default TransferItem; 