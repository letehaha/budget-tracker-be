import { GenericSequelizeModelAttributes } from '@common/types';
import { connection } from '@models/index';
import InvestmentTransaction, {
  INVESTMENT_TRANSACTION_CATEGORY,
} from '@models/investments/InvestmentTransaction.model';
import { calculateRefAmount } from '../calculate-ref-amount.service';
import Security from '@models/investments/Security.model';
import { TRANSACTION_TYPES } from 'shared-types';

type CreationParams = Pick<
  InvestmentTransaction,
  | 'accountId'
  | 'securityId'
  | 'transactionType'
  | 'date'
  | 'name'
  | 'quantity'
  | 'price'
  | 'fees'
>;

export async function createInvestmentTransaction(
  { params, userId }: { params: CreationParams; userId: number },
  { transaction }: GenericSequelizeModelAttributes = {},
) {
  const isTxPassedFromAbove = transaction !== undefined;
  transaction = transaction ?? (await connection.sequelize.transaction());

  try {
    const security = await Security.findOne({
      where: {
        id: params.securityId,
      },
      transaction,
    });

    const creationParams = {
      accountId: params.accountId,
      securityId: params.securityId,
      transactionType: params.transactionType,
      date: params.date,
      name: params.name,
      quantity: params.quantity,
      price: params.price,
      fees: params.fees,
      currencyCode: security.currencyCode,
      category:
        params.transactionType === TRANSACTION_TYPES.income
          ? INVESTMENT_TRANSACTION_CATEGORY.buy
          : INVESTMENT_TRANSACTION_CATEGORY.sell,
    };
    const amount = parseFloat(params.quantity) * parseFloat(params.price);
    const refAmount = await calculateRefAmount(
      { amount, userId, baseCode: security.currencyCode },
      { transaction },
    );
    const refPrice = await calculateRefAmount(
      {
        amount: parseFloat(params.price),
        userId,
        baseCode: security.currencyCode,
      },
      { transaction },
    );
    const refFees = params.fees
      ? await calculateRefAmount(
          {
            amount: parseFloat(params.fees),
            userId,
            baseCode: security.currencyCode,
          },
          { transaction },
        )
      : params.fees;

    console.log('creation-params', {
      ...creationParams,
      amount,
      refPrice,
      refAmount,
      refFees,
    });
    const result = await InvestmentTransaction.create(
      { ...creationParams, amount, refPrice, refAmount, refFees },
      {
        transaction,
      },
    );

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
