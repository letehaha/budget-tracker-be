import { API_RESPONSE_STATUS } from 'shared-types';
import { CustomResponse } from '@common/types';
import * as accountsService from '@services/accounts.service';

export const getAccounts = async (req, res: CustomResponse, next) => {
  const { id: userId } = req.user;

  try {
    const accounts = await accountsService.getAccounts({ userId });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: accounts,
    });
  } catch (err) {
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
    return next(err);
  }
};

export const createAccount = async (req, res, next) => {
  const {
    accountTypeId,
    currencyId,
    name,
    currentBalance,
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
      userId,
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: account,
    });
  } catch (err) {
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
  } = req.body;

  try {
    const account = await accountsService.updateAccount({
      id,
      userId,

      accountTypeId,
      currencyId,
      name,
      currentBalance,
      creditLimit,
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: account,
    });
  } catch (err) {
    return next(err);
  }
};

export const deleteAccount = async (req, res, next) => {
  const { id } = req.params;

  try {
    await accountsService.deleteAccountById({ id });

    return res.status(200).json({ status: API_RESPONSE_STATUS.success });
  } catch (err) {
    return next(err);
  }
};
