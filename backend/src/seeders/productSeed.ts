import { Product, sequelize } from '../models';

/**
 * Product modeli için test verisi oluşturmak için basit bir script
 */
export const seedProductData = async () => {
  try {
    console.log('Starting product seed...');
    
    // Mevcut ürünleri kontrol edelim
    const existingProducts = await Product.findAll();
    
    if (existingProducts.length > 0) {
      console.log(`${existingProducts.length} ürün zaten mevcut. Seed işlemine gerek yok.`);
      return;
    }
    
    // Test ürünleri oluşturalım
    await Product.bulkCreate([
      {
        name: 'Gold Coin 1oz',
        description: '1 ons saf altın sikke',
        sku: 'GC-1OZ',
        price: 2000.00,
        compareAtPrice: 2100.00,
        costPrice: 1900.00,
        categoryId: 1,
        weight: 31.1,
        dimensions: '3.7cm x 0.2cm',
        material: 'Gold 99.9%',
        images: ['https://example.com/images/gold-coin-1oz.jpg'],
        isActive: true,
        isFeatured: true,
        stockQuantity: 50,
        stockAlert: 10
      },
      {
        name: 'Silver Bar 100g',
        description: '100 gram saf gümüş külçe',
        sku: 'SB-100G',
        price: 150.00,
        compareAtPrice: 165.00,
        costPrice: 120.00,
        categoryId: 2,
        weight: 100,
        dimensions: '5.5cm x 2.8cm x 0.5cm',
        material: 'Silver 99.9%',
        images: ['https://example.com/images/silver-bar-100g.jpg'],
        isActive: true,
        isFeatured: false,
        stockQuantity: 100,
        stockAlert: 20
      },
      {
        name: 'Platinum Ring',
        description: 'Platin yüzük, özel tasarım',
        sku: 'PR-001',
        price: 800.00,
        compareAtPrice: 900.00,
        costPrice: 650.00,
        categoryId: 3,
        weight: 10.5,
        dimensions: '1.8cm iç çap',
        material: 'Platinum 95%',
        images: ['https://example.com/images/platinum-ring.jpg'],
        isActive: true,
        isFeatured: true,
        stockQuantity: 25,
        stockAlert: 5
      }
    ]);
    
    console.log('Product seed completed successfully!');
    
  } catch (error) {
    console.error('Error seeding product data:', error);
  }
};

// Bu fonksiyonu doğrudan çağırmak için
if (require.main === module) {
  (async () => {
    try {
      await seedProductData();
      console.log('Seed completed, exiting...');
      process.exit(0);
    } catch (error) {
      console.error('Seed failed:', error);
      process.exit(1);
    }
  })();
} 