import { QueryInterface } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.bulkInsert('UsersCurrencies', [
          {
            currencyId: 1,
            userId: 1,
          },
        ], { transaction });
      }
    )
  },
  down: async (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.bulkDelete('UsersCurrencies', null, { transaction });
      }
    )
  },
};
