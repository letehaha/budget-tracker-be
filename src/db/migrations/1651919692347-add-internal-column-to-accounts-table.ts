import { QueryInterface } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.addColumn(
          'Accounts',
          'internal',
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          { transaction },
        );
      }
    )
  },
  down: async (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(
      async (transaction) => {
        queryInterface.removeColumn('Accounts', 'internal', { transaction });
      }
    )
  },
};
