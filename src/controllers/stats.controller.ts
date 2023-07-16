import { API_RESPONSE_STATUS, endpointsTypes } from 'shared-types';
import { CustomResponse } from '@common/types';
import * as statsService from '@services/stats';
import { errorHandler } from './helpers';

export const getBalanceHistory = async (req, res: CustomResponse) => {
  const { id: userId } = req.user;
  const { accountId, from, to }: endpointsTypes.GetBalanceHistoryPayload = req.query;

  try {
    // TODO:L validation for "from" and "to"
    const balanceHistory = await statsService.getBalanceHistory({
      userId,
      accountId: Number(accountId),
      from,
      to,
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: balanceHistory,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};
