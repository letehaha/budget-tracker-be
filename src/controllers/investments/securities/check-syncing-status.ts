import { API_RESPONSE_STATUS } from 'shared-types';
import { CustomResponse } from '@common/types';
import * as syncSecuritiesService from '@services/investments/securities/sync-securities';
import { errorHandler } from '@controllers/helpers';

export const checkSecuritiesSyncingStatus = async (req, res: CustomResponse) => {
  try {
    const status = await syncSecuritiesService.checkSecuritiesSyncingStatus();

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: status,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};
