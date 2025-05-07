import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user.model';

// Note target types enum
export enum NoteTargetType {
  CUSTOMER = 'customer',
  PRODUCT = 'product',
  ORDER = 'order',
  USER = 'user',
  TASK = 'task',
  INVENTORY = 'inventory',
  GENERAL = 'general'
}

// Note visibility enum
export enum NoteVisibility {
  PRIVATE = 'private',    // Only creator can see
  TEAM = 'team',          // Team members can see
  MANAGEMENT = 'management', // Management level and above
  ALL = 'all'             // All employees can see
}

// Note priority enum
export enum NotePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high'
}

@Table({
  tableName: 'notes',
  timestamps: true,
  underscored: true
})
export class Note extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false
  })
  title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false
  })
  content!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  createdById!: number;

  @Column({
    type: DataType.ENUM(...Object.values(NoteTargetType)),
    allowNull: false
  })
  targetType!: NoteTargetType;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'ID of the target entity (customer, product, etc.)'
  })
  targetId!: number | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false
  })
  isPinned!: boolean;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    comment: 'HEX color code or color name'
  })
  color!: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(NoteVisibility)),
    allowNull: false,
    defaultValue: NoteVisibility.PRIVATE
  })
  visibility!: NoteVisibility;

  @Column({
    type: DataType.ENUM(...Object.values(NotePriority)),
    allowNull: false,
    defaultValue: NotePriority.NORMAL
  })
  priority!: NotePriority;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: false,
    defaultValue: []
  })
  tags!: string[];

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  reminderDate!: Date | null;

  @BelongsTo(() => User, 'createdById')
  createdBy!: User;
}

export default Note; 