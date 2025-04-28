import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface ProductAttributes {
  id: number;
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  costPrice: number;
  weight: number;
  goldKarat: string;
  isActive: boolean;
  isFeatured: boolean;
  stockQuantity: number;
  stockAlert: number;
  status?: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'compareAtPrice' | 'isFeatured' | 'status' | 'createdAt' | 'updatedAt'> {}

class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: number;
  public name!: string;
  public sku!: string;
  public price!: number;
  public compareAtPrice?: number;
  public costPrice!: number;
  public weight!: number;
  public goldKarat!: string;
  public isActive!: boolean;
  public isFeatured!: boolean;
  public stockQuantity!: number;
  public stockAlert!: number;
  public status?: 'active' | 'inactive';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    compareAtPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    costPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    weight: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
    },
    goldKarat: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    stockQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    stockAlert: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
    },
    status: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.isActive ? 'active' : 'inactive';
      },
      set(value: 'active' | 'inactive') {
        this.setDataValue('isActive', value === 'active');
      }
    }
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    timestamps: true,
  }
);

export default Product; 