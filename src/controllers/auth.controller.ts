import { RESPONSE_STATUS, CustomResponse } from 'shared-types';
import { errorHandler } from './helpers';

import * as authService from '@services/auth.service';

export const login = async (req, res: CustomResponse) => {
  const { username, password } = req.body;

  try {
    const token = await authService.login({ username, password })

    return res.status(200).json({
      status: RESPONSE_STATUS.success,
      response: token,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};

export const register = async (req, res: CustomResponse) => {
  const { username, password } = req.body;

  try {
    const user = await authService.register({ username, password })

    return res.status(201).json({
      status: RESPONSE_STATUS.success,
      response: { user },
    });
  } catch (err) {
    errorHandler(res, err);
  }
}
