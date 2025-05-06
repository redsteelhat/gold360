import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user.model';

export enum SocialMediaPlatform {
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  TWITTER = 'twitter',
  LINKEDIN = 'linkedin',
  YOUTUBE = 'youtube',
  PINTEREST = 'pinterest',
  TIKTOK = 'tiktok',
  OTHER = 'other'
}

export interface SocialMediaMetrics {
  followers: number;
  engagement: number;
  impressions: number;
  clicks: number;
  lastUpdated?: Date;
}

@Table({
  tableName: 'social_media_accounts',
  timestamps: true,
  paranoid: true
})
export class SocialMediaAccount extends Model {
  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  name!: string;

  @Column({
    type: DataType.ENUM(...Object.values(SocialMediaPlatform)),
    allowNull: false
  })
  platform!: SocialMediaPlatform;

  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  accountId!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  accountUsername!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  profileUrl?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  accessToken?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  refreshToken?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  tokenExpiresAt?: Date;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: { followers: 0, engagement: 0, impressions: 0, clicks: 0 }
  })
  metrics?: SocialMediaMetrics;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
    allowNull: false
  })
  active!: boolean;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  createdById!: number;

  @BelongsTo(() => User, 'createdById')
  createdBy!: User;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  lastUpdatedById?: number;

  @BelongsTo(() => User, 'lastUpdatedById')
  lastUpdatedBy?: User;

  @Column({
    type: DataType.JSONB,
    allowNull: true
  })
  settings?: any;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  notes?: string;
} 