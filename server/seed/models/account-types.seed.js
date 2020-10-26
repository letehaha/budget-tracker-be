const AccountType = require('@models/AccountType');

module.exports = [
  new AccountType({
    name: 'General',
  }),
  new AccountType({
    name: 'Cash',
  }),
  new AccountType({
    name: 'Credit Card',
  }),
  new AccountType({
    name: 'Saving Account',
  }),
];
