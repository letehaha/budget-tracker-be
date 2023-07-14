import { API_RESPONSE_STATUS } from 'shared-types';
import { CustomResponse } from '@common/types';
import * as statsService from '@services/stats';
import { errorHandler } from './helpers';

export const getAccountBalanceHistory = async (req, res: CustomResponse) => {
  const { id } = req.user;
  const { id: accountId } = req.params;

  try {
    const balanceHistory = await statsService.getAccountBalanceHistory({ userId: id, accountId });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: balanceHistory,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};
