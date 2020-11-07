module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('AccountTypes', [
      { name: 'General' },
      { name: 'Cash' },
      { name: 'Current account' },
      { name: 'Credit card' },
      { name: 'Saving account' },
      { name: 'Bonus' },
      { name: 'Insurance' },
      { name: 'Investment' },
      { name: 'Loan' },
      { name: 'Mortgage' },
      { name: 'Account with overdraft' },
    ], {});
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('AccountTypes', null, {});
  },
};
