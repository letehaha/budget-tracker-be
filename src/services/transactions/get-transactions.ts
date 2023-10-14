import * as Transactions from '@models/Transactions.model';
import { GenericSequelizeModelAttributes } from '@common/types';
import { type GetTransactionsParams } from '@models/transactions';

export const getTransactions = async (
    params: GetTransactionsParams,
    attributes: GenericSequelizeModelAttributes = {},
) => {
  try {
    const data = await Transactions.getTransactions(params, { transaction: attributes.transaction });
    
    return data;
  } catch(err) {
    throw new err;
  }
};