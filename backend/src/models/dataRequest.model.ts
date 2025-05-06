import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user.model';

export enum RequestType {
  DATA_ACCESS = 'data_access',
  DATA_DELETION = 'data_deletion',
  DATA_PORTABILITY = 'data_portability',
  DATA_CORRECTION = 'data_correction',
  PROCESSING_RESTRICTION = 'processing_restriction',
  CONSENT_WITHDRAWAL = 'consent_withdrawal',
}

export enum RequestStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

@Table({
  tableName: 'data_requests',
  timestamps: true,
})
export class DataRequest extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: 'The user who made the request',
  })
  userId!: number;

  @BelongsTo(() => User)
  user!: User;

  @Column({
    type: DataType.ENUM,
    values: Object.values(RequestType),
    allowNull: false,
    comment: 'The type of request being made',
  })
  requestType!: RequestType;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: 'Additional details about the request',
  })
  requestDetails?: string;

  @Column({
    type: DataType.ENUM,
    values: Object.values(RequestStatus),
    allowNull: false,
    defaultValue: RequestStatus.PENDING,
    comment: 'The current status of the request',
  })
  status!: RequestStatus;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: 'Reason if request is rejected',
  })
  rejectionReason?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'Reference ID for tracking the request',
  })
  referenceId?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: 'When the request was completed or rejected',
  })
  completionDate?: Date;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'The admin user who processed the request',
  })
  processedBy?: number;

  @BelongsTo(() => User, 'processedBy')
  processedByUser?: User;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    comment: 'IP address where the request originated',
  })
  ipAddress!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'User agent of the client used to make the request',
  })
  userAgent?: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indicates if user has been notified of request status',
  })
  userNotified!: boolean;
}

export default DataRequest; 