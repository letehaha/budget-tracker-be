import { API_ERROR_CODES, ACCOUNT_TYPES, API_RESPONSE_STATUS } from 'shared-types';
import { CustomResponse } from '@common/types';
import { QueryTypes } from 'sequelize';
import { compareDesc } from 'date-fns';

import { ValidationError } from '@js/errors'

import { connection } from '@models/index';
import * as Transactions from '@models/Transactions.model';
import * as MonobankTransactions from '@models/banks/monobank/Transactions.model';

import * as transactionsService from '@services/transactions';
import { logger} from '@js/utils/logger';

const SORT_DIRECTIONS = Object.freeze({
  asc: 'ASC',
  desc: 'DESC',
});

export const getTransactions = async (req, res: CustomResponse) => {
  try {
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
        status: API_RESPONSE_STATUS.success,
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
      status: API_RESPONSE_STATUS.success,
      response: [...transactions, ...monoTransactions],
    });
  } catch (err) {
    console.log('err', err);
    logger.error(err);

    return res.status(500).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: API_ERROR_CODES.unexpected,
      },
    });
  }
};

export const getTransactionById = async (req, res: CustomResponse) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user;
    const {
      includeUser,
      includeAccount,
      includeCategory,
      includeAll,
      nestedInclude,
    } = req.query;

    if (id === undefined) throw new ValidationError({ message: 'id should exist.' });

    const data = await transactionsService.getTransactionById({
      id,
      userId,
      includeUser,
      includeAccount,
      includeCategory,
      includeAll,
      nestedInclude,
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: data,
    });
  } catch (err) {
    return res.status(500).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: API_ERROR_CODES.unexpected,
      },
    });
  }
};

export const getTransactionsByTransferId = async (req, res: CustomResponse) => {
  try {
    const { transferId } = req.params;
    const { id: userId } = req.user;
    const {
      includeUser,
      includeAccount,
      includeCategory,
      includeAll,
      nestedInclude,
    } = req.query;

    if (transferId === undefined) throw new ValidationError({ message: '"transferId" is required.' });

    const data = await transactionsService.getTransactionsByTransferId({
      transferId,
      userId,
      includeUser,
      includeAccount,
      includeCategory,
      includeAll,
      nestedInclude,
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: data,
    });
  } catch (err) {
    return res.status(500).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: API_ERROR_CODES.unexpected,
      },
    });
  }
};

// TODO:

export * from './transactions.controller/index';
