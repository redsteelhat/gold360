import { sequelize } from '../models';

/**
 * Category modeli için test verisi oluşturmak için basit bir script
 */
export const seedCategoryData = async () => {
  try {
    console.log('Starting category seed...');
    
    // Kategoriler için direkt SQL komutu çalıştıralım 
    // (Model dosyası oluşturulmamış olabilir - şu an sistemde görmüyorum)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        slug VARCHAR(100) UNIQUE,
        parent_id INTEGER REFERENCES categories(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Mevcut kategorileri kontrol edelim
    const [existingCategories] = await sequelize.query(
      `SELECT COUNT(*) as count FROM categories`
    );
    
    // Type kontrolü ile beraber
    const count = (existingCategories as any)[0]?.count || 0;
    
    if (count > 0) {
      console.log(`${count} kategori zaten mevcut. Seed işlemine gerek yok.`);
      return;
    }
    
    // Test kategorileri oluşturalım
    await sequelize.query(`
      INSERT INTO categories (name, description, slug, is_active) VALUES
      ('Altın', 'Altın ürünleri', 'altin', true),
      ('Gümüş', 'Gümüş ürünleri', 'gumus', true),
      ('Takı', 'Takı ürünleri', 'taki', true);
    `);
    
    console.log('Category seed completed successfully!');
    
  } catch (error) {
    console.error('Error seeding category data:', error);
  }
};

// Bu fonksiyonu doğrudan çağırmak için
if (require.main === module) {
  (async () => {
    try {
      await seedCategoryData();
      console.log('Seed completed, exiting...');
      process.exit(0);
    } catch (error) {
      console.error('Seed failed:', error);
      process.exit(1);
    }
  })();
} 