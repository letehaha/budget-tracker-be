import { RESPONSE_STATUS, CustomResponse } from 'shared-types';

import { getUsers as getUsersModel } from '../models/Users.model';

export const getUsers = async (req, res: CustomResponse, next) => {
  try {
    const users = await getUsersModel();

    return res.status(200).json({
      status: RESPONSE_STATUS.success,
      response: users,
    });
  } catch (err) {
    return next(new Error(err));
  }
};
