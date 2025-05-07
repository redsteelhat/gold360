import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
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

@Table({
  tableName: 'shifts',
  timestamps: true,
  underscored: true
})
export class Shift extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  userId!: number;

  @Column({
    type: DataType.ENUM(...Object.values(ShiftType)),
    allowNull: false
  })
  type!: ShiftType;

  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  startTime!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  endTime!: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Break duration in minutes'
  })
  breakDuration!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    defaultValue: ''
  })
  notes!: string;

  @Column({
    type: DataType.ENUM(...Object.values(ShiftStatus)),
    allowNull: false,
    defaultValue: ShiftStatus.SCHEDULED
  })
  status!: ShiftStatus;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false
  })
  isOvertime!: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    references: {
      model: 'warehouses',
      key: 'id'
    }
  })
  locationId!: number | null;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  createdById!: number;

  @BelongsTo(() => User, 'userId')
  user!: User;

  @BelongsTo(() => User, 'createdById')
  createdBy!: User;

  // Helper method to calculate shift duration in hours
  getDurationHours(): number {
    const start = new Date(this.startTime);
    const end = new Date(this.endTime);
    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    return parseFloat((durationHours - (this.breakDuration / 60)).toFixed(2));
  }
}

export default Shift; 