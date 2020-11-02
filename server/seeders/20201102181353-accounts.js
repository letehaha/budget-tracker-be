module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('Accounts', [
      {
        name: 'Test',
        currencyId: 1,
        accountTypeId: 1,
      },
    ], {});
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Accounts', null, {});
  },
};
