import { ERROR_CODES } from 'shared-types'

import { Transaction } from 'sequelize/types';

import { UnexpectedError } from '@js/errors'
import { logger} from '@js/utils/logger';
import * as accountsService from '@services/accounts.service';

export const calculateNewBalance = (
  amount: number,
  previousAmount: number,
  currentBalance: number,
) => {
  if (amount > previousAmount) {
    return currentBalance + (amount - previousAmount)
  } else if (amount < previousAmount) {
    return currentBalance - (previousAmount - amount)
  }

  return currentBalance
}

/**
 * Updates the balance of the account associated with the transaction
 */
 export const updateAccountBalance = async (
  {
    accountId,
    userId,
    amount,
    // keep it 0 be default for the tx creation flow
    previousAmount = 0,
  }: {
    accountId: number;
    userId: number;
    amount: number;
    previousAmount?: number;
  },
  { transaction }: { transaction: Transaction },
): Promise<void> => {
  try {
    const { currentBalance } = await accountsService.getAccountById(
      { id: accountId, userId },
      { transaction },
    );

    await accountsService.updateAccount(
      {
        id: accountId,
        userId,
        currentBalance: calculateNewBalance(amount, previousAmount ?? 0, currentBalance),
      },
      { transaction },
    )
  } catch (e) {
    logger.error(e);
    if (!accountId) {
      throw new UnexpectedError(
        ERROR_CODES.txServiceUpdateBalance,
        'Cannot update balance. "accountId" is missing.',
      )
    }
    throw new UnexpectedError(
      ERROR_CODES.txServiceUpdateBalance,
      'Cannot update balance.'
    )
  }
};
