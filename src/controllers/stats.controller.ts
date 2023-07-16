import { API_RESPONSE_STATUS, endpointsTypes } from 'shared-types';
import { isValid, isBefore } from 'date-fns';
import { CustomResponse } from '@common/types';
import * as statsService from '@services/stats';
import { errorHandler } from './helpers';
import { ValidationError } from '@js/errors';

export const getBalanceHistory = async (req, res: CustomResponse) => {
  const { id: userId } = req.user;
  const { accountId, from, to }: endpointsTypes.GetBalanceHistoryPayload = req.query;

  try {
    if (from && !isValid(new Date(from))) throw new ValidationError({ message: '"from" is invalid date.' })
    if (to && !isValid(new Date(to))) throw new ValidationError({ message: '"to" is invalid date.' })
    if (from && to && !isBefore(new Date(from), new Date(to))) {
      throw new ValidationError({ message: '"from" cannot be greater than "to" date.' })
    }

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
