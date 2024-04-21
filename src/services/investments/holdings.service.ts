import { GenericSequelizeModelAttributes } from '@common/types';
import { connection } from '@models/index';

import Account from '@models/Accounts.model';
import User from '@models/Users.model';
import Holdings from '@models/investments/Holdings.model';
import Security from '@models/investments/Security.model';

export async function loadHoldingsList(
  { userId }: { userId: number },
  { transaction }: GenericSequelizeModelAttributes = {},
) {
  const isTxPassedFromAbove = transaction !== undefined;
  transaction = transaction ?? (await connection.sequelize.transaction());

  try {
    const holdings = await Holdings.findAll({
      include: [
        {
          model: Account,
          required: true,
          where: { userId }, // Direct filtering by userId on the Account
          include: [
            {
              model: User,
              required: true,
            },
          ],
        },
      ],
      transaction,
    });

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }

    return holdings;
  } catch (err) {
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }

    throw err;
  }
}

// TODO: e2e tests
export async function addHolding(
  {
    userId,
    accountId,
    securityId,
  }: { userId: number; accountId: number; securityId: number },
  { transaction }: GenericSequelizeModelAttributes = {},
) {
  const isTxPassedFromAbove = transaction !== undefined;
  transaction = transaction ?? (await connection.sequelize.transaction());

  try {
    const account = await Account.findOne({
      where: {
        id: accountId,
        userId,
      },
      transaction,
    });

    if (!account) {
      throw new Error('Account does not belong to the user or does not exist.');
    }

    const security = await Security.findOne({
      where: { id: securityId },
      transaction,
    });

    if (!security) {
      throw new Error('Security does not exist.');
    }

    const [holding] = await Holdings.findOrCreate({
      where: { accountId, securityId },
      defaults: {
        accountId,
        securityId,
        value: '0',
        refValue: '0',
        quantity: '0',
        costBasis: '0',
        refCostBasis: '0',
      },
      transaction,
    });

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }

    return holding;
  } catch (err) {
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }

    throw err;
  }
}

// TODO: Update existing via InvestmentTransactions
// TODO: Delete existing
// TODO: Check that existing is being deleted if Account is also deleted
