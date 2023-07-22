import { GenericSequelizeModelAttributes } from '@common/types';
import * as Transactions from '@models/Transactions.model';

export const getTransactionById = async (
  {
    id,
    userId,
    includeUser,
    includeAccount,
    includeCategory,
    includeAll,
    nestedInclude,
  }: {
    id: number;
    userId: number;
    includeUser?: boolean;
    includeAccount?: boolean;
    includeCategory?: boolean;
    includeAll?: boolean;
    nestedInclude?: boolean;
  },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  try {
    const data = await Transactions.getTransactionById({
      id,
      userId,
      includeUser,
      includeAccount,
      includeCategory,
      includeAll,
      nestedInclude,
    }, { transaction: attributes.transaction });

    return data;
  } catch (err) {
    throw new err;
  }
};
