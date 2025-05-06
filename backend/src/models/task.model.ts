import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
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

// Task attributes interface
export interface TaskAttributes {
  id: number;
  title: string;
  description: string;
  dueDate: Date;
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  assignedToId: number | null;
  assignedById: number;
  completedAt: Date | null;
  reminderDate: Date | null;
  recurrence: string | null;
  parentTaskId: number | null;
  tags: string[];
  attachments: string[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

// Task creation attributes interface (optional fields for creation)
export interface TaskCreationAttributes extends Optional<TaskAttributes, 'id' | 'status' | 'completedAt' | 'tags' | 'attachments' | 'notes' | 'createdAt' | 'updatedAt'> {}

// Task model class definition
export class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
  public id!: number;
  public title!: string;
  public description!: string;
  public dueDate!: Date;
  public priority!: TaskPriority;
  public status!: TaskStatus;
  public category!: TaskCategory;
  public assignedToId!: number | null;
  public assignedById!: number;
  public completedAt!: Date | null;
  public reminderDate!: Date | null;
  public recurrence!: string | null;
  public parentTaskId!: number | null;
  public tags!: string[];
  public attachments!: string[];
  public notes!: string;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize Task model
Task.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM(...Object.values(TaskPriority)),
      allowNull: false,
      defaultValue: TaskPriority.MEDIUM,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(TaskStatus)),
      allowNull: false,
      defaultValue: TaskStatus.PENDING,
    },
    category: {
      type: DataTypes.ENUM(...Object.values(TaskCategory)),
      allowNull: false,
      defaultValue: TaskCategory.OTHER,
    },
    assignedToId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    assignedById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reminderDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    recurrence: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Cron expression format for recurring tasks',
    },
    parentTaskId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Tasks',
        key: 'id',
      },
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    attachments: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false, 
      defaultValue: [],
      comment: 'Array of file paths or URLs',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
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
    tableName: 'Tasks',
    timestamps: true,
  }
);

// Define the associations
export const associateTask = () => {
  Task.belongsTo(User, { as: 'assignedTo', foreignKey: 'assignedToId' });
  Task.belongsTo(User, { as: 'assignedBy', foreignKey: 'assignedById' });
  Task.belongsTo(Task, { as: 'parentTask', foreignKey: 'parentTaskId' });
  Task.hasMany(Task, { as: 'subtasks', foreignKey: 'parentTaskId' });
};

export default Task; 