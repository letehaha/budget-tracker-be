import { RESPONSE_STATUS, CustomResponse, ERROR_CODES } from 'shared-types';

import { getUsers as getUsersModel } from '../models/Users.model';

export const getUsers = async (req, res: CustomResponse) => {
  try {
    const users = await getUsersModel();

    return res.status(200).json({
      status: RESPONSE_STATUS.success,
      response: users,
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
