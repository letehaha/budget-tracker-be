import { QueryInterface } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.createTable('MonobankAccounts', {
          id: {
            type: Sequelize.INTEGER,
            unique: true,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
          },
          accountId: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          balance: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
          creditLimit: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
          cashbackType: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          maskedPan: {
            type: Sequelize.STRING(1000),
            allowNull: true,
          },
          type: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          iban: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          isEnabled: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: false,
          },
          createdAt: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.fn('now'),
          },
          updatedAt: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.fn('now'),
          },
          name: {
            type: Sequelize.STRING,
            defaultValue: false,
            allowNull: true,
          },
        }, { transaction });

        await queryInterface.addColumn(
          'MonobankAccounts',
          'accountTypeId',
          {
            type: Sequelize.INTEGER,
            references: {
              model: 'AccountTypes',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          { transaction },
        );
        await queryInterface.addColumn(
          'MonobankAccounts',
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
        await queryInterface.addColumn(
          'MonobankAccounts',
          'monoUserId',
          {
            type: Sequelize.INTEGER,
            references: {
              model: 'MonobankUsers',
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
        await queryInterface.removeColumn('MonobankAccounts', 'accountTypeId', { transaction });
        await queryInterface.removeColumn('MonobankAccounts', 'currencyId', { transaction });
        await queryInterface.removeColumn('MonobankAccounts', 'monoUserId', { transaction });
        await queryInterface.dropTable('MonobankAccounts', { transaction });
      }
    )
  },
};
