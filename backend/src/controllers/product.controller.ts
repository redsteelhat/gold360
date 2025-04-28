import { Request, Response } from 'express';
import Product from '../models/Product';
import { Op } from 'sequelize';

// Get all products
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const { search, status } = req.query;
    
    let whereClause: any = {};
    
    // Filter by status
    if (status && (status === 'active' || status === 'inactive')) {
      whereClause.isActive = status === 'active';
    }
    
    // Search by name or SKU
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    const products = await Product.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });
    
    // Transform to frontend expected format
    const transformedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      costPrice: product.costPrice,
      stockQuantity: product.stockQuantity,
      status: product.isActive ? 'active' : 'inactive',
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      // Add additional fields
      weight: product.weight,
      goldKarat: product.goldKarat,
      isFeatured: product.isFeatured,
      stockAlert: product.stockAlert,
      compareAtPrice: product.compareAtPrice
    }));
    
    res.status(200).json(transformedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// Get product by ID
export const getProductById = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    
    const product = await Product.findByPk(productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Transform to frontend expected format
    const transformedProduct = {
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      costPrice: product.costPrice,
      stockQuantity: product.stockQuantity,
      status: product.isActive ? 'active' : 'inactive',
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      // Additional fields
      weight: product.weight,
      goldKarat: product.goldKarat,
      isFeatured: product.isFeatured,
      stockAlert: product.stockAlert,
      compareAtPrice: product.compareAtPrice
    };
    
    res.status(200).json(transformedProduct);
  } catch (error) {
    console.error(`Error fetching product ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

// Create new product
export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      name,
      sku,
      price,
      costPrice,
      weight,
      goldKarat,
      isActive,
      isFeatured,
      stockQuantity,
      stockAlert,
      compareAtPrice,
      status
    } = req.body;
    
    // Validate required fields
    if (!name || !sku || price === undefined || costPrice === undefined || !weight || !goldKarat) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if SKU already exists
    const existingProduct = await Product.findOne({ where: { sku } });
    if (existingProduct) {
      return res.status(400).json({ error: 'A product with this SKU already exists' });
    }
    
    // Create product
    const product = await Product.create({
      name,
      sku,
      price,
      costPrice,
      weight,
      goldKarat,
      isActive: isActive !== undefined ? isActive : true,
      isFeatured: isFeatured || false,
      stockQuantity: stockQuantity || 0,
      stockAlert: stockAlert || 5,
      compareAtPrice: compareAtPrice || null,
      status: status || 'active'
    });
    
    // Transform to frontend expected format
    const transformedProduct = {
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      costPrice: product.costPrice,
      stockQuantity: product.stockQuantity,
      status: product.isActive ? 'active' : 'inactive',
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      // Additional fields
      weight: product.weight,
      goldKarat: product.goldKarat,
      isFeatured: product.isFeatured,
      stockAlert: product.stockAlert,
      compareAtPrice: product.compareAtPrice
    };
    
    res.status(201).json(transformedProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

// Update product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    
    const product = await Product.findByPk(productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const {
      name,
      sku,
      price,
      costPrice,
      weight,
      goldKarat,
      isActive,
      isFeatured,
      stockQuantity,
      stockAlert,
      compareAtPrice,
      status
    } = req.body;
    
    // Check if SKU already exists and belongs to another product
    if (sku && sku !== product.sku) {
      const existingProduct = await Product.findOne({ where: { sku } });
      if (existingProduct && existingProduct.id !== productId) {
        return res.status(400).json({ error: 'A product with this SKU already exists' });
      }
    }
    
    // Update product
    await product.update({
      name: name !== undefined ? name : product.name,
      sku: sku !== undefined ? sku : product.sku,
      price: price !== undefined ? price : product.price,
      costPrice: costPrice !== undefined ? costPrice : product.costPrice,
      weight: weight !== undefined ? weight : product.weight,
      goldKarat: goldKarat !== undefined ? goldKarat : product.goldKarat,
      isActive: isActive !== undefined ? isActive : product.isActive,
      isFeatured: isFeatured !== undefined ? isFeatured : product.isFeatured,
      stockQuantity: stockQuantity !== undefined ? stockQuantity : product.stockQuantity,
      stockAlert: stockAlert !== undefined ? stockAlert : product.stockAlert,
      compareAtPrice: compareAtPrice !== undefined ? compareAtPrice : product.compareAtPrice,
      status: status !== undefined ? status : product.status
    });
    
    // Transform to frontend expected format
    const updatedProduct = {
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      costPrice: product.costPrice,
      stockQuantity: product.stockQuantity,
      status: product.isActive ? 'active' : 'inactive',
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      // Additional fields
      weight: product.weight,
      goldKarat: product.goldKarat,
      isFeatured: product.isFeatured,
      stockAlert: product.stockAlert,
      compareAtPrice: product.compareAtPrice
    };
    
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error(`Error updating product ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// Delete product
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    
    const product = await Product.findByPk(productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    try {
      // Önce hard delete denemesi
      await product.destroy();
      
      res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error: any) {
      // Eğer foreign key constraint hatası alınırsa, soft delete uygula
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        await product.update({ isActive: false });
        
        res.status(200).json({ 
          message: 'Product has been deactivated. It could not be permanently deleted because it is referenced in other records.',
          softDelete: true
        });
      } else {
        // Başka bir hata varsa yeniden throw et
        throw error;
      }
    }
  } catch (error) {
    console.error(`Error deleting product ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

// Update product stock
export const updateProductStock = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    const { quantity } = req.body;
    
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    
    if (quantity === undefined || isNaN(Number(quantity))) {
      return res.status(400).json({ error: 'Invalid quantity value' });
    }
    
    const product = await Product.findByPk(productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Update stock quantity
    await product.update({ stockQuantity: Number(quantity) });
    
    // Transform to frontend expected format
    const updatedProduct = {
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      costPrice: product.costPrice,
      stockQuantity: product.stockQuantity,
      status: product.isActive ? 'active' : 'inactive',
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      // Additional fields
      weight: product.weight,
      goldKarat: product.goldKarat,
      isFeatured: product.isFeatured,
      stockAlert: product.stockAlert,
      compareAtPrice: product.compareAtPrice
    };
    
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error(`Error updating product stock for ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update product stock' });
  }
};

// Get featured products
export const getFeaturedProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.findAll({
      where: { 
        isFeatured: true,
        isActive: true 
      },
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    // Transform to frontend expected format
    const transformedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      costPrice: product.costPrice,
      stockQuantity: product.stockQuantity,
      status: product.isActive ? 'active' : 'inactive',
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      // Additional fields
      weight: product.weight,
      goldKarat: product.goldKarat,
      isFeatured: product.isFeatured,
      stockAlert: product.stockAlert,
      compareAtPrice: product.compareAtPrice
    }));
    
    res.status(200).json(transformedProducts);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
};

// Get low stock products
export const getLowStockProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.findAll({
      where: {
        stockQuantity: {
          [Op.lte]: Product.sequelize!.literal('"stockAlert"')
        },
        isActive: true
      },
      order: [['stockQuantity', 'ASC']]
    });
    
    // Transform to frontend expected format
    const transformedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      costPrice: product.costPrice,
      stockQuantity: product.stockQuantity,
      status: product.isActive ? 'active' : 'inactive',
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      // Additional fields
      weight: product.weight,
      goldKarat: product.goldKarat,
      isFeatured: product.isFeatured,
      stockAlert: product.stockAlert,
      compareAtPrice: product.compareAtPrice
    }));
    
    res.status(200).json(transformedProducts);
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    res.status(500).json({ error: 'Failed to fetch low stock products' });
  }
};
