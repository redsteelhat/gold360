import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user.model';

export enum CampaignType {
  EMAIL = 'email',
  SMS = 'sms',
  SOCIAL_MEDIA = 'social_media',
  PUSH_NOTIFICATION = 'push_notification',
  WHATSAPP = 'whatsapp',
  OTHER = 'other'
}

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface CampaignContent {
  subject?: string;
  body: string;
  imageUrls?: string[];
  attachmentUrls?: string[];
  templateId?: string;
}

export interface CampaignPerformanceMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  responded: number;
  converted: number;
  bounced: number;
  unsubscribed: number;
  complaints: number;
}

export interface CampaignBudget {
  planned: number;
  spent: number;
  currency: string;
}

export interface AudienceSegment {
  name: string;
  criteria: any;
  estimatedSize: number;
}

@Table({
  tableName: 'marketing_campaigns',
  timestamps: true,
  paranoid: true
})
export class MarketingCampaign extends Model {
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
    type: DataType.ENUM(...Object.values(CampaignType)),
    allowNull: false
  })
  type!: CampaignType;

  @Column({
    type: DataType.ENUM(...Object.values(CampaignStatus)),
    defaultValue: CampaignStatus.DRAFT,
    allowNull: false
  })
  status!: CampaignStatus;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  startDate?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  endDate?: Date;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: []
  })
  audienceSegments?: AudienceSegment[];

  @Column({
    type: DataType.JSONB,
    allowNull: false
  })
  content!: CampaignContent;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: { planned: 0, spent: 0, currency: 'TRY' }
  })
  budget?: CampaignBudget;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      responded: 0,
      converted: 0,
      bounced: 0,
      unsubscribed: 0,
      complaints: 0
    }
  })
  performanceMetrics?: CampaignPerformanceMetrics;

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
    defaultValue: false,
    allowNull: false
  })
  isAutomated!: boolean;

  @Column({
    type: DataType.JSONB,
    allowNull: true
  })
  automationTriggers?: any;

  @Column({
    type: DataType.JSONB,
    allowNull: true
  })
  tags?: string[];

  // We'll define this relationship after MarketingCampaignRecipient is created
  // @HasMany(() => MarketingCampaignRecipient)
  // recipients!: MarketingCampaignRecipient[];
} 