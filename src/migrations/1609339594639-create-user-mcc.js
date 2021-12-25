module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('UserMerchantCategoryCodes', {
      id: {
        type: Sequelize.INTEGER,
        unique: true,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      categoryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Categories',
          key: 'id',
          as: 'categoryId',
        },
      },
      mccId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'MerchantCategoryCodes',
          key: 'id',
          as: 'mccId',
        },
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
          as: 'userId',
        },
      },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('UserMerchantCategoryCodes');
  },
};
