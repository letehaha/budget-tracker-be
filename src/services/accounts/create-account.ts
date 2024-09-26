import { AccountModel } from 'shared-types';
import * as Accounts from '@models/Accounts.model';
import { calculateRefAmount } from '@services/calculate-ref-amount.service';
import { withTransaction } from '@services/common';

export const createAccount = withTransaction(
  async (
    payload: Omit<Accounts.CreateAccountPayload, 'refCreditLimit' | 'refInitialBalance'>,
  ): Promise<AccountModel | null> => {
    const { userId, creditLimit, currencyId, initialBalance } = payload;
    const refCreditLimit = await calculateRefAmount({
      userId: userId,
      amount: creditLimit,
      baseId: currencyId,
    });

    const refInitialBalance = await calculateRefAmount({
      userId,
      amount: initialBalance,
      baseId: currencyId,
    });

    return Accounts.createAccount({
      ...payload,
      refCreditLimit,
      refInitialBalance,
    });
  },
);
