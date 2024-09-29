import { makeRequest } from '../common';
import { z } from 'zod';
import * as investmentService from '@services/investments/transactions';
import { createInvestmentTransactionBodySchema } from '@controllers/investments/transactions/create-transaction';

export function createInvestmentTransaction<R extends boolean | undefined = undefined>({
  raw,
  payload,
}: {
  raw?: R;
  payload: z.infer<typeof createInvestmentTransactionBodySchema>;
}) {
  return makeRequest<Awaited<ReturnType<typeof investmentService.createInvestmentTransaction>>, R>({
    method: 'post',
    url: '/investing/transaction',
    payload,
    raw,
  });
}
