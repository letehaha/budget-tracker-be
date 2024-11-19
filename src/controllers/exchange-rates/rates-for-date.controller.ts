import { z } from 'zod';
import type { CustomResponse } from '@common/types';
import { API_RESPONSE_STATUS } from 'shared-types';
import { errorHandler } from '@controllers/helpers';
import * as getExchangeRatesService from '@services/exchange-rates';

export const getExchangeRatesForDate = async (req, res: CustomResponse) => {
  try {
    const { date }: GetExchangeRatesForDateParams['params'] = req.validated.params;

    const result = await getExchangeRatesService.getExchangeRatesForDate({ date });

    return res.status(201).json({
      status: API_RESPONSE_STATUS.success,
      response: result,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};

export const getExchangeRatesForDateSchema = z.object({
  params: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
});

type GetExchangeRatesForDateParams = z.infer<typeof getExchangeRatesForDateSchema>;
