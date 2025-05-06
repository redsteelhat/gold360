import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database configuration
const dbName = process.env.DB_NAME || 'gold360_db';
const dbUser = process.env.DB_USER || 'gold360_user';
const dbPassword = process.env.DB_PASSWORD || 'gold360pass';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '5432', 10);

// Create Sequelize instance
const sequelize = new Sequelize({
  database: dbName,
  username: dbUser,
  password: dbPassword,
  host: dbHost,
  port: dbPort,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 20,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
  },
});

// Connect to the database
export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Sync all models
    if (process.env.NODE_ENV === 'development') {
      // In development, you might want to recreate tables
      // await sequelize.sync({ force: true });
      
      // Or just update tables based on models
      await sequelize.sync({ alter: true });
      console.log('All models were synchronized successfully.');
    } else {
      // In production, only sync (no force/alter)
      await sequelize.sync();
      console.log('Database synchronized.');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

export default sequelize; 