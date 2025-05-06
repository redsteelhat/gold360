import { Table, Column, Model, DataType, BeforeCreate, BeforeUpdate } from 'sequelize-typescript';
import bcrypt from 'bcryptjs';

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff',
  CUSTOMER = 'customer',
}

@Table({
  tableName: 'users',
  timestamps: true,
})
export class User extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  email!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  firstName!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  lastName!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  password!: string;

  @Column({
    type: DataType.ENUM,
    values: Object.values(UserRole),
    defaultValue: UserRole.CUSTOMER,
    allowNull: false,
  })
  role!: UserRole;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  phone?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  profileImage?: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  })
  isActive!: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  lastLogin?: Date;

  // Exclude password from default JSON response
  toJSON() {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
  }

  // Hash password before create
  @BeforeCreate
  static async hashPasswordBeforeCreate(instance: User) {
    if (instance.password) {
      instance.password = await bcrypt.hash(instance.password, 10);
    }
  }

  // Hash password before update
  @BeforeUpdate
  static async hashPasswordBeforeUpdate(instance: User) {
    if (instance.changed('password')) {
      instance.password = await bcrypt.hash(instance.password, 10);
    }
  }

  // Method to check if password is valid
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  // Helper to get full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
} 