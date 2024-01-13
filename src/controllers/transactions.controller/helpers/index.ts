import { TRANSACTION_TRANSFER_NATURE } from 'shared-types';
import { ValidationError } from '@js/errors';
import { CreateTransactionParams } from '@services/transactions/types';

export const validateTransactionAmount = (amount): void => {
  if (amount === 0)
    throw new ValidationError({ message: 'Amount cannot be 0.' });
  if (amount < 0)
    throw new ValidationError({ message: 'Amount should be positive.' });
  if (!Number.isInteger(amount))
    throw new ValidationError({ message: 'Amount should be an integer.' });
};

export const validateTransactionCreation = (
  params: CreateTransactionParams,
) => {
  const {
    amount,
    transferNature,
    accountId,
    destinationAccountId,
    destinationAmount,
    destinationTransactionId,
  } = params;

  if (transferNature === TRANSACTION_TRANSFER_NATURE.transfer_out_wallet) {
    if (accountId && destinationAccountId)
      throw new ValidationError({
        message: `"accountId" and "destinationAccountId" cannot be used both when "${TRANSACTION_TRANSFER_NATURE.transfer_out_wallet}" is provided`,
      });

    if (accountId) validateTransactionAmount(amount);
    if (destinationAccountId) validateTransactionAmount(destinationAmount);
  } else {
    validateTransactionAmount(amount);

    if (transferNature === TRANSACTION_TRANSFER_NATURE.common_transfer) {
      if (destinationTransactionId) return;

      if (!(accountId && destinationAccountId))
        throw new ValidationError({
          message: `Both "accountId" and "destinationAccountId" should be provided when "${TRANSACTION_TRANSFER_NATURE.common_transfer}" is provided`,
        });
      if (!(amount && destinationAmount))
        throw new ValidationError({
          message: `Both "amount" and "destinationAmount" should be provided when "${TRANSACTION_TRANSFER_NATURE.common_transfer}" is provided`,
        });
    }
  }
};
