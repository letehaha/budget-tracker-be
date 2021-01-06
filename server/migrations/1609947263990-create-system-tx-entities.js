const { TRANSACTION_ENTITIES } = require('../js/const');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('TransactionEntities', {
      id: {
        type: Sequelize.INTEGER,
        unique: true,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      type: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    });

    await queryInterface.bulkInsert('TransactionEntities', [
      { name: 'System', type: TRANSACTION_ENTITIES.system },
      { name: 'Monobank', type: TRANSACTION_ENTITIES.monobank },
    ], {});
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('TransactionEntities');
  },
};
