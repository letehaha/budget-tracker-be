import * as Transactions from '@models/Transactions.model';
import type { GetTransactionsParams } from '@models/transactions';
import { withTransaction } from '../common';

export const getTransactions = withTransaction(async (params: GetTransactionsParams) => {
  const data = await Transactions.getTransactions(params);

  return data;
});
