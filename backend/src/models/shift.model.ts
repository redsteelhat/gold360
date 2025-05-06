import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { User } from './user.model';

// Shift types enum
export enum ShiftType {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
  NIGHT = 'night',
  FULL_DAY = 'full_day',
  CUSTOM = 'custom'
}

// Shift status enum
export enum ShiftStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Shift attributes interface
export interface ShiftAttributes {
  id: number;
  userId: number;
  type: ShiftType;
  startTime: Date;
  endTime: Date;
  breakDuration: number; // in minutes
  notes: string;
  status: ShiftStatus;
  isOvertime: boolean;
  locationId: number | null;
  createdById: number;
  createdAt: Date;
  updatedAt: Date;
}

// Optional fields for creation
export interface ShiftCreationAttributes extends Optional<ShiftAttributes, 'id' | 'notes' | 'breakDuration' | 'isOvertime' | 'locationId' | 'createdAt' | 'updatedAt'> {}

// Shift model class
export class Shift extends Model<ShiftAttributes, ShiftCreationAttributes> implements ShiftAttributes {
  public id!: number;
  public userId!: number;
  public type!: ShiftType;
  public startTime!: Date;
  public endTime!: Date;
  public breakDuration!: number;
  public notes!: string;
  public status!: ShiftStatus;
  public isOvertime!: boolean;
  public locationId!: number | null;
  public createdById!: number;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  
  // Helper method to calculate shift duration in hours
  public getDurationHours(): number {
    const start = new Date(this.startTime);
    const end = new Date(this.endTime);
    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    return parseFloat((durationHours - (this.breakDuration / 60)).toFixed(2));
  }
}

// Initialize Shift model
Shift.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.ENUM(...Object.values(ShiftType)),
      allowNull: false,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    breakDuration: {
      type: DataTypes.INTEGER, // in minutes
      allowNull: false,
      defaultValue: 0,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ShiftStatus)),
      allowNull: false,
      defaultValue: ShiftStatus.SCHEDULED,
    },
    isOvertime: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    locationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Warehouses', // Assuming stores/locations are in the Warehouses table
        key: 'id',
      },
    },
    createdById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'Shifts',
    timestamps: true,
  }
);

// Define associations
export const associateShift = () => {
  Shift.belongsTo(User, { as: 'user', foreignKey: 'userId' });
  Shift.belongsTo(User, { as: 'createdBy', foreignKey: 'createdById' });
};

export default Shift; 