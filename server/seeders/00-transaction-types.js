const { TRANSACTION_TYPES } = require('../js/const');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('TransactionTypes', [
      { name: 'Income', type: TRANSACTION_TYPES.income },
      { name: 'Expense', type: TRANSACTION_TYPES.expense },
      { name: 'Transfer', type: TRANSACTION_TYPES.transfer },
    ], {});
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('TransactionTypes', null, {});
  },
};
