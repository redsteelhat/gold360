import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user.model';

export enum ProductStatus {
  ACTIVE = 'active',
  DRAFT = 'draft',
  SOLD_OUT = 'sold_out',
  DISCONTINUED = 'discontinued'
}

@Table({
  tableName: 'products',
  timestamps: true,
})
export class Product extends Model {
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
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  })
  price!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  salePrice?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  stockQuantity!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  sku!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  barcode?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  category?: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
    defaultValue: [],
  })
  tags?: string[];

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
    defaultValue: [],
  })
  images?: string[];

  @Column({
    type: DataType.ENUM,
    values: Object.values(ProductStatus),
    defaultValue: ProductStatus.DRAFT,
    allowNull: false,
  })
  status!: ProductStatus;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100,
    },
  })
  taxRate?: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  isVisible!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isFeatured!: boolean;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  metadata?: object;

  @Column({
    type: DataType.DECIMAL(10, 3),
    allowNull: true,
    comment: 'Weight in grams',
  })
  weight?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Length in cm',
  })
  length?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Width in cm',
  })
  width?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Height in cm',
  })
  height?: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  createdBy!: number;

  @BelongsTo(() => User, 'createdBy')
  creator!: User;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  publishedAt?: Date;

  // Helper method to check if product is in stock
  get isInStock(): boolean {
    return this.stockQuantity > 0;
  }

  // Helper method to get the current active price (sale or regular)
  get activePrice(): number {
    return this.salePrice !== null && this.salePrice !== undefined && this.salePrice < this.price
      ? this.salePrice
      : this.price;
  }

  // Helper method to calculate discount percentage
  get discountPercentage(): number | null {
    if (this.salePrice !== null && this.salePrice !== undefined && this.salePrice < this.price) {
      return Math.round(((this.price - this.salePrice) / this.price) * 100);
    }
    return null;
  }
} 