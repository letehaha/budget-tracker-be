import { RESPONSE_STATUS, CustomResponse, ERROR_CODES } from 'shared-types';
import * as Currencies from '../models/Currencies.model';

export const getAllCurrencies = async (req, res: CustomResponse) => {
  try {
    const data = await Currencies.getAllCurrencies();

    return res.status(200).json({
      status: RESPONSE_STATUS.success,
      response: data,
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
