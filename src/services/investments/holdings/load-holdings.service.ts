import { GenericSequelizeModelAttributes } from '@common/types';
import { connection } from '@models/index';
import Accounts from '@models/Accounts.model';
import Users from '@models/Users.model';
import Holdings from '@models/investments/Holdings.model';

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
          model: Accounts,
          required: true,
          where: { userId }, // Direct filtering by userId on the Account
          include: [
            {
              model: Users,
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
