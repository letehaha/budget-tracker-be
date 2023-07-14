import { GenericSequelizeModelAttributes } from '@common/types';

import { connection } from '@models/index';
import * as Balances from '@models/Balances.model';

export const getAccountBalanceHistory = async (
  payload: {
    userId: number;
    accountId: number;
  },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const isTxPassedFromAbove = attributes.transaction !== undefined;
  const transaction = attributes.transaction ?? await connection.sequelize.transaction();

  try {
    const data = await Balances.getAccountBalanceHistory(payload, {
      ...attributes,
      transaction,
    });

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }

    return data;
  } catch (err) {
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }
    throw new err;
  }
};
