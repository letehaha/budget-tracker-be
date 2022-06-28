import { QueryInterface } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(
      async (transaction) => {
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
            },
          },
          mccId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'MerchantCategoryCodes',
              key: 'id',
            },
          },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'Users',
              key: 'id',
            },
          },
        }, { transaction });
      }
    )
  },
  down: async (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.dropTable('UserMerchantCategoryCodes', { transaction });
      }
    )
  },
};
