import { API_ERROR_CODES, API_RESPONSE_STATUS } from 'shared-types';
import { CustomResponse } from '@common/types';
import * as AccountTypes from '../models/AccountTypes.model';

export const getAccountTypes = async (req, res: CustomResponse) => {
  try {
    const data = await AccountTypes.getAccountTypes();

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: data,
    });
  } catch (err) {
    return res.status(500).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: API_ERROR_CODES.unexpected,
      },
    });
  }
};
