import { RESPONSE_STATUS, CustomResponse, ERROR_CODES } from 'shared-types';

import * as userService from '@services/user.service';

export const getUser = async (req, res: CustomResponse) => {
  const { id } = req.user;

  try {
    const user = await userService.getUser(Number(id));

    return res.status(200).json({
      status: RESPONSE_STATUS.success,
      response: user,
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
    return res.status(500).json({
      status: RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: ERROR_CODES.unexpected,
      },
    });
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
    return res.status(500).json({
      status: RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: ERROR_CODES.unexpected,
      },
    });
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
    return res.status(500).json({
      status: RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: ERROR_CODES.unexpected,
      },
    });
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
    if (err.code === ERROR_CODES.validationError) {
      return res.status(500).json({
        status: RESPONSE_STATUS.error,
        response: {
          message: err.message,
          code: ERROR_CODES.validationError,
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
}
