import { QueryInterface } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.createTable('Transactions', {
          id: {
            type: Sequelize.INTEGER,
            unique: true,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
          },
          amount: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          note: {
            type: Sequelize.STRING(2000),
            allowNull: true,
          },
          time: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('now'),
          },
        }, { transaction });

        await queryInterface.addColumn(
          'Transactions',
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
          'Transactions',
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
          'Transactions',
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
          'Transactions',
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
          'Transactions',
          'accountId',
          {
            type: Sequelize.INTEGER,
            references: {
              model: 'Accounts',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          { transaction },
        );
        await queryInterface.addColumn(
          'Transactions',
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
        await queryInterface.removeColumn('Transactions', 'userId', { transaction });
        await queryInterface.removeColumn('Transactions', 'transactionTypeId', { transaction });
        await queryInterface.removeColumn('Transactions', 'paymentTypeId', { transaction });
        await queryInterface.removeColumn('Transactions', 'accountId', { transaction });
        await queryInterface.removeColumn('Transactions', 'categoryId', { transaction });
        await queryInterface.removeColumn('Transactions', 'currencyId', { transaction });

        await queryInterface.dropTable('Transactions', { transaction });
      }
    )
  },
};
