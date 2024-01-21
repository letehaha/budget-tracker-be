import * as Transactions from '@models/Transactions.model';
import { GenericSequelizeModelAttributes } from '@common/types';
import type { GetTransactionsParams } from '@models/transactions';

export const getTransactions = async (
  params: GetTransactionsParams,
  attributes: GenericSequelizeModelAttributes = {},
) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const data = await Transactions.getTransactions(params, {
      transaction: attributes.transaction,
    });

    return data;
  } catch (err) {
    throw err;
  }
};
