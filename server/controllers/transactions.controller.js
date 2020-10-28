const mongoose = require('mongoose');
const Transaction = require('@models/Transaction');
const Account = require('@models/Account');
const PaymentType = require('@models/PaymentType');
const TransactionType = require('@models/TransactionType');
const Category = require('@models/Category');

const { ObjectId } = mongoose.Types;
const validateObjectId = (id) => ObjectId.isValid(id) && (new ObjectId(id)).toString() === id;

exports.getTransactions = async (req, res, next) => {
  try {
    const data = await Transaction.find();

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};

exports.getTransactionById = async (req, res, next) => {
  const { id } = req.params;

  try {
    if (!validateObjectId(id)) {
      return res.status(400).json({
        message: 'Transaction "id" is invalid',
      });
    }

    const data = await Transaction.findById(id);

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};

exports.createTransaction = async (req, res, next) => {
  const {
    account,
    amount,
    category,
    note,
    paymentType,
    time,
    type,
  } = req.body;
  try {
    if (
      !validateObjectId(account)
      || !validateObjectId(category)
      || !validateObjectId(paymentType)
      || !validateObjectId(type)
    ) {
      return res.status(400).json({
        message: '"id" is invalid',
      });
    }

    const accountRecord = await Account.findById(account);
    if (!accountRecord) {
      return res.status(404).json({
        message: `No Account found with such id "${account}"`,
        statusCode: 404,
      });
    }
    const categoryRecord = await Category.findById(category);
    if (!categoryRecord) {
      return res.status(404).json({
        message: `No Category found with such id "${category}"`,
        statusCode: 404,
      });
    }
    const paymentTypeRecord = await PaymentType.findById(paymentType);
    if (!paymentTypeRecord) {
      return res.status(404).json({
        message: `No PaymentType found with such id "${paymentType}"`,
        statusCode: 404,
      });
    }
    const transactionTypeRecord = await TransactionType.findById(type);
    if (!transactionTypeRecord) {
      return res.status(404).json({
        message: `No TransactionType found with such id "${type}"`,
        statusCode: 404,
      });
    }

    const data = await new Transaction({
      account: accountRecord._id,
      amount,
      category: categoryRecord._id,
      note,
      paymentType: paymentTypeRecord._id,
      time,
      type: transactionTypeRecord._id,
    }).save();

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};

exports.updateTransaction = async (req, res, next) => {
  const { id } = req.params;
  const {
    account,
    amount,
    category,
    note,
    paymentType,
    time,
    type,
  } = req.body;
  try {
    if (!validateObjectId(id)) {
      return res.status(400).json({
        message: '"id" is invalid',
      });
    }
    const transactionRecord = await Transaction.findById(id);
    if (!transactionRecord) {
      return res.status(404).json({
        message: `No Transaction found with such id "${id}"`,
      });
    }
    let accountRecord;
    if (account) {
      accountRecord = await Account.findById(account);
      if (!accountRecord) {
        return res.status(404).json({
          message: `No Account found with such id "${account}"`,
        });
      }
    }
    let categoryRecord;
    if (category) {
      categoryRecord = await Category.findById(category);
      if (!categoryRecord) {
        return res.status(404).json({
          message: `No Category found with such id "${category}"`,
        });
      }
    }
    let paymentTypeRecord;
    if (paymentType) {
      paymentTypeRecord = await PaymentType.findById(paymentType);
      if (!paymentTypeRecord) {
        return res.status(404).json({
          message: `No PaymentType found with such id "${paymentType}"`,
        });
      }
    }
    let typeRecord;
    if (type) {
      typeRecord = await TransactionType.findById(type);
      if (!typeRecord) {
        return res.status(404).json({
          message: `No TransactionType found with such id "${type}"`,
        });
      }
    }

    const query = { _id: transactionRecord._id };
    const update = {
      ...amount !== undefined && { amount },
      ...account !== undefined && { account: accountRecord._id },
      ...type !== undefined && { type: typeRecord._id },
      ...category !== undefined && { category: categoryRecord._id },
      ...paymentType !== undefined && { paymentType: paymentTypeRecord._id },
      ...note !== undefined && { note },
      ...time !== undefined && { time },
    };
    await Transaction.updateOne(query, update);

    const data = await Transaction.findById(query._id);

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};

exports.deleteTransaction = async (req, res, next) => {
  const { id } = req.params;
  try {
    if (!validateObjectId(id)) {
      return res.status(400).json({
        message: 'Transaction "id" is invalid',
      });
    }
    const transactionRecord = await Transaction.findById(id);
    if (!transactionRecord) {
      return res.status(404).json({
        message: `No Transaction found with such id "${id}"`,
      });
    }

    await Transaction.findByIdAndDelete(id);

    return res.status(200).json({ response: {} });
  } catch (err) {
    return next(new Error(err));
  }
};
