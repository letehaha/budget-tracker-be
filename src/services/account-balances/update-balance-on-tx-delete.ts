import { TRANSACTION_TYPES } from 'shared-types';
import * as BalancesModel from '@models/Balances.model';
import { withTransaction } from '@services/common';

export const updateBalanceOnTxDelete = withTransaction(
  async ({ accountId, transactionType, prevRefAmount, time }: Params) => {
    let amount = transactionType === TRANSACTION_TYPES.income ? prevRefAmount : prevRefAmount * -1;
    const date = new Date(time);
    date.setHours(0, 0, 0, 0);

    amount = -amount;

    await BalancesModel.default.updateRecord({
      accountId,
      date,
      amount,
    });
  },
);

interface Params {
  accountId: number;
  transactionType: TRANSACTION_TYPES;
  prevRefAmount: number;
  time: string;
}
