import { API_RESPONSE_STATUS, endpointsTypes } from 'shared-types';
import { isValid, isBefore } from 'date-fns';
import { CustomResponse } from '@common/types';
import * as statsService from '@services/stats';
import { errorHandler } from './helpers';
import { ValidationError } from '@js/errors';

export const getBalanceHistory = async (req, res: CustomResponse) => {
  const { id: userId } = req.user;
  const { from, to }: endpointsTypes.GetBalanceHistoryPayload = req.query;

  try {
    if (from && !isValid(new Date(from))) throw new ValidationError({ message: '"from" is invalid date.' })
    if (to && !isValid(new Date(to))) throw new ValidationError({ message: '"to" is invalid date.' })
    if (from && to && !isBefore(new Date(from), new Date(to))) {
      throw new ValidationError({ message: '"from" cannot be greater than "to" date.' })
    }

    const balanceHistory = await statsService.getBalanceHistory({
      userId,
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

export const getTotalBalance = async (req, res: CustomResponse) => {
  const { id: userId } = req.user;
  const { date }: endpointsTypes.GetTotalBalancePayload = req.query;

  try {
    if (!isValid(new Date(date))) throw new ValidationError({ message: '"date" is invalid date.' })

    const totalBalance = await statsService.getTotalBalance({
      userId,
      date,
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: totalBalance,
    });

  } catch (err) {
    errorHandler(res, err);
  }
}
