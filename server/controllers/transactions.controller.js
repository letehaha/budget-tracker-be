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
  const { id: userId } = req.user;

  try {
    const data = await Transactions.getTransactions({
      userId,
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
  const { id: userId } = req.user;
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
      userId,
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
    transactionTypeId,
    paymentTypeId,
    accountId,
    categoryId,
  } = req.body;

  const { id: userId } = req.user;

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
    transactionTypeId,
    paymentTypeId,
    accountId,
    categoryId,
  } = req.body;

  const { id: userId } = req.user;

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
  const { id: userId } = req.user;

  try {
    await Transactions.deleteTransactionById({ id, userId });

    return res.status(200).json({ response: {} });
  } catch (err) {
    return next(new Error(err));
  }
};
