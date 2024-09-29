import { TRANSACTION_TYPES, ACCOUNT_TYPES } from 'shared-types';
import Balances from '@models/Balances.model';
import { TransactionsAttributes } from '@models/Transactions.model';
import * as BalancesModel from '@models/Balances.model';
import { withTransaction } from '@services/common';

export const updateBalanceOnTxUpdate = withTransaction(async ({ data, prevData }: Params) => {
  const { accountId, time } = data;
  const amount =
    data.transactionType === TRANSACTION_TYPES.income ? data.refAmount : data.refAmount * -1;
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);

  if (data.accountType === ACCOUNT_TYPES.system) {
    const originalDate = new Date(prevData.time);
    const originalAmount =
      prevData.transactionType === TRANSACTION_TYPES.income
        ? prevData.refAmount
        : prevData.refAmount * -1;
    originalDate.setHours(0, 0, 0, 0);

    if (
      // If the account ID changed,
      accountId !== prevData.accountId ||
      // the date changed,
      +date !== +originalDate ||
      // the transaction type changed,
      data.transactionType !== prevData.transactionType ||
      // or the amount changed
      amount
      // THEN remove the original transaction
    ) {
      await BalancesModel.default.updateRecord({
        accountId: prevData.accountId,
        date: originalDate,
        amount: -originalAmount,
      });
    }

    // Update the balance for the current account and date
    await BalancesModel.default.updateRecord({
      accountId,
      date,
      amount,
    });
  } else if (data.accountType === ACCOUNT_TYPES.monobank && data.externalData) {
    const balance = data.externalData.balance;

    // We don't need to calculate Monobank account balance based on tx since
    // Monobank already provides us with the actual balance.
    const existingRecordForTheDate = await Balances.findOne({
      where: {
        accountId,
        date,
      },
    });

    if (existingRecordForTheDate) {
      // Store the highest amount
      existingRecordForTheDate.amount =
        existingRecordForTheDate.amount > (balance || 0)
          ? existingRecordForTheDate.amount
          : (balance as number);

      await existingRecordForTheDate.save();
    } else {
      await Balances.create({
        accountId,
        date,
        amount: data.externalData.balance,
      });
    }
  }
});

interface Params {
  data: {
    accountId: number;
    accountType: ACCOUNT_TYPES;
    transactionType: TRANSACTION_TYPES;
    refAmount: number;
    time: string;
    externalData?: TransactionsAttributes['externalData'];
  };
  prevData: {
    accountId: number;
    accountType: ACCOUNT_TYPES;
    transactionType: TRANSACTION_TYPES;
    refAmount: number;
    time: string;
    externalData?: TransactionsAttributes['externalData'];
  };
}
