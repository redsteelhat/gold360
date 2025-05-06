import { Request, Response } from 'express';
import { Product, ProductStatus } from '../models/product.model';
import { Op } from 'sequelize';
import { User } from '../models/user.model';

/**
 * Get all products with pagination and filtering
 */
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      category,
      status,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const offset = (pageNumber - 1) * limitNumber;

    // Build where clause with filters
    const whereClause: any = {};

    // Add search filter
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Add category filter
    if (category) {
      whereClause.category = category;
    }

    // Add status filter
    if (status) {
      whereClause.status = status;
    }

    // Add price range filters
    if (minPrice) {
      whereClause.price = { ...whereClause.price, [Op.gte]: parseFloat(minPrice as string) };
    }

    if (maxPrice) {
      whereClause.price = { 
        ...whereClause.price, 
        [Op.lte]: parseFloat(maxPrice as string) 
      };
    }

    // Get products with pagination
    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      limit: limitNumber,
      offset,
      order: [[sortBy as string, sortOrder as string]],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    // Calculate pagination details
    const totalPages = Math.ceil(count / limitNumber);
    const hasNext = pageNumber < totalPages;
    const hasPrev = pageNumber > 1;

    res.status(200).json({
      message: 'Products retrieved successfully',
      data: {
        products,
        pagination: {
          total: count,
          page: pageNumber,
          limit: limitNumber,
          totalPages,
          hasNext,
          hasPrev,
        },
      },
    });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({ message: 'Failed to get products', error: (error as Error).message });
  }
};

/**
 * Get a single product by ID
 */
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.status(200).json({
      message: 'Product retrieved successfully',
      data: product,
    });
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({ message: 'Failed to get product', error: (error as Error).message });
  }
};

/**
 * Create a new product
 */
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      description,
      price,
      salePrice,
      stockQuantity,
      sku,
      barcode,
      category,
      tags,
      images,
      status,
      taxRate,
      isVisible,
      isFeatured,
      metadata,
      weight,
      length,
      width,
      height,
    } = req.body;

    // Check if SKU is already in use
    const existingProduct = await Product.findOne({ where: { sku } });
    if (existingProduct) {
      res.status(400).json({ message: 'A product with this SKU already exists' });
      return;
    }

    // Create the product
    const newProduct = await Product.create({
      name,
      description,
      price,
      salePrice,
      stockQuantity,
      sku,
      barcode,
      category,
      tags,
      images,
      status: status || ProductStatus.DRAFT,
      taxRate,
      isVisible: isVisible !== undefined ? isVisible : true,
      isFeatured: isFeatured !== undefined ? isFeatured : false,
      metadata,
      weight,
      length,
      width,
      height,
      createdBy: req.user?.id,
    });

    res.status(201).json({
      message: 'Product created successfully',
      data: newProduct,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Failed to create product', error: (error as Error).message });
  }
};

/**
 * Update an existing product
 */
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      salePrice,
      stockQuantity,
      sku,
      barcode,
      category,
      tags,
      images,
      status,
      taxRate,
      isVisible,
      isFeatured,
      metadata,
      weight,
      length,
      width,
      height,
    } = req.body;

    // Find the product
    const product = await Product.findByPk(id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // Check if the updated SKU is already in use by another product
    if (sku && sku !== product.sku) {
      const existingProduct = await Product.findOne({ where: { sku } });
      if (existingProduct && existingProduct.id !== parseInt(id, 10)) {
        res.status(400).json({ message: 'A product with this SKU already exists' });
        return;
      }
    }

    // Update the product
    await product.update({
      name,
      description,
      price,
      salePrice,
      stockQuantity,
      sku,
      barcode,
      category,
      tags,
      images,
      status,
      taxRate,
      isVisible,
      isFeatured,
      metadata,
      weight,
      length,
      width,
      height,
    });

    res.status(200).json({
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Failed to update product', error: (error as Error).message });
  }
};

/**
 * Delete a product
 */
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Find the product
    const product = await Product.findByPk(id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // Delete the product
    await product.destroy();

    res.status(200).json({
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Failed to delete product', error: (error as Error).message });
  }
};

/**
 * Update product stock
 */
export const updateProductStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { stockQuantity } = req.body;

    // Find the product
    const product = await Product.findByPk(id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // Update stock quantity
    await product.update({ stockQuantity });

    // Update status if needed
    if (stockQuantity === 0 && product.status === ProductStatus.ACTIVE) {
      await product.update({ status: ProductStatus.SOLD_OUT });
    } else if (stockQuantity > 0 && product.status === ProductStatus.SOLD_OUT) {
      await product.update({ status: ProductStatus.ACTIVE });
    }

    res.status(200).json({
      message: 'Product stock updated successfully',
      data: product,
    });
  } catch (error) {
    console.error('Error updating product stock:', error);
    res.status(500).json({ message: 'Failed to update product stock', error: (error as Error).message });
  }
}; 