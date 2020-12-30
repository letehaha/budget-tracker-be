const { TRANSACTION_TYPES } = require('../js/const');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('TransactionTypes', {
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

    await queryInterface.bulkInsert('TransactionTypes', [
      { name: 'Income', type: TRANSACTION_TYPES.income },
      { name: 'Expense', type: TRANSACTION_TYPES.expense },
      { name: 'Transfer', type: TRANSACTION_TYPES.transfer },
    ], {});
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('TransactionTypes');
  },
};
