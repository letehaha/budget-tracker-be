import { QueryInterface } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.createTable('MonobankTransactions', {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            unique: true,
            allowNull: false,
            primaryKey: true,
          },
          originalId: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          description: {
            type: Sequelize.STRING(2000),
            allowNull: true,
          },
          amount: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          time: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('now'),
          },
          operationAmount: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          commissionRate: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          cashbackAmount: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          balance: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          hold: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
          },
          receiptId: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          note: {
            type: Sequelize.STRING,
            allowNull: true,
          },
        }, { transaction });

        await queryInterface.addColumn(
          'MonobankTransactions',
          'userId',
          {
            type: Sequelize.INTEGER,
            references: {
              model: 'Users',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          { transaction },
        );
        await queryInterface.addColumn(
          'MonobankTransactions',
          'categoryId',
          {
            type: Sequelize.INTEGER,
            references: {
              model: 'Categories',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          { transaction },
        );
        await queryInterface.addColumn(
          'MonobankTransactions',
          'transactionTypeId',
          {
            type: Sequelize.INTEGER,
            references: {
              model: 'TransactionTypes',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          { transaction },
        );
        await queryInterface.addColumn(
          'MonobankTransactions',
          'paymentTypeId',
          {
            type: Sequelize.INTEGER,
            references: {
              model: 'PaymentTypes',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          { transaction },
        );
        await queryInterface.addColumn(
          'MonobankTransactions',
          'monoAccountId',
          {
            type: Sequelize.INTEGER,
            references: {
              model: 'MonobankAccounts',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          { transaction },
        );
        await queryInterface.addColumn(
          'MonobankTransactions',
          'currencyId',
          {
            type: Sequelize.INTEGER,
            references: {
              model: 'Currencies',
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
        await queryInterface.removeColumn('MonobankTransactions', 'userId', { transaction });
        await queryInterface.removeColumn('MonobankTransactions', 'transactionTypeId', { transaction });
        await queryInterface.removeColumn('MonobankTransactions', 'paymentTypeId', { transaction });
        await queryInterface.removeColumn('MonobankTransactions', 'monoAccountId', { transaction });
        await queryInterface.removeColumn('MonobankTransactions', 'categoryId', { transaction });
        await queryInterface.removeColumn('MonobankTransactions', 'currencyId', { transaction });
        await queryInterface.dropTable('MonobankTransactions', { transaction });
      }
    )
  },
};
