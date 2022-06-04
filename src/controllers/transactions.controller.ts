import { RESPONSE_STATUS, CustomResponse, ERROR_CODES, ACCOUNT_TYPES } from 'shared-types';
import { QueryTypes } from 'sequelize';
import { compareDesc } from 'date-fns';

import { CustomError } from '@js/errors'

import { connection } from '@models/index';
import * as Transactions from '@models/Transactions.model';
import * as MonobankTransactions from '@models/banks/monobank/Transactions.model';

import * as transactionsService from '@services/transactions.service';

const SORT_DIRECTIONS = Object.freeze({
  asc: 'ASC',
  desc: 'DESC',
});

export const getTransactions = async (req, res: CustomResponse) => {
  const {
    sort = SORT_DIRECTIONS.desc,
    includeUser,
    includeAccount,
    includeCategory,
    includeAll,
    nestedInclude,
    limit,
    from = 0,
  } = req.query;
  const { id: userId } = req.user;

  try {
    if (limit) {
      const txs = await connection.sequelize
        .query(
          `SELECT * FROM(
            SELECT "id", "time", "accountType" FROM "Transactions" WHERE "userId"=${userId}
            UNION
            SELECT "id", "time", "accountType" FROM "MonobankTransactions" WHERE "userId"=${userId}
          ) AS R
          ORDER BY R.time ${sort}
          LIMIT ${limit}
          OFFSET ${from}`,
          { type: QueryTypes.SELECT },
        );

      const transactions = await Transactions.getTransactionsByArrayOfField({
        fieldValues: txs
          .filter((item) => item.accountType === ACCOUNT_TYPES.system)
          .map((item) => Number(item.id)),
        fieldName: 'id',
        userId,
        includeUser,
        includeAccount,
        includeCategory,
        includeAll,
        nestedInclude,
      });
      const monoTransactions = await MonobankTransactions.getTransactionsByArrayOfField({
        fieldValues: txs
          .filter((item) => item.accountType === ACCOUNT_TYPES.monobank)
          .map((item) => item.id),
        fieldName: 'id',
        systemUserId: userId,
        includeUser,
        includeAccount,
        includeCategory,
        includeAll,
        nestedInclude,
        isRaw: true,
      });

      const sortedResult = [...transactions, ...monoTransactions]
        .sort((a, b) => compareDesc(new Date(a.time), new Date(b.time)));

      return res.status(200).json({
        status: RESPONSE_STATUS.success,
        response: sortedResult,
      });
    }
    const transactions = await Transactions.getTransactions({
      userId,
      sortDirection: sort,
      includeUser,
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
      includeAccount,
      includeCategory,
      includeAll,
      nestedInclude,
      isRaw: true,
    });

    return res.status(200).json({
      status: RESPONSE_STATUS.success,
      response: [...transactions, ...monoTransactions],
    });
  } catch (err) {
    return res.status(500).json({
      status: RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: ERROR_CODES.unexpected,
      },
    });
  }
};

export const getTransactionById = async (req, res: CustomResponse) => {
  const { id } = req.params;
  const { id: userId } = req.user;
  const {
    includeUser,
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
      includeAccount,
      includeCategory,
      includeAll,
      nestedInclude,
    });

    return res.status(200).json({
      status: RESPONSE_STATUS.success,
      response: data,
    });
  } catch (err) {
    return res.status(500).json({
      status: RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: ERROR_CODES.unexpected,
      },
    });
  }
};

export const createTransaction = async (req, res: CustomResponse) => {
  const {
    amount,
    note,
    time,
    transactionType,
    paymentType,
    accountId,
    categoryId,
    fromAccountId,
    fromAccountType,
    toAccountId,
    toAccountType,
    currencyId,
    accountType = ACCOUNT_TYPES.system,
  } = req.body;

  const { id: userId } = req.user;

  try {
    const data = await transactionsService.createTransaction({
      amount,
      note,
      time,
      transactionType,
      paymentType,
      accountId,
      categoryId,
      accountType,
      userId,
      fromAccountId,
      fromAccountType,
      toAccountId,
      toAccountType,
      currencyId,
    });

    return res.status(200).json({
      status: RESPONSE_STATUS.success,
      response: data,
    });
  } catch (err) {
    if (err instanceof CustomError) {
      return res.status(err.httpCode).json({
        status: RESPONSE_STATUS.error,
        response: {
          message: err.message,
          code: err.code,
        },
      });
    }

    return res.status(500).json({
      status: RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: ERROR_CODES.unexpected,
      },
    });
  }
};

export const updateTransaction = async (req, res: CustomResponse) => {
  const { id } = req.params;
  const {
    amount,
    note,
    time,
    transactionType,
    paymentType,
    accountId,
    categoryId,
  } = req.body;

  const { id: userId } = req.user;

  try {
    const data = await transactionsService.updateTransaction({
      id,
      amount,
      note,
      time,
      userId,
      transactionType,
      paymentType,
      accountId,
      categoryId,
    });

    return res.status(200).json({
      status: RESPONSE_STATUS.success,
      response: data,
    });
  } catch (err) {
    if (err instanceof CustomError) {
      return res.status(err.httpCode).json({
        status: RESPONSE_STATUS.error,
        response: {
          message: err.message,
          code: err.code,
        },
      });
    }

    return res.status(500).json({
      status: RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: ERROR_CODES.unexpected,
      },
    });
  }
};

export const deleteTransaction = async (req, res: CustomResponse) => {
  const { id } = req.params;
  const { id: userId } = req.user;

  try {
    await transactionsService.deleteTransaction({ id, userId })

    return res.status(200).json({
      status: RESPONSE_STATUS.success,
      response: {},
    });
  } catch (err) {
    if (err instanceof CustomError) {
      return res.status(err.httpCode).json({
        status: RESPONSE_STATUS.error,
        response: {
          message: err.message,
          code: err.code,
        },
      });
    }

    return res.status(500).json({
      status: RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: ERROR_CODES.unexpected,
      },
    });
  }
};
