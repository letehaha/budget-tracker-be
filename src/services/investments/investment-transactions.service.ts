import { GenericSequelizeModelAttributes } from '@common/types';
import { connection } from '@models/index';
import InvestmentTransaction, {
  INVESTMENT_TRANSACTION_CATEGORY,
} from '@models/investments/InvestmentTransaction.model';
import { calculateRefAmount } from '../calculate-ref-amount.service';
import Security from '@models/investments/Security.model';
import { TRANSACTION_TYPES } from 'shared-types';
import Holding from '@models/investments/Holdings.model';
import SecurityPricing from '@models/investments/SecurityPricing.model';

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

    const result = await InvestmentTransaction.create(
      { ...creationParams, amount, refPrice, refAmount, refFees },
      {
        transaction,
      },
    );

    const currentPrice = await SecurityPricing.findOne({
      where: {
        securityId: params.securityId,
      },
      order: [['date', 'DESC']],
      transaction,
    });

    console.log('currentPrice', currentPrice);

    const currentHolding = await Holding.findOne({
      where: {
        accountId: params.accountId,
        securityId: params.securityId,
      },
      transaction,
    });

    const newQuantity =
      parseFloat(currentHolding.quantity) + parseFloat(params.quantity);
    const value = newQuantity * parseFloat(currentPrice.priceClose);
    const refValue = await calculateRefAmount(
      {
        amount: value,
        userId,
        baseCode: security.currencyCode,
      },
      { transaction },
    );

    await Holding.update(
      {
        value: String(value),
        refValue: String(refValue),
        quantity: String(newQuantity),
        costBasis: String(parseFloat(currentHolding.costBasis) + amount),
        refCostBasis: String(
          parseFloat(currentHolding.refCostBasis) + refAmount,
        ),
      },
      {
        where: {
          accountId: params.accountId,
          securityId: params.securityId,
        },
        transaction,
      },
    );

    // TODO: update account balance

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
