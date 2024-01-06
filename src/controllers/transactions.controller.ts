import { API_RESPONSE_STATUS, SORT_DIRECTIONS } from 'shared-types';
import { CustomResponse } from '@common/types';
import { ValidationError } from '@js/errors';
import * as transactionsService from '@services/transactions';
import { errorHandler } from './helpers';

export const getTransactions = async (req, res: CustomResponse) => {
  try {
    const { id: userId } = req.user;
    const {
      sortDirection = SORT_DIRECTIONS.desc,
      limit,
      from = 0,
      type: transactionType,
      accountType,
      accountId,
      includeUser,
      includeAccount,
      includeCategory,
      includeAll,
      nestedInclude,
      isRaw,
    } = req.query

    const data = await transactionsService.getTransactions({
      userId,
      transactionType,
      sortDirection,
      limit,
      from,
      accountType,
      accountId,
      includeUser,
      includeAccount,
      includeCategory,
      includeAll,
      nestedInclude,
      isRaw,
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: data,
    })
  } catch (err) {
    errorHandler(res, err);
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

    if (id === undefined)
      throw new ValidationError({ message: 'id should exist.' });

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
    errorHandler(res, err);
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

    if (transferId === undefined)
      throw new ValidationError({ message: '"transferId" is required.' });

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
    errorHandler(res, err);
  }
};

// TODO:

export * from './transactions.controller/index';
