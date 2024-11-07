import {
  TRANSACTION_TYPES,
  INVESTMENT_TRANSACTION_CATEGORY,
  InvestmentTransactionModel,
} from 'shared-types';
import InvestmentTransaction from '@models/investments/InvestmentTransaction.model';
import { calculateRefAmount } from '@services/calculate-ref-amount.service';
import Security from '@models/investments/Security.model';
import Holding from '@models/investments/Holdings.model';
import { updateAccountBalanceForChangedTx } from '@services/accounts';
import Currencies from '@models/Currencies.model';
import { logger } from '@js/utils';
import { ValidationError } from '@js/errors';
import { withTransaction } from '@root/services/common';
import Accounts from '@models/Accounts.model';

type CreationParams = Pick<
  InvestmentTransactionModel,
  'accountId' | 'securityId' | 'transactionType' | 'date' | 'quantity' | 'price' | 'fees'
>;

/**
 *
 * 1. Create tx with the correct values
 * 2. Update Holdings
 * 3. Update Account balances
 * 4. Update Balances table
 */
export const createInvestmentTransaction = withTransaction(
  async ({
    params,
    userId,
  }: {
    params: CreationParams & { name?: string | null };
    userId: number;
  }) => {
    try {
      const security = await Security.findOne({
        where: {
          id: params.securityId,
        },
      });

      const initialAccount = (await Accounts.findOne({
        where: { id: params.accountId, userId },
      }))!;

      console.log('initialAccount_balance', initialAccount.currentBalance);

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

      // NFLX-USD – security, but base currency is UAH, means that transaction will have
      // amount in USD, and refAmount in {baseCurrency} (UAH)
      // Investment account strictly has currencyCode as baseCurrency
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

      console.log('result', result);

      const newQuantity =
        result.category === INVESTMENT_TRANSACTION_CATEGORY.buy
          ? parseFloat(currentHolding.quantity) + parseFloat(params.quantity)
          : parseFloat(currentHolding.quantity) - parseFloat(params.quantity);

      const newHoldingValue = newQuantity * parseFloat(params.price);

      console.log('newHoldingValue', newHoldingValue);

      const newHoldingRefValue = await calculateRefAmount({
        amount: newHoldingValue,
        userId,
        baseCode: security.currencyCode,
      });

      console.log('newHoldingRefValue', newHoldingRefValue);

      const [newCostBasis, newRefCostBasis] =
        params.transactionType === TRANSACTION_TYPES.income
          ? [
              parseFloat(currentHolding.costBasis) + amount + parseFloat(params.fees),
              parseFloat(currentHolding.refCostBasis) + refAmount + refFees,
            ]
          : [
              parseFloat(currentHolding.costBasis) - amount + parseFloat(params.fees),
              parseFloat(currentHolding.refCostBasis) - refAmount + refFees,
            ];

      const [, updatedHoldings] = await Holding.update(
        {
          value: String(newHoldingValue),
          refValue: String(newHoldingRefValue),
          quantity: String(newQuantity),
          costBasis: String(newCostBasis),
          refCostBasis: String(newRefCostBasis),
        },
        {
          where: {
            accountId: params.accountId,
            securityId: params.securityId,
          },
          returning: true,
        },
      );
      const updatedHolding = updatedHoldings[0]!;

      const currency = await Currencies.findOne({
        where: { code: security.currencyCode },
      });

      const account = (await Accounts.findOne({
        where: { id: params.accountId, userId },
      }))!;

      console.log({
        userId,
        accountId: params.accountId,
        transactionType: params.transactionType,
        // We store amounts in Account as integer, so need to mutiply that by 100
        amount: Math.floor((parseFloat(updatedHolding.costBasis) + amount) * 100),
        refAmount: Math.floor((parseFloat(updatedHolding.refCostBasis) + refAmount) * 100),
        currencyId: currency!.id,
        accountType: account.type,
        time: new Date(params.date).toISOString(),
      });

      await updateAccountBalanceForChangedTx({
        userId,
        accountId: params.accountId,
        transactionType: params.transactionType,
        // We store amounts in Account as integer, so need to mutiply that by 100
        amount: Math.floor((parseFloat(updatedHolding.costBasis) + amount) * 100),
        refAmount: Math.floor((parseFloat(updatedHolding.refCostBasis) + refAmount) * 100),
        currencyId: currency!.id,
        accountType: account.type,
        time: new Date(params.date).toISOString(),
      });

      return result;
    } catch (err) {
      logger.error(err);
      if (err.parent) logger.error(err.parent);

      throw err;
    }
  },
);
