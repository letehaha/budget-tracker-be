const { Transactions } = require('@models');

exports.getTransactions = async (req, res, next) => {
  const {
    includeUser,
    includeTransactionType,
    includePaymentType,
    includeAccount,
    includeCategory,
    includeAll,
    nestedInclude,
  } = req.query;
  try {
    const data = await Transactions.getTransactions({
      includeUser,
      includeTransactionType,
      includePaymentType,
      includeAccount,
      includeCategory,
      includeAll,
      nestedInclude,
    });

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};

exports.getTransactionById = async (req, res, next) => {
  const { id } = req.params;
  const {
    includeUser,
    includeTransactionType,
    includePaymentType,
    includeAccount,
    includeCategory,
    includeAll,
    nestedInclude,
  } = req.query;

  try {
    const data = await Transactions.getTransactionById({
      id,
      includeUser,
      includeTransactionType,
      includePaymentType,
      includeAccount,
      includeCategory,
      includeAll,
      nestedInclude,
    });

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};

exports.createTransaction = async (req, res, next) => {
  const {
    amount,
    note,
    time,
    userId,
    transactionTypeId,
    paymentTypeId,
    accountId,
    categoryId,
  } = req.body;

  try {
    const data = await Transactions.createTransaction({
      amount,
      note,
      time,
      userId,
      transactionTypeId,
      paymentTypeId,
      accountId,
      categoryId,
    });

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};

exports.updateTransaction = async (req, res, next) => {
  const { id } = req.params;
  const {
    amount,
    note,
    time,
    userId,
    transactionTypeId,
    paymentTypeId,
    accountId,
    categoryId,
  } = req.body;
  try {
    const data = await Transactions.updateTransactionById({
      id,
      amount,
      note,
      time,
      userId,
      transactionTypeId,
      paymentTypeId,
      accountId,
      categoryId,
    });

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};

exports.deleteTransaction = async (req, res, next) => {
  const { id } = req.params;
  try {
    await Transactions.deleteTransactionById({ id });

    return res.status(200).json({ response: {} });
  } catch (err) {
    return next(new Error(err));
  }
};
