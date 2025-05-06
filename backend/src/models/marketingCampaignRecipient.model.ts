import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Customer } from './customer.model';
import { MarketingCampaign } from './marketingCampaign.model';

export enum RecipientStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BOUNCED = 'bounced'
}

export interface RecipientEngagement {
  opened: boolean;
  openedAt?: Date;
  clicked: boolean;
  clickedAt?: Date;
  responded: boolean;
  respondedAt?: Date;
  converted: boolean;
  convertedAt?: Date;
  unsubscribed: boolean;
  unsubscribedAt?: Date;
}

@Table({
  tableName: 'marketing_campaign_recipients',
  timestamps: true
})
export class MarketingCampaignRecipient extends Model {
  @ForeignKey(() => MarketingCampaign)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  campaignId!: number;

  @BelongsTo(() => MarketingCampaign)
  campaign!: MarketingCampaign;

  @ForeignKey(() => Customer)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  customerId!: number;

  @BelongsTo(() => Customer)
  customer!: Customer;

  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  contactInfo!: string;

  @Column({
    type: DataType.ENUM(...Object.values(RecipientStatus)),
    defaultValue: RecipientStatus.PENDING,
    allowNull: false
  })
  status!: RecipientStatus;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {
      opened: false,
      clicked: false,
      responded: false,
      converted: false,
      unsubscribed: false
    }
  })
  engagement!: RecipientEngagement;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  sentAt?: Date;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  failureReason?: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true
  })
  metadata?: any;
} 