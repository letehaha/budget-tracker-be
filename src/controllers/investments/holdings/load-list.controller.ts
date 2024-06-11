import { API_RESPONSE_STATUS } from 'shared-types';
import { CustomResponse } from '@common/types';
import * as holdingsService from '@services/investments/holdings';
import { errorHandler } from '@controllers/helpers';

export const loadHoldings = async (req, res: CustomResponse) => {
  const { id: userId } = req.user;

  try {
    const holdings = await holdingsService.loadHoldingsList({
      userId,
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: holdings,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};
