import { API_RESPONSE_STATUS } from 'shared-types';
import { CustomResponse } from '@common/types';
import * as syncSecuritiesService from '@services/investments/securities/sync-securities';
import { errorHandler } from '@controllers/helpers';

export const syncSecuritiesData = async (req, res: CustomResponse) => {
  try {
    await syncSecuritiesService.syncSecuritiesData();

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};
