import { User, sequelize } from '../models';

/**
 * User modeli için test verisi oluşturmak için basit bir script
 */
export const seedUserData = async () => {
  try {
    console.log('Starting user seed...');
    
    // Mevcut kullanıcıları kontrol edelim
    const existingUsers = await User.findAll();
    
    if (existingUsers.length > 0) {
      console.log(`${existingUsers.length} kullanıcı zaten mevcut. Seed işlemine gerek yok.`);
      return;
    }
    
    // Test kullanıcıları oluşturalım
    await User.bulkCreate([
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123', // otomatik hash edilecek
        role: 'admin',
        isActive: true
      },
      {
        name: 'Staff User',
        email: 'staff@example.com',
        password: 'password123', // otomatik hash edilecek
        role: 'staff',
        isActive: true
      },
      {
        name: 'Customer User',
        email: 'customer@example.com',
        password: 'password123', // otomatik hash edilecek
        role: 'customer',
        isActive: true
      }
    ]);
    
    console.log('User seed completed successfully!');
    
  } catch (error) {
    console.error('Error seeding user data:', error);
  }
};

// Bu fonksiyonu doğrudan çağırmak için
if (require.main === module) {
  (async () => {
    try {
      await seedUserData();
      console.log('Seed completed, exiting...');
      process.exit(0);
    } catch (error) {
      console.error('Seed failed:', error);
      process.exit(1);
    }
  })();
} 