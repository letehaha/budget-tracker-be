module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('UsersCurrencies', [
      {
        currencyId: 1,
        userId: 1,
      },
    ], {});
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('UsersCurrencies', null, {});
  },
};
