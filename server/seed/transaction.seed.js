const Transaction = require('@models/Transaction');
const Category = require('@models/Category');
const Account = require('@models/Account');
const PaymentType = require('@models/PaymentType');
const TransactionType = require('@models/TransactionType');

async function seedTestTransaction() {
  const account = await Account.find({
    name: 'Test',
  });
  const category = await Category.find({
    name: 'Food & Drinks',
  });
  const paymentType = await PaymentType.find({
    name: 'Cash',
  });
  const transactioType = await TransactionType.find({
    type: 'income',
  });

  const tx = new Transaction({
    account: account[0]._id,
    amount: 0,
    category: category[0]._id,
    note: '',
    paymentType: paymentType[0]._id,
    time: new Date(),
    type: transactioType[0]._id,
  });

  await tx.save();
}

module.exports = {
  seedTestTransaction,
};
