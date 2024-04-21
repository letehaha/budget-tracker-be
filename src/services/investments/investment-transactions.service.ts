import {
  TRANSACTION_TYPES,
  INVESTMENT_TRANSACTION_CATEGORY,
  InvestmentTransactionModel,
} from 'shared-types';
import { GenericSequelizeModelAttributes } from '@common/types';
import { connection } from '@models/index';
import InvestmentTransaction from '@models/investments/InvestmentTransaction.model';
import { calculateRefAmount } from '../calculate-ref-amount.service';
import Security from '@models/investments/Security.model';
import Holding from '@models/investments/Holdings.model';
import Accounts from '@models/Accounts.model';
import { removeUndefinedKeys } from '@js/helpers';
import { updateAccountBalanceForChangedTx } from '@services/accounts.service';
import Currencies from '@models/Currencies.model';

type CreationParams = Pick<
  InvestmentTransactionModel,
  | 'accountId'
  | 'securityId'
  | 'transactionType'
  | 'date'
  | 'name'
  | 'quantity'
  | 'price'
  | 'fees'
>;

/**
 *
 * 1. Create tx with the correct values
 * 2. Update Holdings
 * 3. Update Account balances
 * 4. Update Balances table
 */
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
      : parseFloat(params.fees);

    const result = await InvestmentTransaction.create(
      {
        ...creationParams,
        amount: String(amount),
        refPrice: String(refPrice),
        refAmount: String(refAmount),
        refFees: String(refFees),
      },
      {
        transaction,
      },
    );

    const currentHolding = await Holding.findOne({
      where: {
        accountId: params.accountId,
        securityId: params.securityId,
      },
      transaction,
    });

    const newQuantity =
      parseFloat(currentHolding.quantity) + parseFloat(params.quantity);
    const value = newQuantity * parseFloat(params.price);

    const refValue = await calculateRefAmount(
      {
        amount: value,
        userId,
        baseCode: security.currencyCode,
      },
      { transaction },
    );

    const newCostBasis: number =
      parseFloat(currentHolding.costBasis) + amount + parseFloat(params.fees);
    const newRefCostBasis: number =
      parseFloat(currentHolding.refCostBasis) + refAmount + refFees;

    await Holding.update(
      {
        value: String(value),
        refValue: String(refValue),
        quantity: String(newQuantity),
        costBasis: String(newCostBasis),
        refCostBasis: String(newRefCostBasis),
      },
      {
        where: {
          accountId: params.accountId,
          securityId: params.securityId,
        },
        transaction,
      },
    );

    const currency = await Currencies.findOne({
      where: { code: security.currencyCode },
      transaction,
    });

    await updateAccountBalanceForChangedTx(
      {
        userId,
        accountId: params.accountId,
        transactionType: params.transactionType,
        // We store amounts in Account as integer, so need to mutiply that by 100
        amount: Math.floor(
          (parseFloat(currentHolding.costBasis) + amount) * 100,
        ),
        refAmount: Math.floor(
          (parseFloat(currentHolding.refCostBasis) + refAmount) * 100,
        ),
        currencyId: currency.id,
      },
      { transaction },
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
