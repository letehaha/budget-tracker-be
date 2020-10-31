const AccountType = require('@models/AccountType');

module.exports = [
  new AccountType({
    name: 'General',
  }),
  new AccountType({
    name: 'Cash',
  }),
  new AccountType({
    name: 'Current account',
  }),
  new AccountType({
    name: 'Credit card',
  }),
  new AccountType({
    name: 'Saving account',
  }),
  new AccountType({
    name: 'Bonus',
  }),
  new AccountType({
    name: 'Insurance',
  }),
  new AccountType({
    name: 'Investment',
  }),
  new AccountType({
    name: 'Loan',
  }),
  new AccountType({
    name: 'Mortgage',
  }),
  new AccountType({
    name: 'Account with overdraft',
  }),
];
