import { ERROR_CODES } from 'shared-types';
import { CustomResponse, RESPONSE_STATUS } from '@common/types';
import { getAllSystemCurrencies } from '@services/system-currencies';

export const getAllCurrencies = async (req, res: CustomResponse) => {
  try {
    const data = await getAllSystemCurrencies();

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
