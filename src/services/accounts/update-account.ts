import { ACCOUNT_TYPES, API_ERROR_CODES } from 'shared-types';
import * as Accounts from '@models/Accounts.model';
import { NotFoundError, UnexpectedError } from '@js/errors';
import Balances from '@models/Balances.model';
import { calculateRefAmount } from '@services/calculate-ref-amount.service';
import { withTransaction } from '@services/common';

export const updateAccount = withTransaction(
  async ({
    id,
    externalId,
    ...payload
  }: Accounts.UpdateAccountByIdPayload &
    (
      | Pick<Accounts.UpdateAccountByIdPayload, 'id'>
      | Pick<Accounts.UpdateAccountByIdPayload, 'externalId'>
    )) => {
    const accountData = await Accounts.default.findByPk(id);

    if (!accountData) {
      throw new NotFoundError({ message: 'Account not found!' });
    }

    const currentBalanceIsChanging =
      payload.currentBalance !== undefined && payload.currentBalance !== accountData.currentBalance;
    let initialBalance = accountData.initialBalance;
    let refInitialBalance = accountData.refInitialBalance;
    let refCurrentBalance = accountData.refCurrentBalance;

    /**
     * If `currentBalance` is changing, it means user want to change current balance
     * but without creating adjustment transaction, so instead we change both `initialBalance`
     * and `currentBalance` on the same diff
     */
    if (currentBalanceIsChanging && payload.currentBalance !== undefined) {
      const diff = payload.currentBalance - accountData.currentBalance;
      const refDiff = await calculateRefAmount({
        userId: accountData.userId,
        amount: diff,
        baseId: accountData.currencyId,
      });

      // --- for system accounts
      // change currentBalance => change initialBalance
      // change currentBalance => recalculate refInitialBalance
      // --- for all accounts
      // change currentBalance => recalculate refCurrentBalance
      if (accountData.type === ACCOUNT_TYPES.system) {
        initialBalance += diff;
        refInitialBalance += refDiff;
      }
      refCurrentBalance += refDiff;
    }

    const result = await Accounts.updateAccountById({
      id,
      externalId,
      initialBalance,
      refInitialBalance,
      refCurrentBalance,
      ...payload,
    });

    if (!result) {
      throw new UnexpectedError(API_ERROR_CODES.unexpected, 'Account updation is not successful');
    }

    await Balances.handleAccountChange({ account: result, prevAccount: accountData });

    return result;
  },
);
