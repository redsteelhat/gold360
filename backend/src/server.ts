import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { sequelize } from './config/database';
import routes from './routes';
import swaggerDocs from './config/swagger';

// Load environment variables
dotenv.config();

// Create Express server
const app = express();
const port = parseInt(process.env.PORT || '3001');

// Middleware
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false })); // Disable CSP for Swagger UI
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Setup Swagger Documentation
swaggerDocs(app, port);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
    },
  });
});

// Start server
const startServer = async () => {
  try {
    // Sync database models
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('Database synchronized successfully');

    // Start Express server
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`Swagger documentation available at http://localhost:${port}/api-docs`);
    });
  } catch (error) {
    console.error('Unable to start the server:', error);
    process.exit(1);
  }
};

startServer(); 