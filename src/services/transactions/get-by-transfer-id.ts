import * as Transactions from '@models/Transactions.model';
import { withTransaction } from '../common';

export const getTransactionsByTransferId = withTransaction(
  async ({
    transferId,
    userId,
  }: Parameters<typeof Transactions.getTransactionsByTransferId>[0]) => {
    const data = await Transactions.getTransactionsByTransferId({
      transferId,
      userId,
    });

    return data;
  },
);
