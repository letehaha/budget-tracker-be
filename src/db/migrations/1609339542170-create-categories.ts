import 'module-alias/register';
import { QueryInterface } from 'sequelize';
import { CATEGORY_TYPES } from 'shared-types';

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.createTable('Categories', {
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
          imageUrl: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          color: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          type: {
            type: Sequelize.ENUM(Object.values(CATEGORY_TYPES)),
            allowNull: false,
            defaultValue: CATEGORY_TYPES.custom,
          },
          parentId: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
        }, { transaction });

        await queryInterface.addColumn(
          'Categories',
          'userId',
          {
            type: Sequelize.INTEGER,
            references: {
              model: 'Users', // name of Target model
              key: 'id', // key in Target model that we're referencing
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
        await queryInterface.removeColumn('Categories', 'userId', { transaction });
        await queryInterface.dropTable('Categories', { transaction });
      }
    )
  },
};
