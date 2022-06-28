import { QueryInterface } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.createTable('Users', {
          id: {
            type: Sequelize.INTEGER,
            unique: true,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
          },
          username: {
            type: Sequelize.STRING,
            unique: true,
            allowNull: false,
          },
          email: {
            type: Sequelize.STRING,
            unique: true,
            allowNull: true,
          },
          firstName: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          lastName: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          middleName: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          password: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          avatar: {
            type: Sequelize.STRING(2000),
            allowNull: true,
          },
          totalBalance: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
          defaultCategoryId: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
        }, { transaction });
      }
    )
  },
  down: async (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.dropTable('Users', { transaction });
      }
    )
  },
};
