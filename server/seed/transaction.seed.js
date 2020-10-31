const Transaction = require('@models/Transaction');
const PaymentType = require('@models/PaymentType');
const TransactionType = require('@models/TransactionType');
const User = require('@models/User');

async function seedTestTransaction() {
  const [user] = await User.find();

  const account = user.accounts[0];
  const category = user.categories[0];
  const paymentType = await PaymentType.find({
    name: 'Cash',
  });
  const transactioType = await TransactionType.find({
    type: 'income',
  });

  const tx = new Transaction({
    account: account._id,
    amount: 0,
    category: category._id,
    note: '',
    paymentType: paymentType[0]._id,
    time: new Date(),
    type: transactioType[0]._id,
  });

  user.transactions.push(tx);
  await user.save();
}

module.exports = {
  seedTestTransaction,
};
