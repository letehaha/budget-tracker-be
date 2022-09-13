import { Transaction } from 'sequelize/types';

import * as Transactions from '@models/Transactions.model';

export const getTransactionsByTransferId = async (
  {
    transferId,
    authorId,
    includeUser,
    includeAccount,
    includeCategory,
    includeAll,
    nestedInclude,
  }: {
    transferId: number;
    authorId: number;
    includeUser?: boolean;
    includeAccount?: boolean;
    includeCategory?: boolean;
    includeAll?: boolean;
    nestedInclude?: boolean;
  },
  { transaction }: { transaction?: Transaction } = {},
) => {
  try {
    const data = await Transactions.getTransactionsByTransferId({
      transferId,
      authorId,
      includeUser,
      includeAccount,
      includeCategory,
      includeAll,
      nestedInclude,
    }, { transaction });

    return data;
  } catch (err) {
    throw new err;
  }
};
