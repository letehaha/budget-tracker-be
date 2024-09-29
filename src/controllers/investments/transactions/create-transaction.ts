import { z } from 'zod';
import { API_RESPONSE_STATUS, TRANSACTION_TYPES } from 'shared-types';
import { CustomRequest, CustomResponse } from '@common/types';
import { errorHandler } from '@controllers/helpers';

import * as investmentTransactionsService from '@services/investments/transactions';

export const createInvestmentTransaction = async (
  req: CustomRequest<typeof createInvestmentTransactionSchema>,
  res: CustomResponse,
) => {
  try {
    const { id: userId } = req.user;
    const { accountId, securityId, transactionType, date, name, quantity, price, fees } =
      req.validated.body;

    const data = await investmentTransactionsService.createInvestmentTransaction({
      userId,
      params: {
        accountId,
        securityId,
        transactionType,
        date,
        name,
        quantity: String(quantity),
        price: String(price),
        fees: String(fees),
      },
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: data,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};

const recordId = () => z.number().int().positive().finite();
export const createInvestmentTransactionBodySchema = z.object({
  accountId: recordId(),
  securityId: recordId(),
  transactionType: z.nativeEnum(TRANSACTION_TYPES),
  date: z.string().datetime({ message: 'Invalid ISO date string' }),
  name: z.string().max(1000, 'The string must not exceed 1000 characters.').nullish(),
  quantity: z.number().positive('Quantity must be greater than 0').finite(),
  price: z.number().positive('Price must be greater than 0').finite(),
  fees: z.number().positive('Fees must be greater than 0').finite(),
});

export const createInvestmentTransactionSchema = z.object({
  body: createInvestmentTransactionBodySchema,
});
