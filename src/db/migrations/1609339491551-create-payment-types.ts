import { QueryInterface } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.createTable('PaymentTypes', {
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
        }, { transaction });

        await queryInterface.bulkInsert('PaymentTypes', [
          { name: 'Bank transfer' },
          { name: 'Voucher' },
          { name: 'Web payment' },
          { name: 'Cash' },
          { name: 'Mobile payment' },
          { name: 'Credit card' },
          { name: 'Debit card' },
        ], { transaction });
      }
    )
  },
  down: async (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.dropTable('PaymentTypes', { transaction });
      }
    )
  },
};
