import { API_RESPONSE_STATUS, TRANSACTION_TYPES } from 'shared-types';
import { getRefundTransactions, type GetRefundTransactionsParams } from '@services/tx-refunds/get-refunds.service';
import { BadRequestError } from '@js/errors';
import { errorHandler } from '@controllers/helpers';
import { CustomResponse } from '@common/types';

export async function getRefunds(req, res: CustomResponse) {
  try {
    const { id: userId } = req.user;
    const { categoryId, transactionType, accountId, page, limit } = req.query;
    const filters: GetRefundTransactionsParams = { userId };

    if (page < 0 || limit < 0) {
      throw new BadRequestError({ message: 'Invalid pagination params' });
    }

    if (categoryId) {
      const parsedCategoryId = parseInt(categoryId as string, 10);

      if (isNaN(parsedCategoryId)) {
        throw new BadRequestError({ message: 'Invalid category ID provided' });
      }
      filters.categoryId = parsedCategoryId;
    }

    if (transactionType) {
      if (!Object.values(TRANSACTION_TYPES).includes(transactionType as TRANSACTION_TYPES)) {
        throw new BadRequestError({ message: 'Invalid transaction type provided' });
      }
      filters.transactionType = transactionType;
    }

    if (accountId) {
      const parsedAccountId = parseInt(accountId as string, 10);
      if (isNaN(parsedAccountId)) {
        throw new BadRequestError({ message: 'Invalid account ID provided' });
      }
      filters.accountId = parsedAccountId;
    }

    if (page) {
      const pageNum = parseInt(page as string, 10);
      if (isNaN(pageNum) || pageNum < 1) {
        throw new BadRequestError({ message: 'Invalid page number provided' });
      }
      filters.page = pageNum;
    }

    if (limit) {
      const limitNum = parseInt(limit as string, 10);
      if (isNaN(limitNum) || limitNum < 1) {
        throw new BadRequestError({ message: 'Invalid limit provided' });
      }
      filters.limit = limitNum;
    }

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
