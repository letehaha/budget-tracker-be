module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('Transactions', [
      {
        amount: 0,
        categoryId: 1,
        userId: 1,
        transactionTypeId: 1,
        paymentTypeId: 1,
        accountId: 1,
      },
    ], {});
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Transactions', null, {});
  },
};
