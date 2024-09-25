import {
  TRANSACTION_TYPES,
  INVESTMENT_TRANSACTION_CATEGORY,
  InvestmentTransactionModel,
} from 'shared-types';
import InvestmentTransaction from '@models/investments/InvestmentTransaction.model';
import { calculateRefAmount } from '@services/calculate-ref-amount.service';
import Security from '@models/investments/Security.model';
import Holding from '@models/investments/Holdings.model';
import { updateAccountBalanceForChangedTx } from '@services/accounts.service';
import Currencies from '@models/Currencies.model';
import { logger } from '@js/utils';
import { ValidationError } from '@js/errors';
import { withTransaction } from '@root/services/common';

type CreationParams = Pick<
  InvestmentTransactionModel,
  'accountId' | 'securityId' | 'transactionType' | 'date' | 'name' | 'quantity' | 'price' | 'fees'
>;

/**
 *
 * 1. Create tx with the correct values
 * 2. Update Holdings
 * 3. Update Account balances
 * 4. Update Balances table
 */
export const createInvestmentTransaction = withTransaction(
  async ({ params, userId }: { params: CreationParams; userId: number }) => {
    try {
      const security = await Security.findOne({
        where: {
          id: params.securityId,
        },
      });

      if (!security) {
        throw new ValidationError({
          message: `Security with id ${params.securityId} does not exist.`,
        });
      }

      const currentHolding = await Holding.findOne({
        where: {
          accountId: params.accountId,
          securityId: params.securityId,
        },
      });

      if (!currentHolding) {
        throw new ValidationError({
          message: `Holding for account ${params.accountId} and security ${params.securityId} does not exist.`,
        });
      }

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
      const refAmount = await calculateRefAmount({
        amount,
        userId,
        baseCode: security.currencyCode,
      });
      const refPrice = await calculateRefAmount({
        amount: parseFloat(params.price),
        userId,
        baseCode: security.currencyCode,
      });
      const refFees = params.fees
        ? await calculateRefAmount({
            amount: parseFloat(params.fees),
            userId,
            baseCode: security.currencyCode,
          })
        : parseFloat(params.fees);

      const result = await InvestmentTransaction.create({
        ...creationParams,
        amount: String(amount),
        refPrice: String(refPrice),
        refAmount: String(refAmount),
        refFees: String(refFees),
      });

      const newQuantity = parseFloat(currentHolding.quantity) + parseFloat(params.quantity);
      const value = newQuantity * parseFloat(params.price);

      const refValue = await calculateRefAmount({
        amount: value,
        userId,
        baseCode: security.currencyCode,
      });

      const newCostBasis: number =
        parseFloat(currentHolding.costBasis) + amount + parseFloat(params.fees);
      const newRefCostBasis: number = parseFloat(currentHolding.refCostBasis) + refAmount + refFees;

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
        },
      );

      const currency = await Currencies.findOne({
        where: { code: security.currencyCode },
      });

      await updateAccountBalanceForChangedTx({
        userId,
        accountId: params.accountId,
        transactionType: params.transactionType,
        // We store amounts in Account as integer, so need to mutiply that by 100
        amount: Math.floor((parseFloat(currentHolding.costBasis) + amount) * 100),
        refAmount: Math.floor((parseFloat(currentHolding.refCostBasis) + refAmount) * 100),
        currencyId: currency!.id,
      });

      return result;
    } catch (err) {
      logger.error(err);
      if (err.parent) logger.error(err.parent);

      throw err;
    }
  },
);
