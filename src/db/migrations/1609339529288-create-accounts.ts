import { QueryInterface } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.createTable('Accounts', {
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
          currentBalance: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
          creditLimit: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
        }, { transaction });

        await queryInterface.addColumn(
          'Accounts',
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
          'Accounts',
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
          'Accounts',
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
      }
    )
  },
  down: async (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.dropTable('Accounts', { transaction });

        await queryInterface.removeColumn('Accounts', 'accountTypeId', { transaction });
        await queryInterface.removeColumn('Accounts', 'currencyId', { transaction });
      }
    )
  },
};
