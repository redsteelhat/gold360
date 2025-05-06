import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user.model';

export enum AccessType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
}

@Table({
  tableName: 'data_access_logs',
  timestamps: true,
})
export class DataAccessLog extends Model {
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
    comment: 'The user who accessed the data',
  })
  accessedBy!: number;

  @BelongsTo(() => User, 'accessedBy')
  accessedByUser!: User;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'The user whose data was accessed (can be null for system actions)',
  })
  dataSubjectId?: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    comment: 'The entity type that was accessed (e.g., user, customer, order)',
  })
  entityType!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'The id of the entity that was accessed',
  })
  entityId?: number;

  @Column({
    type: DataType.ENUM,
    values: Object.values(AccessType),
    allowNull: false,
    comment: 'The type of access performed',
  })
  accessType!: AccessType;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: 'Description of what data was accessed',
  })
  accessDetails?: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    comment: 'IP address of the user who accessed the data',
  })
  ipAddress!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'User agent of the client used to access the data',
  })
  userAgent?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'Purpose of the data access (e.g., customer support, administration)',
  })
  accessPurpose?: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether the access was successful',
  })
  wasSuccessful!: boolean;
}

export default DataAccessLog; 