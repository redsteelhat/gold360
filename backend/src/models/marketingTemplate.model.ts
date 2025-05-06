import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user.model';

export enum TemplateType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH_NOTIFICATION = 'push_notification',
  WHATSAPP = 'whatsapp',
  SOCIAL_MEDIA = 'social_media'
}

export enum TemplateCategory {
  PROMOTIONAL = 'promotional',
  TRANSACTIONAL = 'transactional',
  NEWSLETTER = 'newsletter',
  ANNOUNCEMENT = 'announcement',
  WELCOME = 'welcome',
  REMINDER = 'reminder',
  ABANDONED_CART = 'abandoned_cart',
  EVENT = 'event',
  HOLIDAY = 'holiday',
  OTHER = 'other'
}

@Table({
  tableName: 'marketing_templates',
  timestamps: true,
  paranoid: true
})
export class MarketingTemplate extends Model {
  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  name!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  description?: string;

  @Column({
    type: DataType.ENUM(...Object.values(TemplateType)),
    allowNull: false
  })
  type!: TemplateType;

  @Column({
    type: DataType.ENUM(...Object.values(TemplateCategory)),
    allowNull: false,
    defaultValue: TemplateCategory.OTHER
  })
  category!: TemplateCategory;

  @Column({
    type: DataType.TEXT,
    allowNull: false
  })
  content!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  subject?: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: []
  })
  variables?: string[];

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: []
  })
  attachments?: string[];

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: []
  })
  imageUrls?: string[];

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  createdById!: number;

  @BelongsTo(() => User, 'createdById')
  createdBy!: User;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
    allowNull: false
  })
  active!: boolean;

  @Column({
    type: DataType.JSONB,
    allowNull: true
  })
  metadata?: any;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: []
  })
  tags?: string[];
} 