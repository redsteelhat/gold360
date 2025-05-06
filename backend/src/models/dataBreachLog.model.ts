import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user.model';

export enum BreachSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum BreachStatus {
  DETECTED = 'detected',
  INVESTIGATING = 'investigating',
  CONTAINED = 'contained',
  RESOLVED = 'resolved',
  REPORTED = 'reported',
}

@Table({
  tableName: 'data_breach_logs',
  timestamps: true,
})
export class DataBreachLog extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    comment: 'Title of the breach incident',
  })
  breachTitle!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    comment: 'Detailed description of the breach',
  })
  breachDescription!: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    comment: 'When the breach was detected',
  })
  detectionDate!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: 'When the breach occurred (may be different from detection)',
  })
  occurrenceDate?: Date;

  @Column({
    type: DataType.ENUM,
    values: Object.values(BreachSeverity),
    allowNull: false,
    comment: 'Severity level of the breach',
  })
  severity!: BreachSeverity;

  @Column({
    type: DataType.ENUM,
    values: Object.values(BreachStatus),
    allowNull: false,
    defaultValue: BreachStatus.DETECTED,
    comment: 'Current status of the breach',
  })
  status!: BreachStatus;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: 'What data was affected by the breach',
  })
  affectedData?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'Estimated number of users affected',
  })
  affectedUsersCount?: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: 'Steps taken to address the breach',
  })
  mitigationSteps?: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether authorities have been notified',
  })
  authorityNotified!: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: 'When authorities were notified (if applicable)',
  })
  authorityNotificationDate?: Date;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether affected users have been notified',
  })
  usersNotified!: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: 'When users were notified (if applicable)',
  })
  userNotificationDate?: Date;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'User who reported the breach',
  })
  reportedBy?: number;

  @BelongsTo(() => User, 'reportedBy')
  reportedByUser?: User;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'User responsible for handling the breach',
  })
  assignedTo?: number;

  @BelongsTo(() => User, 'assignedTo')
  assignedToUser?: User;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: 'When the breach was resolved',
  })
  resolutionDate?: Date;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: 'Root cause analysis findings',
  })
  rootCauseAnalysis?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: 'Preventive measures implemented after the breach',
  })
  preventiveMeasures?: string;
}

export default DataBreachLog; 