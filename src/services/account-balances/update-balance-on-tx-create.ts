import { TRANSACTION_TYPES, ACCOUNT_TYPES } from 'shared-types';
import Balances from '@models/Balances.model';
import { TransactionsAttributes } from '@models/Transactions.model';
import * as BalancesModel from '@models/Balances.model';

export async function updateBalanceOnTxCreate({
  accountId,
  accountType,
  transactionType,
  refAmount,
  time,
  externalData,
}: Params) {
  const amount = transactionType === TRANSACTION_TYPES.income ? refAmount : refAmount * -1;
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);

  if (accountType === ACCOUNT_TYPES.system) {
    await BalancesModel.default.updateRecord({
      accountId,
      date,
      amount,
    });
  } else if (accountType === ACCOUNT_TYPES.monobank && externalData) {
    const balance = externalData.balance;

    const existingRecordForTheDate = await Balances.findOne({
      where: {
        accountId,
        date,
      },
    });

    if (existingRecordForTheDate) {
      existingRecordForTheDate.amount =
        existingRecordForTheDate.amount > (balance || 0)
          ? existingRecordForTheDate.amount
          : (balance as number);

      await existingRecordForTheDate.save();
    } else {
      await Balances.create({
        accountId,
        date,
        amount: externalData.balance,
      });
    }
  }
}

interface Params {
  accountId: number;
  accountType: ACCOUNT_TYPES;
  transactionType: TRANSACTION_TYPES;
  refAmount: number;
  time: string;
  externalData?: TransactionsAttributes['externalData'];
}
