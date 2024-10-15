import { API_RESPONSE_STATUS } from 'shared-types';
import { CustomResponse } from '@common/types';
import * as holdingsService from '@services/investments/holdings';
import { errorHandler } from '@controllers/helpers';

export const createHolding = async (req, res: CustomResponse) => {
  const { id: userId } = req.user;
  const { accountId, securityId }: { accountId: number; securityId: number } = req.body;

  try {
    const holding = await holdingsService.createHolding({
      accountId,
      securityId,
      userId,
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: holding,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};
