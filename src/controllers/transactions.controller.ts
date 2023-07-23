import { API_ERROR_CODES, API_RESPONSE_STATUS } from 'shared-types';
import { CustomResponse } from '@common/types';

import { ValidationError } from '@js/errors'

import * as Transactions from '@models/Transactions.model';

import * as transactionsService from '@services/transactions';
import { logger} from '@js/utils/logger';

const SORT_DIRECTIONS = Object.freeze({
  asc: 'ASC',
  desc: 'DESC',
});

export const getTransactions = async (req, res: CustomResponse) => {
  try {
    const { id: userId } = req.user;

    const {
      sort = SORT_DIRECTIONS.desc,
      includeUser,
      includeAccount,
      includeCategory,
      includeAll,
      nestedInclude,
      limit,
      from = 0,
      accountType,
    } = req.query;

    const transactions = await Transactions.getTransactions({
      userId,
      from,
      accountType,
      limit,
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
      response: transactions,
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
