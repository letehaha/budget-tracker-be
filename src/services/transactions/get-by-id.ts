import * as Transactions from '@models/Transactions.model';
import { withTransaction } from '../common';

export const getTransactionById = withTransaction(
  async ({ id, userId }: Parameters<typeof Transactions.getTransactionById>[0]) => {
    const data = await Transactions.getTransactionById({
      id,
      userId,
    });

    return data;
  },
);
