import { API_RESPONSE_STATUS, TRANSACTION_TYPES } from 'shared-types';
import { z } from 'zod';
import { getRefundTransactions, type GetRefundTransactionsParams } from '@services/tx-refunds/get-refunds.service';
import { errorHandler } from '@controllers/helpers';
import { CustomResponse } from '@common/types';
import { recordId } from '@common/lib/zod/custom-types';

export async function getRefunds(req, res: CustomResponse) {
  try {
    const { id: userId } = req.user;
    const { categoryId, transactionType, accountId, page, limit }: GetRefundsSchemaParams['query'] =
      req.validated.query;
    const filters: GetRefundTransactionsParams = { userId };

    if (categoryId) filters.categoryId = categoryId;
    if (transactionType) filters.transactionType = transactionType;
    if (accountId) filters.accountId = accountId;

    if (page) filters.page = page;
    if (limit) filters.limit = limit;

    const { rows: refundTransactions, meta } = await getRefundTransactions(filters);

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: {
        data: refundTransactions,
        meta,
      },
    });
  } catch (err) {
    errorHandler(res, err);
  }
}

export const getRefundsSchema = z.object({
  query: z.object({
    categoryId: recordId().optional(),
    accountId: recordId().optional(),
    transactionType: z.nativeEnum(TRANSACTION_TYPES).optional(),
    page: z.coerce.number().int().positive().finite(),
    limit: z.coerce.number().int().positive().finite(),
  }),
});

type GetRefundsSchemaParams = z.infer<typeof getRefundsSchema>;
