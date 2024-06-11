import { GenericSequelizeModelAttributes } from '@common/types';
import { connection } from '@models/index';
import InvestmentTransaction from '@models/investments/InvestmentTransaction.model';
import Accounts from '@models/Accounts.model';
import { removeUndefinedKeys } from '@js/helpers';

export async function getInvestmentTransactions(
  {
    accountId,
    securityId,
    userId,
  }: { accountId?: number; securityId?: number; userId: number },
  { transaction }: GenericSequelizeModelAttributes = {},
) {
  const isTxPassedFromAbove = transaction !== undefined;
  transaction = transaction ?? (await connection.sequelize.transaction());

  try {
    const result = await InvestmentTransaction.findAll({
      where: removeUndefinedKeys({ accountId, securityId }),
      include: [
        {
          // Check that accountId is associated with that user
          model: Accounts,
          where: { userId },
          // Don't include account info into response
          attributes: [],
        },
      ],
      transaction,
    });

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }

    return result;
  } catch (err) {
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }

    throw err;
  }
}
