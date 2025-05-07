import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { User } from './user.model';

// Task priority levels
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Task status options
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  BLOCKED = 'blocked',
}

// Task categories
export enum TaskCategory {
  INVENTORY = 'inventory',
  SALES = 'sales',
  CUSTOMER = 'customer',
  MARKETING = 'marketing',
  ADMINISTRATIVE = 'administrative',
  FINANCE = 'finance',
  OTHER = 'other'
}

@Table({
  tableName: 'tasks',
  timestamps: true,
  underscored: true
})
export class Task extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true
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
  description!: string;

  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  dueDate!: Date;

  @Column({
    type: DataType.ENUM(...Object.values(TaskPriority)),
    allowNull: false,
    defaultValue: TaskPriority.MEDIUM
  })
  priority!: TaskPriority;

  @Column({
    type: DataType.ENUM(...Object.values(TaskStatus)),
    allowNull: false,
    defaultValue: TaskStatus.PENDING
  })
  status!: TaskStatus;

  @Column({
    type: DataType.ENUM(...Object.values(TaskCategory)),
    allowNull: false,
    defaultValue: TaskCategory.OTHER
  })
  category!: TaskCategory;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  assignedToId!: number | null;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  assignedById!: number;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  completedAt!: Date | null;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  reminderDate!: Date | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'Cron expression format for recurring tasks'
  })
  recurrence!: string | null;

  @ForeignKey(() => Task)
  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  parentTaskId!: number | null;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: false,
    defaultValue: []
  })
  tags!: string[];

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: false,
    defaultValue: [],
    comment: 'Array of file paths or URLs'
  })
  attachments!: string[];

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    defaultValue: ''
  })
  notes!: string;

  @BelongsTo(() => User, 'assignedToId')
  assignedTo!: User;

  @BelongsTo(() => User, 'assignedById')
  assignedBy!: User;

  @BelongsTo(() => Task, 'parentTaskId')
  parentTask!: Task;

  @HasMany(() => Task, 'parentTaskId')
  subtasks!: Task[];
}

export default Task; 