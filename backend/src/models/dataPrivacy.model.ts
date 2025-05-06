import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user.model';

export enum ConsentType {
  MARKETING = 'marketing',
  ANALYTICS = 'analytics',
  ESSENTIAL = 'essential',
  THIRD_PARTY = 'third_party',
  DATA_PROCESSING = 'data_processing',
  PROFILE_SHARING = 'profile_sharing',
}

export enum LegalBasis {
  CONSENT = 'consent',
  CONTRACT = 'contract',
  LEGAL_OBLIGATION = 'legal_obligation',
  VITAL_INTEREST = 'vital_interest',
  PUBLIC_INTEREST = 'public_interest',
  LEGITIMATE_INTEREST = 'legitimate_interest',
}

@Table({
  tableName: 'data_privacy',
  timestamps: true,
})
export class DataPrivacy extends Model {
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
  })
  userId!: number;

  @BelongsTo(() => User)
  user!: User;

  @Column({
    type: DataType.ENUM,
    values: Object.values(ConsentType),
    allowNull: false,
  })
  consentType!: ConsentType;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  hasConsented!: boolean;

  @Column({
    type: DataType.ENUM,
    values: Object.values(LegalBasis),
    allowNull: false,
    defaultValue: LegalBasis.CONSENT,
  })
  legalBasis!: LegalBasis;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  consentDate!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  consentWithdrawnDate?: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  consentVersion?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  consentDetails?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  ipAddress?: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isActive!: boolean;
}

export default DataPrivacy; 