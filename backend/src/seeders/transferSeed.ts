import { StockTransfer, TransferItem, Warehouse, Product, User, sequelize } from '../models';

/**
 * StockTransfer ve TransferItem modülleri için test verisi oluşturmak için basit bir script
 */
export const seedTransferData = async () => {
  try {
    console.log('Starting transfer seed...');
    
    // 1. Öncelikle mevcut verileri temizleyelim
    await TransferItem.destroy({ where: {} });
    await StockTransfer.destroy({ where: {} });
    
    // 2. Test verileri için ihtiyaç duyduğumuz mevcut kayıtları kontrol edelim
    const warehouses = await Warehouse.findAll();
    if (warehouses.length < 2) {
      console.log('Creating warehouse test data...');
      await Warehouse.bulkCreate([
        {
          name: 'Ana Depo',
          location: 'İstanbul',
          address: 'Atatürk Cad. No:1, Şişli',
          capacity: 5000,
          isActive: true,
          contactPerson: 'Ahmet Yılmaz',
          contactPhone: '5551234567'
        },
        {
          name: 'Şube Depo',
          location: 'Ankara',
          address: 'Cumhuriyet Cad. No:42, Çankaya',
          capacity: 3000,
          isActive: true,
          contactPerson: 'Ayşe Kaya',
          contactPhone: '5559876543'
        }
      ]);
    }
    
    const products = await Product.findAll();
    if (products.length < 2) {
      console.log('Need products in the database to continue. Seed skipped.');
      return;
    }
    
    const users = await User.findAll();
    if (users.length === 0) {
      console.log('Need users in the database to continue. Seed skipped.');
      return;
    }
    
    // Tekrar gerekli verileri alalım
    const allWarehouses = await Warehouse.findAll();
    const allProducts = await Product.findAll();
    const allUsers = await User.findAll();
    
    // 3. StockTransfer oluşturalım
    console.log('Creating stock transfers...');
    
    // Referans numarası oluştur
    const createReferenceNumber = (index: number) => {
      const date = new Date();
      const year = date.getFullYear().toString().substr(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `TRF-${year}${month}-${(index + 1).toString().padStart(4, '0')}`;
    };
    
    const transfer1 = await StockTransfer.create({
      sourceWarehouseId: allWarehouses[0].id,
      destinationWarehouseId: allWarehouses[1].id,
      status: 'PENDING',
      initiatedDate: new Date(),
      referenceNumber: createReferenceNumber(0),
      shippingMethod: 'Kargo',
      trackingNumber: 'TRK123456',
      estimatedArrival: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 gün sonra
      notes: 'Test transfer 1',
      initiatedById: allUsers[0].id
    });
    
    const transfer2 = await StockTransfer.create({
      sourceWarehouseId: allWarehouses[1].id,
      destinationWarehouseId: allWarehouses[0].id,
      status: 'IN_TRANSIT',
      initiatedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 gün önce
      referenceNumber: createReferenceNumber(1),
      shippingMethod: 'Kargo',
      trackingNumber: 'TRK654321',
      estimatedArrival: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 gün sonra
      notes: 'Test transfer 2',
      initiatedById: allUsers[0].id
    });
    
    // 4. TransferItem oluşturalım
    console.log('Creating transfer items...');
    
    // Transfer 1 kalemleri
    await TransferItem.create({
      transferId: transfer1.id,
      productId: allProducts[0].id,
      quantity: 10,
      unitCost: allProducts[0].price * 0.8, // Maliyet fiyatı olarak satış fiyatının %80'i
      status: 'pending'
    });
    
    await TransferItem.create({
      transferId: transfer1.id,
      productId: allProducts[1].id,
      quantity: 5,
      unitCost: allProducts[1].price * 0.8,
      status: 'pending'
    });
    
    // Transfer 2 kalemleri
    await TransferItem.create({
      transferId: transfer2.id,
      productId: allProducts[0].id,
      quantity: 3,
      unitCost: allProducts[0].price * 0.8,
      status: 'in_transit'
    });
    
    await TransferItem.create({
      transferId: transfer2.id,
      productId: allProducts[1].id,
      quantity: 7,
      unitCost: allProducts[1].price * 0.8,
      status: 'in_transit'
    });
    
    console.log('Transfer seed completed successfully!');
    
  } catch (error) {
    console.error('Error seeding transfer data:', error);
  }
};

// Bu fonksiyonu doğrudan çağırmak için
if (require.main === module) {
  (async () => {
    try {
      await seedTransferData();
      console.log('Seed completed, exiting...');
      process.exit(0);
    } catch (error) {
      console.error('Seed failed:', error);
      process.exit(1);
    }
  })();
} 