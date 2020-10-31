const TransactionType = require('@models/TransactionType');

module.exports = [
  new TransactionType({
    name: 'Income',
    type: 'income',
  }),
  new TransactionType({
    name: 'Expense',
    type: 'expense',
  }),
  new TransactionType({
    name: 'Transfer',
    type: 'transfer',
  }),
];
