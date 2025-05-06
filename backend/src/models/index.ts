import sequelize from '../config/database';
import { User } from './user.model';
import { Product } from './product.model';

// Register models
const models = [
  User,
  Product,
  // Add more models as they are created
];

// Initialize models with sequelize
sequelize.addModels(models);

// Define relationships between models
export {
  sequelize,
  User,
  Product,
  // Export more models as they are created
};

export default {
  sequelize,
  User,
  Product,
  // Export more models as they are created
}; 