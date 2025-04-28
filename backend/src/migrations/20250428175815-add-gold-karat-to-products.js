'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. gold_karat alanını varsayılan değerle ekle
    await queryInterface.addColumn('products', 'gold_karat', {
      type: Sequelize.STRING,
      allowNull: true, // Önce true olarak ekle
      defaultValue: '18K'
    });

    // 2. weight alanını null değil olarak değiştir
    await queryInterface.changeColumn('products', 'weight', {
      type: Sequelize.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0.0
    });
    
    // 3. Tüm tablodaki null gold_karat değerlerini güncelle
    await queryInterface.sequelize.query(`
      UPDATE products SET gold_karat = '18K' WHERE gold_karat IS NULL
    `);
    
    // 4. gold_karat alanını null olmayacak şekilde güncelle
    await queryInterface.changeColumn('products', 'gold_karat', {
      type: Sequelize.STRING,
      allowNull: false
    });

    // 5. Kullanılmayan alanları kaldır
    await queryInterface.removeColumn('products', 'category_id');
    await queryInterface.removeColumn('products', 'description');
    await queryInterface.removeColumn('products', 'dimensions');
    await queryInterface.removeColumn('products', 'material');
    await queryInterface.removeColumn('products', 'images');
  },

  async down(queryInterface, Sequelize) {
    // Geri alma işlemleri
    await queryInterface.addColumn('products', 'category_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    });
    
    await queryInterface.addColumn('products', 'description', {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: ''
    });
    
    await queryInterface.addColumn('products', 'dimensions', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('products', 'material', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('products', 'images', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      defaultValue: []
    });
    
    // Weight alanının yapısını eski haline getir
    await queryInterface.changeColumn('products', 'weight', {
      type: Sequelize.DECIMAL(6, 2),
      allowNull: true
    });
    
    // gold_karat alanını kaldır
    await queryInterface.removeColumn('products', 'gold_karat');
  }
};
