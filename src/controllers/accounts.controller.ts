import {
  ACCOUNT_TYPES,
  API_RESPONSE_STATUS,
  endpointsTypes,
} from 'shared-types';
import { CustomResponse } from '@common/types';
import * as accountsService from '@services/accounts.service';
import { removeUndefinedKeys } from '@js/helpers';
import Accounts from '@models/Accounts.model';
import { ValidationError, NotFoundError, Unauthorized } from '@js/errors';
import { errorHandler } from './helpers';

export const getAccounts = async (req, res: CustomResponse) => {
  const { id: userId } = req.user;

  try {
    const accounts = await accountsService.getAccounts({ userId });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: accounts,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};

export const getAccountById = async (req, res: CustomResponse) => {
  const { id } = req.params;
  const { id: userId } = req.user;

  try {
    const account = await accountsService.getAccountById({ userId, id });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: account,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};

export const createAccount = async (req, res) => {
  const {
    accountTypeId,
    currencyId,
    name,
    type = ACCOUNT_TYPES.system,
    initialBalance,
    creditLimit,
  }: endpointsTypes.CreateAccountBody = req.body;
  const { id: userId } = req.user;

  try {
    if (
      type !== ACCOUNT_TYPES.system &&
      process.env.NODE_ENV === 'production'
    ) {
      throw new Unauthorized({
        message: `Only "type: ${ACCOUNT_TYPES.system}" is allowed.`,
      });
    }

    const account = await accountsService.createAccount({
      accountTypeId,
      currencyId,
      name,
      type,
      creditLimit,
      initialBalance,
      userId,
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: account,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};

export const updateAccount = async (req, res) => {
  const { id } = req.params;
  const { id: userId } = req.user;
  const {
    accountTypeId,
    name,
    creditLimit,
    isEnabled,
    currentBalance,
  }: endpointsTypes.UpdateAccountBody = req.body;
  try {
    const account = await Accounts.findByPk(id);

    if (!account) {
      throw new NotFoundError({
        message: `Account with id "${id}" doesn't exist.`,
      });
    }

    if (account.type !== ACCOUNT_TYPES.system) {
      if (creditLimit || currentBalance) {
        throw new ValidationError({
          message: `'creditLimit', 'currentBalance' are only allowed to be changed for "${ACCOUNT_TYPES.system}" account type`,
        });
      }
    }

    // If user wants to change currentBalance, he can do it in two ways:
    // 1. Create an adjustment transaction
    // 2. Update `currentBalance` field, which will automatically edit initialBalance and balance history
    const result = await accountsService.updateAccount({
      id,
      userId,
      ...removeUndefinedKeys({
        isEnabled,
        accountTypeId: Number(accountTypeId),
        currentBalance: Number(currentBalance),
        name,
        creditLimit: Number(creditLimit),
      }),
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: result,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};

export const deleteAccount = async (req, res) => {
  const { id } = req.params;

  try {
    await accountsService.deleteAccountById({ id });

    return res.status(200).json({ status: API_RESPONSE_STATUS.success });
  } catch (err) {
    errorHandler(res, err);
  }
};
