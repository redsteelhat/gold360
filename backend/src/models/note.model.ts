import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
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

// Note attributes interface
export interface NoteAttributes {
  id: number;
  title: string;
  content: string;
  createdById: number;
  targetType: NoteTargetType;
  targetId: number | null;
  isPinned: boolean;
  color: string | null;
  visibility: NoteVisibility;
  priority: NotePriority;
  tags: string[];
  reminderDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Optional fields for creation
export interface NoteCreationAttributes extends Optional<NoteAttributes, 'id' | 'isPinned' | 'color' | 'tags' | 'reminderDate' | 'createdAt' | 'updatedAt'> {}

// Note model class
export class Note extends Model<NoteAttributes, NoteCreationAttributes> implements NoteAttributes {
  public id!: number;
  public title!: string;
  public content!: string;
  public createdById!: number;
  public targetType!: NoteTargetType;
  public targetId!: number | null;
  public isPinned!: boolean;
  public color!: string | null;
  public visibility!: NoteVisibility;
  public priority!: NotePriority;
  public tags!: string[];
  public reminderDate!: Date | null;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize Note model
Note.init(
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
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    createdById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    targetType: {
      type: DataTypes.ENUM(...Object.values(NoteTargetType)),
      allowNull: false,
    },
    targetId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID of the target entity (customer, product, etc.)',
    },
    isPinned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    color: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'HEX color code or color name',
    },
    visibility: {
      type: DataTypes.ENUM(...Object.values(NoteVisibility)),
      allowNull: false,
      defaultValue: NoteVisibility.PRIVATE,
    },
    priority: {
      type: DataTypes.ENUM(...Object.values(NotePriority)),
      allowNull: false,
      defaultValue: NotePriority.NORMAL,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    reminderDate: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: 'Notes',
    timestamps: true,
  }
);

// Define associations
export const associateNote = () => {
  Note.belongsTo(User, { as: 'createdBy', foreignKey: 'createdById' });
};

export default Note; 