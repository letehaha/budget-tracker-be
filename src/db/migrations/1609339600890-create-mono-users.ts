import { QueryInterface } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.createTable('MonobankUsers', {
          id: {
            type: Sequelize.INTEGER,
            unique: true,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
          },
          clientId: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          name: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          webHookUrl: {
            type: Sequelize.STRING(1000),
            allowNull: true,
          },
          apiToken: {
            type: Sequelize.STRING,
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
        }, { transaction });

        await queryInterface.addColumn(
          'MonobankUsers',
          'systemUserId',
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
        await queryInterface.removeColumn('MonobankUsers', 'systemUserId', { transaction });
        await queryInterface.dropTable('MonobankUsers', { transaction });
      }
    )
  },
};
