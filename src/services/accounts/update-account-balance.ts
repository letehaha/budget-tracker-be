import { TRANSACTION_TYPES } from 'shared-types';
import * as Accounts from '@models/Accounts.model';
import { withTransaction } from '@services/common';
import { getAccountById } from '@services/accounts';
import { updateBalanceOnTxDelete } from '../account-balances/update-balance-on-tx-delete';

async function updateAccountBalanceForChangedTxImpl({
  accountId,
  userId,
  transactionType,
  amount = 0,
  prevAmount = 0,
  refAmount = 0,
  prevRefAmount = 0,
  prevTransactionType = transactionType,
  updateBalancesTable = false,
  time,
}: {
  accountId: number;
  userId: number;
  transactionType: TRANSACTION_TYPES;
  amount?: number;
  prevAmount?: number;
  refAmount?: number;
  prevRefAmount?: number;
  prevTransactionType?: TRANSACTION_TYPES;
  currencyId?: number;
  updateBalancesTable?: boolean;
  time?: string;
}): Promise<void> {
  const account = await getAccountById({ id: accountId, userId });

  if (!account) return undefined;

  const { currentBalance, refCurrentBalance } = account;

  // const transactionCreation = amount !== 0 && prevAmount === 0;
  const transactionDeletion = amount === 0 && prevAmount !== 0;
  // const transactionUpdation = amount !== 0 && prevAmount !== 0;

  const newAmount = defineCorrectAmountFromTxType(amount, transactionType);
  const oldAmount = defineCorrectAmountFromTxType(prevAmount, prevTransactionType);
  const newRefAmount = defineCorrectAmountFromTxType(refAmount, transactionType);
  const oldRefAmount = defineCorrectAmountFromTxType(prevRefAmount, prevTransactionType);

  // TODO: for now keep that deadcode, cause it doesn't really work. But when have time, recheck it past neednes
  // if (currencyId !== accountCurrencyId) {
  //   const { rate } = await userExchangeRateService.getExchangeRate({
  //     userId,
  //     baseId: currencyId,
  //     quoteId: accountCurrencyId,
  //   }, { transaction });

  //   newAmount = defineCorrectAmountFromTxType(amount * rate, transactionType)
  // }

  await Accounts.updateAccountById({
    id: accountId,
    userId,
    currentBalance: calculateNewBalance(newAmount, oldAmount, currentBalance),
    refCurrentBalance: calculateNewBalance(newRefAmount, oldRefAmount, refCurrentBalance),
  });

  if (updateBalancesTable && time) {
    if (transactionDeletion) {
      await updateBalanceOnTxDelete({
        accountId,
        transactionType: transactionType,
        prevRefAmount,
        time: new Date(time).toISOString(),
      });
    }
  }
}

export const updateAccountBalanceForChangedTx = withTransaction(
  updateAccountBalanceForChangedTxImpl,
);

const calculateNewBalance = (amount: number, previousAmount: number, currentBalance: number) => {
  if (amount > previousAmount) {
    return currentBalance + (amount - previousAmount);
  } else if (amount < previousAmount) {
    return currentBalance - (previousAmount - amount);
  }

  return currentBalance;
};

const defineCorrectAmountFromTxType = (amount: number, transactionType: TRANSACTION_TYPES) => {
  return transactionType === TRANSACTION_TYPES.income ? amount : amount * -1;
};
