import { RESPONSE_STATUS, CustomResponse } from 'shared-types';
import * as userService from '@services/user.service';
import { errorHandler } from './helpers';

export const getUser = async (req, res: CustomResponse) => {
  const { id } = req.user;

  try {
    const user = await userService.getUser(Number(id));

    return res.status(200).json({
      status: RESPONSE_STATUS.success,
      response: user,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};

export const updateUser = async (req, res: CustomResponse) => {
  const { id } = req.user;
  const {
    username,
    email,
    firstName,
    lastName,
    middleName,
    password,
    avatar,
    totalBalance,
  }: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    middleName: string;
    password: string;
    avatar: string;
    totalBalance: number;
  } = req.body;

  try {
    const user = await userService.updateUser({
      id: Number(id),
      username,
      email,
      firstName,
      lastName,
      middleName,
      password,
      avatar,
      totalBalance,
    });

    return res.status(200).json({
      status: RESPONSE_STATUS.success,
      response: user,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};

export const deleteUser = async (req, res: CustomResponse) => {
  const { id } = req.user;

  try {
    await userService.deleteUser(Number(id));

    return res.status(200).json({
      status: RESPONSE_STATUS.success,
      response: {},
    });
  } catch (err) {
    errorHandler(res, err);
  }
};

export const getUserCurrencies = async (req, res: CustomResponse) => {
  const { id: userId } = req.user;

  try {
    const result = await userService.getUserCurrencies({
      userId: Number(userId),
    });

    return res.status(200).json({
      status: RESPONSE_STATUS.success,
      response: result,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};

export const addUserCurrencies = async (req, res: CustomResponse) => {
  const { id: userId } = req.user;

  const { currencies }: {
    currencies: {
      currencyId: number,
      exchangeRate?: number;
      liveRateUpdate?: boolean;
    }[]
  } = req.body;

  // TODO: types validation

  try {
    const result = await userService.addUserCurrencies(
      currencies.map(item => ({ userId, ...item })),
    );

    return res.status(200).json({
      status: RESPONSE_STATUS.success,
      response: result,
    });
  } catch (err) {
    errorHandler(res, err);
  }
}

export const editUserCurrency = async (req, res: CustomResponse) => {
  const { id: userId } = req.user;

  const {
    currencyId,
    exchangeRate,
    liveRateUpdate,
  }: {
    currencyId: number;
    exchangeRate?: number;
    liveRateUpdate?: boolean;
  } = req.body;

  // TODO: types validation

  try {
    const result = await userService.editUserCurrency({
      userId,
      currencyId,
      exchangeRate,
      liveRateUpdate,
    });

    return res.status(200).json({
      status: RESPONSE_STATUS.success,
      response: result,
    });
  } catch (err) {
    errorHandler(res, err);
  }
}

export const setDefaultUserCurrency = async (req, res: CustomResponse) => {
  const { id: userId } = req.user;

  const {
    currencyId,
  }: {
    currencyId: number;
  } = req.body;

  // TODO: types validation

  try {
    const result = await userService.setDefaultUserCurrency({
      userId,
      currencyId,
    });

    return res.status(200).json({
      status: RESPONSE_STATUS.success,
      response: result,
    });
  } catch (err) {
    errorHandler(res, err);
  }
}
