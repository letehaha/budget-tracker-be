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
      { name: 'Income', type: 'income' },
      { name: 'Expense', type: 'expense' },
      { name: 'Transfer', type: 'transfer' },
    ], {});
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('TransactionTypes');
  },
};
