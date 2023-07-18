import { GenericSequelizeModelAttributes } from '@common/types';

import { connection } from '@models/index';
import * as Balances from '@models/Balances.model';

export const getBalanceHistory = async (
  { userId, accountId, ...rest }: {
    userId: number;
    accountId?: number;
    from?: string;
    to?: string;
  },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const isTxPassedFromAbove = attributes.transaction !== undefined;
  const transaction = attributes.transaction ?? await connection.sequelize.transaction();

  try {
    let data
    if (accountId) {
      data = await Balances.getAccountBalanceHistory({ userId, accountId, ...rest }, {
        ...attributes,
        transaction,
      });
    } else {
      data = await Balances.getBalances({ userId, ...rest }, { ...attributes, transaction })
    }

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }

    return data;
  } catch (err) {
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }
    throw err;
  }
};
