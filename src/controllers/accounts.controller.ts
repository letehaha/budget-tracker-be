import { CustomResponse, RESPONSE_STATUS } from '@common/types';

import * as accountsService from '../services/accounts.service';

import * as Accounts from '../models/Accounts.model';

export const getAccounts = async (req, res: CustomResponse, next) => {
  const { id: userId } = req.user;

  try {
    const accounts = await Accounts.getAccounts({ userId });

    return res.status(200).json({
      status: RESPONSE_STATUS.success,
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
    const accounts = await Accounts.getAccountById({ userId, id });

    return res.status(200).json({
      status: RESPONSE_STATUS.success,
      response: accounts,
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
    const data = await Accounts.createAccount({
      accountTypeId,
      currencyId,
      name,
      currentBalance,
      creditLimit,
      userId,
    });

    return res.status(200).json({
      status: RESPONSE_STATUS.success,
      response: data,
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
    const data = await accountsService.updateAccount({
      id,
      userId,

      accountTypeId,
      currencyId,
      name,
      currentBalance,
      creditLimit,
    });

    return res.status(200).json({
      status: RESPONSE_STATUS.success,
      response: data,
    });
  } catch (err) {
    return next(err);
  }
};

export const deleteAccount = async (req, res, next) => {
  const { id } = req.params;

  try {
    await Accounts.deleteAccountById({ id });

    return res.status(200).json({ status: RESPONSE_STATUS.success });
  } catch (err) {
    return next(err);
  }
};
