import { ACCOUNT_TYPES, API_RESPONSE_STATUS, endpointsTypes } from 'shared-types';
import { logger} from '@js/utils/logger';
import { CustomResponse } from '@common/types';
import * as accountsService from '@services/accounts.service';
import { removeUndefinedKeys } from '@js/helpers';

export const getAccounts = async (req, res: CustomResponse, next) => {
  const { id: userId } = req.user;

  try {
    const accounts = await accountsService.getAccounts({ userId });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: accounts,
    });
  } catch (err) {
    logger.error(err);
    return next(err);
  }
};

export const getAccountById = async (req, res: CustomResponse, next) => {
  const { id } = req.params;
  const { id: userId } = req.user;

  try {
    const account = await accountsService.getAccountById({ userId, id });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: account,
    });
  } catch (err) {
    logger.error(err);
    return next(err);
  }
};

export const createAccount = async (req, res, next) => {
  const {
    accountTypeId,
    currencyId,
    name,
    currentBalance,
    initialBalance = 0,
    creditLimit,
  } = req.body;
  const { id: userId } = req.user;

  try {
    const account = await accountsService.createAccount({
      accountTypeId,
      currencyId,
      name,
      currentBalance,
      creditLimit,
      initialBalance,
      userId,
      type: ACCOUNT_TYPES.system,
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: account,
    });
  } catch (err) {
    logger.error(err);
    return next(err);
  }
};

export const updateAccount = async (req, res, next) => {
  const { id } = req.params;
  const { id: userId } = req.user;
  const {
    accountTypeId,
    currencyId,
    name,
    currentBalance,
    creditLimit,
    isEnabled,
    initialBalance,
  }: endpointsTypes.UpdateAccountBody = req.body;

  try {
    const account = await accountsService.updateAccount({
      id,
      userId,
      ...removeUndefinedKeys({
        isEnabled,
        accountTypeId: Number(accountTypeId),
        currencyId: Number(currencyId),
        initialBalance: Number(initialBalance),
        name,
        currentBalance: Number(currentBalance),
        creditLimit: Number(creditLimit),
      }),
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: account,
    });
  } catch (err) {
    logger.error(err);
    return next(err);
  }
};

export const deleteAccount = async (req, res, next) => {
  const { id } = req.params;

  try {
    await accountsService.deleteAccountById({ id });

    return res.status(200).json({ status: API_RESPONSE_STATUS.success });
  } catch (err) {
    logger.error(err);
    return next(err);
  }
};
