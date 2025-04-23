import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface LoyaltyProgramAttributes {
  id: number;
  name: string;
  description?: string;
  pointsPerCurrency: number; // How many points earned per currency unit spent
  minimumPointsForRedemption: number;
  pointValueInCurrency: number; // How much each point is worth in currency
  expiryMonths: number; // How many months until points expire
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoyaltyProgramCreationAttributes extends Optional<LoyaltyProgramAttributes, 'id' | 'description' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class LoyaltyProgram extends Model<LoyaltyProgramAttributes, LoyaltyProgramCreationAttributes> implements LoyaltyProgramAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public pointsPerCurrency!: number;
  public minimumPointsForRedemption!: number;
  public pointValueInCurrency!: number;
  public expiryMonths!: number;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

LoyaltyProgram.init(
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pointsPerCurrency: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1.0,
    },
    minimumPointsForRedemption: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
    },
    pointValueInCurrency: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.01,
    },
    expiryMonths: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 12,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'LoyaltyProgram',
    tableName: 'loyalty_programs',
    timestamps: true,
  }
);

export default LoyaltyProgram; 