const { sequelize, Transactions, MonobankTransactions } = require('@models');
const { QueryTypes } = require('sequelize');
const {
  compareDesc,
} = require('date-fns');
const { TRANSACTION_ENTITIES } = require('../js/const');

const SORT_DIRECTIONS = Object.freeze({
  asc: 'ASC',
  desc: 'DESC',
});

exports.getTransactions = async (req, res, next) => {
  const {
    sort = SORT_DIRECTIONS.desc,
    includeUser,
    includeTransactionType,
    includePaymentType,
    includeAccount,
    includeCategory,
    includeAll,
    nestedInclude,
    limit,
    page = 1,
  } = req.query;
  const { id: userId } = req.user;

  try {
    if (limit) {
      const txs = await sequelize
        .query(
          `SELECT * FROM(
            SELECT "id", "time", "transactionEntityId" FROM "Transactions" WHERE "userId"=${userId}
            UNION
            SELECT "id", "time", "transactionEntityId" FROM "MonobankTransactions" WHERE "userId"=${userId}
          ) AS R
          ORDER BY R.time ${sort}
          LIMIT ${limit}
          OFFSET ${(page * limit) - limit}`,
          { type: QueryTypes.SELECT },
        );

      const transactions = await Transactions.getTransactionsByArrayOfField({
        fieldValues: txs
          .filter((item) => item.transactionEntityId === TRANSACTION_ENTITIES.system)
          .map((item) => Number(item.id)),
        fieldName: 'id',
        userId,
        includeUser,
        includeTransactionType,
        includePaymentType,
        includeAccount,
        includeCategory,
        includeAll,
        nestedInclude,
      });
      const monoTransactions = await MonobankTransactions.getTransactionsByArrayOfField({
        fieldValues: txs
          .filter((item) => item.transactionEntityId === TRANSACTION_ENTITIES.monobank)
          .map((item) => item.id),
        fieldName: 'id',
        systemUserId: userId,
        includeUser,
        includeTransactionType,
        includePaymentType,
        includeAccount,
        includeCategory,
        includeAll,
        nestedInclude,
        isRaw: true,
      });

      const sortedResult = [...transactions, ...monoTransactions]
        .sort((a, b) => compareDesc(new Date(a.time), new Date(b.time)));

      return res.status(200).json({ response: sortedResult });
    }
    const transactions = await Transactions.getTransactions({
      userId,
      sortDirection: sort,
      includeUser,
      includeTransactionType,
      includePaymentType,
      includeAccount,
      includeCategory,
      includeAll,
      nestedInclude,
      isRaw: true,
    });

    const monoTransactions = await MonobankTransactions.getTransactions({
      systemUserId: userId,
      sortDirection: sort,
      includeUser,
      includeTransactionType,
      includePaymentType,
      includeAccount,
      includeCategory,
      includeAll,
      nestedInclude,
      isRaw: true,
    });

    return res.status(200).json({ response: [...transactions, ...monoTransactions] });
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
