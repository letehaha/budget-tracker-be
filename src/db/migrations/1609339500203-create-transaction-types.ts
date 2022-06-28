import { QueryInterface } from 'sequelize';
import { TRANSACTION_TYPES } from 'shared-types';

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(
      async (transaction) => {
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
        }, { transaction });

        await queryInterface.bulkInsert('TransactionTypes', [
          { name: 'Income', type: TRANSACTION_TYPES.income },
          { name: 'Expense', type: TRANSACTION_TYPES.expense },
          { name: 'Transfer', type: TRANSACTION_TYPES.transfer },
        ], { transaction });
      }
    )
  },
  down: async (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.dropTable('TransactionTypes', { transaction });
      }
    )
  },
};
