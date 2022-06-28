import { QueryInterface } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.addColumn(
          'MonobankTransactions',
          'transactionEntityId',
          {
            type: Sequelize.INTEGER,
            references: {
              model: 'TransactionEntities',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          { transaction },
        );
        await queryInterface.addColumn(
          'Transactions',
          'transactionEntityId',
          {
            type: Sequelize.INTEGER,
            references: {
              model: 'TransactionEntities',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          { transaction },
        );
      }
    )
  },
  down: async (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.removeColumn('MonobankTransactions', 'transactionEntityId', { transaction });
        await queryInterface.removeColumn('Transactions', 'transactionEntityId', { transaction });
      }
    )
  },
};
