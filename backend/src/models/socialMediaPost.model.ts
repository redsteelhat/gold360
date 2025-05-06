import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user.model';
import { SocialMediaAccount, SocialMediaPlatform } from './socialMediaAccount.model';
import { MarketingCampaign } from './marketingCampaign.model';

export enum PostStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  FAILED = 'failed',
  DELETED = 'deleted'
}

export interface PostEngagementMetrics {
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  impressions: number;
  reach: number;
  lastUpdated?: Date;
}

@Table({
  tableName: 'social_media_posts',
  timestamps: true,
  paranoid: true
})
export class SocialMediaPost extends Model {
  @Column({
    type: DataType.TEXT,
    allowNull: false
  })
  content!: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: []
  })
  mediaUrls?: string[];

  @ForeignKey(() => SocialMediaAccount)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  socialMediaAccountId!: number;

  @BelongsTo(() => SocialMediaAccount)
  socialMediaAccount!: SocialMediaAccount;

  @Column({
    type: DataType.ENUM(...Object.values(SocialMediaPlatform)),
    allowNull: false
  })
  platform!: SocialMediaPlatform;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  scheduledFor?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  publishedAt?: Date;

  @Column({
    type: DataType.ENUM(...Object.values(PostStatus)),
    defaultValue: PostStatus.DRAFT,
    allowNull: false
  })
  status!: PostStatus;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  postId?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  postUrl?: string;

  @ForeignKey(() => MarketingCampaign)
  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  campaignId?: number;

  @BelongsTo(() => MarketingCampaign)
  campaign?: MarketingCampaign;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: {
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      clicks: 0,
      impressions: 0,
      reach: 0
    }
  })
  engagementMetrics?: PostEngagementMetrics;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  createdById!: number;

  @BelongsTo(() => User, 'createdById')
  createdBy!: User;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  failureReason?: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true
  })
  tags?: string[];

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false
  })
  isRepost!: boolean;

  @ForeignKey(() => SocialMediaPost)
  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  originalPostId?: number;

  @BelongsTo(() => SocialMediaPost, 'originalPostId')
  originalPost?: SocialMediaPost;
} 