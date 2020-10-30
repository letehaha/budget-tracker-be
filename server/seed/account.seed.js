const Account = require('@models/Account');
const AccountType = require('@models/AccountType');
const Currency = require('@models/Currency');
const User = require('@models/User');

async function seedTestAccount() {
  const cur = await Currency.find({
    code: 'UAH',
  });
  const at = await AccountType.find({
    name: 'Cash',
  });

  const [user] = await User.find();

  const account = new Account({
    name: 'Test',
    type: at[0]._id,
    currency: cur[0]._id,
    currentBalance: 0,
    creditLimit: 0,
  });

  user.accounts.push(account);
  await user.save();
}

module.exports = {
  seedTestAccount,
};
